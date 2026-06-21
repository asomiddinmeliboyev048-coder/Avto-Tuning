// ============================================================
//  RACE ARENA v2 — racing_track.glb (ColMesh) bilan ishlaydi
//  - GLB ga raycast collision: binolar/devorlardan o'tmaydi
//  - yer balandligini topib mashinani o'tirg'izadi (uchmaydi)
//  - yo'l darajasini aniqlab FAQAT yo'lda harakatlanadi
//  - avtomatik spawn + yo'nalish aniqlash (ochiq yo'l tomon)
//  - rul tuzatilgan, chuqur multi-layer dvigatel ovozi
// ============================================================
import { Component, Suspense, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Environment, Html, useGLTF } from "@react-three/drei";
import {
  ArrowLeft, Play, RotateCcw, Trophy, Flag,
  ChevronUp, ChevronDown, ChevronLeft, ChevronRight,
} from "lucide-react";
import * as THREE from "three";
import "./RaceArena.css";

const TRACK_URL = "/models/racing_track.glb";
const TRACK_TARGET = 180;     // normallashtirilgan eng uzun o'lcham
const ROAD_TOL = 2.2;         // yo'l tekisligi dopuski (bino = baland => blok)
const FINISH_DIST = 120;      // spawn'dan finishgacha masofa
const TARGET_CAR_LENGTH = 3.0;
const CAR_FACING = Math.PI;   // model old tomonini to'g'rilash: 0|Math.PI|±Math.PI/2

const RACE_CARS = [
  { id: "player", path: "/models/spark.glb", color: "#ff3d3d", row: 0, side: -1, controllable: true, ai: 0 },
  { id: "ai1", path: "/models/bmw_m5.glb", color: "#2f7dff", row: 0, side: 1, ai: 15 },
  { id: "ai2", path: "/models/kia_k5.glb", color: "#eef0f4", row: 1, side: -1, ai: 14 },
  { id: "ai3", path: "/models/porschee911.glb", color: "#f4b73f", row: 1, side: 1, ai: 16 },
];

const bodyKeys = ["body", "kuzov", "carpaint", "paint", "chassis", "hood", "door", "bumper", "fender", "roof", "bonnet", "trunk", "quarter"];
const glassKeys = ["glass", "oyna", "window", "windshield", "windscreen", "clearglass"];
const wheelKeys = ["rim", "diska", "disc", "wheel_disk", "alloy"];
const tireKeys = ["tire", "tyre", "rubber", "shina"];
const includesAny = (v, keys) => keys.some((k) => v.includes(k));

function cloneScene(scene) {
  const clone = scene.clone(true);
  clone.traverse((c) => {
    if (!c.isMesh) return;
    if ((c.name?.toLowerCase() ?? "").includes("cube")) { c.visible = false; return; }
    c.castShadow = true; c.receiveShadow = true;
    c.material = Array.isArray(c.material) ? c.material.map((m) => m.clone()) : c.material?.clone();
  });
  return clone;
}

function normalizedCarTransform(object) {
  const box = new THREE.Box3().setFromObject(object);
  const size = new THREE.Vector3(); const center = new THREE.Vector3();
  box.getSize(size); box.getCenter(center);
  const longest = Math.max(size.x, size.z, 0.001);
  const scale = TARGET_CAR_LENGTH / longest;
  return { scale, position: [-center.x * scale, -box.min.y * scale, -center.z * scale] };
}

/* ----------------- Chuqur dvigatel ovozi (WebAudio, multi-layer) ----------------- */
class EngineAudio {
  constructor() { this.ctx = null; this.ready = false; }
  init() {
    if (this.ctx) return;
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) return;
    const ctx = new Ctx();
    this.ctx = ctx;
    this.master = ctx.createGain(); this.master.gain.value = 0;
    // chuqur rumble uchun low-pass filtr
    this.lp = ctx.createBiquadFilter(); this.lp.type = "lowpass";
    this.lp.frequency.value = 700; this.lp.Q.value = 6;
    this.lp.connect(this.master); this.master.connect(ctx.destination);
    // qatlamlar: 2 sawtooth (detune) + 1 triangle (sub oktava)
    const mk = (type, gain) => { const o = ctx.createOscillator(); o.type = type; const g = ctx.createGain(); g.gain.value = gain; o.connect(g).connect(this.lp); o.start(); return o; };
    this.o1 = mk("sawtooth", 0.16);
    this.o2 = mk("sawtooth", 0.12);
    this.o3 = mk("triangle", 0.20);
    // shovqin (screech) buferi
    const buf = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
    const d = buf.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    this.noise = buf;
    this.ready = true;
  }
  resume() { this.ctx?.resume?.(); }
  startEngine() { if (!this.ready) return; this.resume(); this.master.gain.setTargetAtTime(0.55, this.ctx.currentTime, 0.12); this.rev(); }
  stopEngine() { if (!this.ready) return; this.master.gain.setTargetAtTime(0.0001, this.ctx.currentTime, 0.3); }
  rev() {
    if (!this.ready) return;
    const t = this.ctx.currentTime;
    [this.o1, this.o2, this.o3].forEach((o, i) => {
      const base = i === 2 ? 32 : 64;
      o.frequency.cancelScheduledValues(t);
      o.frequency.setValueAtTime(base, t);
      o.frequency.exponentialRampToValueAtTime(base * 3.2, t + 0.45);
      o.frequency.exponentialRampToValueAtTime(base * 1.4, t + 1.1);
    });
  }
  // gaz: eksponensial pitch; tezlikka qarab filtr ochiladi
  setRPM(speed, throttle) {
    if (!this.ready) return;
    const t = this.ctx.currentTime;
    const norm = THREE.MathUtils.clamp(speed / 27, 0, 1);
    const base = 60 * Math.pow(2.4, norm) * (throttle ? 1.18 : 0.92); // eksponensial
    this.o1.frequency.setTargetAtTime(base, t, 0.08);
    this.o2.frequency.setTargetAtTime(base * 1.01, t, 0.08);
    this.o3.frequency.setTargetAtTime(base * 0.5, t, 0.08);
    this.lp.frequency.setTargetAtTime(500 + norm * 1600 + (throttle ? 300 : 0), t, 0.1);
  }
  brakeDrop() {
    if (!this.ready) return;
    const t = this.ctx.currentTime;
    [this.o1, this.o2, this.o3].forEach((o, i) => {
      o.frequency.cancelScheduledValues(t);
      o.frequency.setTargetAtTime(i === 2 ? 26 : 52, t, 0.12);
    });
    this.screech();
  }
  screech() {
    if (!this.ready) return;
    const t = this.ctx.currentTime;
    const src = this.ctx.createBufferSource(); src.buffer = this.noise;
    const bp = this.ctx.createBiquadFilter(); bp.type = "bandpass"; bp.frequency.value = 2200; bp.Q.value = 9;
    const g = this.ctx.createGain(); g.gain.value = 0;
    src.connect(bp).connect(g).connect(this.ctx.destination);
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(0.28, t + 0.04);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.55);
    src.start(t); src.stop(t + 0.6);
  }
  dispose() { try { this.ctx?.close?.(); } catch { /* ignore */ } this.ctx = null; this.ready = false; }
}

/* ----------------------------- Trassa ----------------------------- */
function TrackModel({ trackRef, onReady }) {
  const { scene } = useGLTF(TRACK_URL);
  const track = useMemo(() => {
    const clone = cloneScene(scene);
    let box = new THREE.Box3().setFromObject(clone);
    const size = new THREE.Vector3(); box.getSize(size);
    const longest = Math.max(size.x, size.z, 0.001);
    const scale = TRACK_TARGET / longest;
    clone.scale.setScalar(scale);
    clone.updateMatrixWorld(true);
    box = new THREE.Box3().setFromObject(clone);
    const center = new THREE.Vector3(); box.getCenter(center);
    clone.position.set(-center.x, -box.min.y, -center.z);
    clone.updateMatrixWorld(true);
    // asfalt materiali + soyalar (tekstura yo'q => kulrang muammosi)
    clone.traverse((c) => {
      if (!c.isMesh || !c.material) return;
      c.castShadow = true; c.receiveShadow = true;
      const mats = Array.isArray(c.material) ? c.material : [c.material];
      mats.forEach((m) => {
        if (!m.map) m.color = new THREE.Color("#34373d"); // asfalt-beton
        if ("roughness" in m) m.roughness = 0.93;
        if ("metalness" in m) m.metalness = 0.04;
        if ("envMapIntensity" in m) m.envMapIntensity = 0.6;
        m.needsUpdate = true;
      });
    });
    return clone;
  }, [scene]);

  useEffect(() => { if (onReady) onReady(); }, [track, onReady]);
  return <primitive ref={trackRef} object={track} />;
}

/* ----------------------------- Mashina ----------------------------- */
function CarModel({ car, registerRef }) {
  const { scene } = useGLTF(car.path);
  const model = useMemo(() => cloneScene(scene), [scene]);
  const transform = useMemo(() => normalizedCarTransform(model), [model]);
  useEffect(() => {
    model.traverse((child) => {
      if (!child.isMesh || !child.material) return;
      const meshName = child.name?.toLowerCase() ?? "";
      const matName = Array.isArray(child.material)
        ? child.material.map((m) => m.name ?? "").join(" ").toLowerCase()
        : child.material.name?.toLowerCase() ?? "";
      const target = `${meshName} ${matName}`;
      const mats = Array.isArray(child.material) ? child.material : [child.material];
      mats.forEach((m) => {
        if (includesAny(target, glassKeys)) { m.color.set("#141a26"); m.transparent = true; m.opacity = 0.5; m.roughness = 0.08; }
        else if (includesAny(target, tireKeys)) { m.color.set("#0e0e0e"); m.roughness = 0.85; }
        else if (includesAny(target, wheelKeys)) { m.color.set("#d6d9df"); m.metalness = 0.85; m.roughness = 0.22; }
        else if (includesAny(target, bodyKeys)) { m.color.set(car.color); m.metalness = 0.45; m.roughness = 0.22; if ("clearcoat" in m) m.clearcoat = 0.8; }
        m.needsUpdate = true;
      });
    });
  }, [car.color, model]);
  return (
    <group ref={registerRef}>
      <group rotation={[0, CAR_FACING, 0]}>
        <primitive object={model} scale={transform.scale} position={transform.position} />
      </group>
    </group>
  );
}

function ArenaLights() {
  return (
    <>
      <ambientLight intensity={0.9} color="#dfe9ff" />
      <hemisphereLight args={["#cfe0ff", "#0e1218", 0.7]} />
      <directionalLight
        castShadow position={[60, 90, 40]} intensity={2.6} color="#fff4e2"
        shadow-mapSize-width={2048} shadow-mapSize-height={2048}
        shadow-camera-left={-140} shadow-camera-right={140}
        shadow-camera-top={140} shadow-camera-bottom={-140}
        shadow-camera-near={1} shadow-camera-far={400}
      />
      <directionalLight position={[-50, 40, -30]} intensity={0.8} color="#9fd0ff" />
    </>
  );
}

/* ----------------------------- Simulyatsiya + collision ----------------------------- */
function RaceWorld({ gameStateRef, controlsRef, telemetryRef, onFinish }) {
  const trackRef = useRef(null);
  const carRefs = useRef({});
  const { camera } = useThree();
  const ray = useRef(new THREE.Raycaster());
  const down = useMemo(() => new THREE.Vector3(0, -1, 0), []);
  const finishedRef = useRef(false);
  const layout = useRef({ ready: false, spawn: new THREE.Vector3(), forward: new THREE.Vector3(0, 0, -1), perp: new THREE.Vector3(1, 0, 0), roadY: 0 });
  const sim = useRef(RACE_CARS.map((c) => ({ id: c.id, x: 0, y: 0, z: 0, heading: 0, speed: 0, controllable: !!c.controllable, ai: c.ai, row: c.row, side: c.side })));

  // yer balandligi (trassaga raycast)
  const groundY = (x, z) => {
    if (!trackRef.current) return null;
    ray.current.set(new THREE.Vector3(x, 120, z), down);
    ray.current.far = 400;
    const hits = ray.current.intersectObject(trackRef.current, true);
    return hits.length ? hits[0].point.y : null;
  };
  // oldindagi to'siqgacha masofa (devor/bino)
  const clearAhead = (x, y, z, dirX, dirZ, max) => {
    if (!trackRef.current) return max;
    ray.current.set(new THREE.Vector3(x, y, z), new THREE.Vector3(dirX, 0, dirZ).normalize());
    ray.current.far = max;
    const hits = ray.current.intersectObject(trackRef.current, true);
    return hits.length ? hits[0].distance : max;
  };

  // trassa tayyor bo'lgach: eng past (yo'l) nuqtani topib spawn + yo'nalishni aniqlash
  const setup = () => {
    const L = TRACK_TARGET / 2;
    let lowest = null;
    for (let gx = -L + 10; gx <= L - 10; gx += 12) {
      for (let gz = -L + 10; gz <= L - 10; gz += 12) {
        const y = groundY(gx, gz);
        if (y == null) continue;
        if (!lowest || y < lowest.y) lowest = { x: gx, y, z: gz };
      }
    }
    if (!lowest) { layout.current.ready = true; return; }
    const roadY = lowest.y;
    // shu balandlikka yaqin (yo'l) nuqtalar orasidan eng kattasini topish — markaz
    const roadPts = [];
    for (let gx = -L + 8; gx <= L - 8; gx += 8) {
      for (let gz = -L + 8; gz <= L - 8; gz += 8) {
        const y = groundY(gx, gz);
        if (y != null && Math.abs(y - roadY) < ROAD_TOL) roadPts.push(new THREE.Vector3(gx, y, gz));
      }
    }
    // spawn = yo'l nuqtalarining "chekkasi" (eng katta z yoki x) — ochiq tomonga qaraydi
    let spawn = roadPts[0] || new THREE.Vector3(lowest.x, roadY, lowest.z);
    roadPts.forEach((p) => { if (p.z > spawn.z) spawn = p; });
    // yo'nalish: 16 yo'nalishda eng uzun ochiq yo'l (yo'l darajasida)
    let best = { d: -1, ang: Math.PI };
    for (let a = 0; a < Math.PI * 2; a += Math.PI / 8) {
      const dx = Math.sin(a), dz = -Math.cos(a);
      // shu yo'nalishda yo'l davom etadimi (bir necha qadam tekshirish)
      let reach = 0;
      for (let step = 6; step <= 60; step += 6) {
        const y = groundY(spawn.x + dx * step, spawn.z + dz * step);
        if (y != null && Math.abs(y - roadY) < ROAD_TOL) reach = step; else break;
      }
      if (reach > best.d) best = { d: reach, ang: a };
    }
    const ang = best.ang;
    const forward = new THREE.Vector3(Math.sin(ang), 0, -Math.cos(ang));
    const perp = new THREE.Vector3(forward.z, 0, -forward.x);
    layout.current = { ready: true, spawn: spawn.clone(), forward, perp, roadY };
    // mashinalarni gridga joylash (spawn ortida)
    sim.current.forEach((s) => {
      const pos = spawn.clone()
        .addScaledVector(forward, -s.row * 4 - 2)
        .addScaledVector(perp, s.side * 1.7);
      s.x = pos.x; s.z = pos.z; s.heading = ang; s.speed = 0;
      s.y = groundY(s.x, s.z) ?? roadY;
    });
  };

  useFrame((_, dt) => {
    if (trackRef.current && !layout.current.ready) setup();
    if (!layout.current.ready) return;
    const delta = Math.min(dt, 0.05);
    const racing = gameStateRef.current === "racing";
    const { spawn, forward, roadY } = layout.current;

    sim.current.forEach((s) => {
      if (racing) {
        if (s.controllable) {
          const c = controlsRef.current;
          const accel = c.up ? 30 : c.down ? -18 : 0;
          s.speed += accel * delta;
          if (!c.up && !c.down) s.speed *= 0.99;
          s.speed = THREE.MathUtils.clamp(s.speed, -7, 27);
          // RUL TUZATILDI
          const steer = (c.right ? 1 : 0) - (c.left ? 1 : 0);
          const grip = THREE.MathUtils.clamp(Math.abs(s.speed) / 9, 0.18, 1);
          s.heading += steer * 1.7 * grip * delta;
        } else {
          const target = s.ai + Math.sin(performance.now() / 800 + s.side) * 1.2;
          s.speed += (target - s.speed) * 3.5 * delta;
          s.speed = THREE.MathUtils.clamp(s.speed, 0, 24);
          // AI: oldida to'siq bo'lsa burilib qochadi
          const dx = Math.sin(s.heading), dz = -Math.cos(s.heading);
          const ahead = clearAhead(s.x, s.y + 0.6, s.z, dx, dz, 12);
          if (ahead < 7) s.heading += 0.9 * delta * (Math.random() > 0.5 ? 1 : -1);
        }

        // harakat + collision
        const dx = Math.sin(s.heading), dz = -Math.cos(s.heading);
        const step = s.speed * delta;
        const ahead = clearAhead(s.x, s.y + 0.6, s.z, dx, dz, Math.abs(step) + 2.2);
        if (s.speed > 0 && ahead < 2.2) {
          s.speed = -s.speed * 0.25; // devorga urildi -> qaytadi
        } else {
          const nx = s.x + dx * step, nz = s.z + dz * step;
          const ny = groundY(nx, nz);
          // faqat yo'l darajasida harakat (bino/chekka => blok)
          if (ny != null && Math.abs(ny - roadY) < ROAD_TOL) {
            s.x = nx; s.z = nz;
          } else {
            s.speed *= -0.2; // yo'ldan chiqish bloklandi
          }
        }
      }
      // yerga o'tirg'izish
      const gy = groundY(s.x, s.z);
      if (gy != null) s.y += (gy - s.y) * 0.5;
      const g = carRefs.current[s.id];
      if (g) { g.position.set(s.x, s.y, s.z); g.rotation.y = s.heading; }
    });

    const player = sim.current.find((s) => s.controllable);
    if (player) {
      const traveled = new THREE.Vector3(player.x - spawn.x, 0, player.z - spawn.z).dot(forward);
      const progress = THREE.MathUtils.clamp(traveled / FINISH_DIST, 0, 1);
      let pos = 1;
      sim.current.forEach((s) => {
        if (s.controllable) return;
        const td = new THREE.Vector3(s.x - spawn.x, 0, s.z - spawn.z).dot(forward);
        if (td > traveled) pos++;
      });
      telemetryRef.current = { speed: Math.abs(player.speed), progress, position: pos };

      if (gameStateRef.current !== "idle") {
        const camX = player.x - Math.sin(player.heading) * 9.5;
        const camZ = player.z + Math.cos(player.heading) * 9.5;
        camera.position.lerp(new THREE.Vector3(camX, player.y + 4.4, camZ), 0.09);
        camera.lookAt(player.x, player.y + 0.9, player.z - Math.cos(player.heading) * 3 - 0);
      }
      if (racing && !finishedRef.current && traveled >= FINISH_DIST) {
        finishedRef.current = true; onFinish(pos);
      }
    }
  });

  return (
    <>
      <ArenaLights />
      <Suspense fallback={<Html center><div className="arena__loading">Trassa yuklanmoqda...</div></Html>}>
        <TrackErrorBoundary>
          <TrackModel trackRef={trackRef} />
        </TrackErrorBoundary>
        {RACE_CARS.map((car) => (
          <CarModel key={car.id} car={car} registerRef={(el) => (carRefs.current[car.id] = el)} />
        ))}
        <Environment preset="city" background={false} />
      </Suspense>
    </>
  );
}

class TrackErrorBoundary extends Component {
  constructor(p) { super(p); this.state = { e: false }; }
  static getDerivedStateFromError() { return { e: true }; }
  render() { return this.state.e ? null : this.props.children; }
}

/* ----------------------------- Sahifa ----------------------------- */
export default function RaceArena() {
  const navigate = useNavigate();
  const [gameState, _setGameState] = useState("idle");
  const gameStateRef = useRef("idle");
  const setGameState = (s) => { gameStateRef.current = s; _setGameState(s); };

  const [countdown, setCountdown] = useState(3);
  const [result, setResult] = useState(null);
  const [hud, setHud] = useState({ speed: 0, progress: 0, position: 1 });
  const [raceKey, setRaceKey] = useState(0);
  const [isTouch, setIsTouch] = useState(false);

  const controlsRef = useRef({ up: false, down: false, left: false, right: false });
  const telemetryRef = useRef({ speed: 0, progress: 0, position: 1 });
  const timersRef = useRef([]);
  const audioRef = useRef(null);
  const wrapRef = useRef(null);

  useEffect(() => { setIsTouch("ontouchstart" in window || navigator.maxTouchPoints > 0); }, []);
  useEffect(() => { audioRef.current = new EngineAudio(); return () => audioRef.current?.dispose(); }, []);

  useEffect(() => {
    const map = { KeyW: "up", ArrowUp: "up", KeyS: "down", ArrowDown: "down", KeyA: "left", ArrowLeft: "left", KeyD: "right", ArrowRight: "right" };
    const dn = (e) => {
      const k = map[e.code]; if (!k) return; e.preventDefault();
      if (!controlsRef.current[k]) {
        controlsRef.current[k] = true;
        if (k === "down" && telemetryRef.current.speed > 6) audioRef.current?.brakeDrop();
      }
    };
    const up = (e) => { if (map[e.code]) controlsRef.current[map[e.code]] = false; };
    window.addEventListener("keydown", dn);
    window.addEventListener("keyup", up);
    return () => { window.removeEventListener("keydown", dn); window.removeEventListener("keyup", up); };
  }, []);

  useEffect(() => {
    if (gameState !== "racing") return;
    let raf;
    const tick = () => {
      const t = telemetryRef.current;
      setHud({ ...t });
      audioRef.current?.setRPM(t.speed, controlsRef.current.up);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [gameState]);

  const clearTimers = () => { timersRef.current.forEach(clearTimeout); timersRef.current = []; };
  const beginCountdown = () => {
    setGameState("countdown"); setCountdown(3);
    timersRef.current.push(setTimeout(() => setCountdown(2), 1000));
    timersRef.current.push(setTimeout(() => setCountdown(1), 2000));
    timersRef.current.push(setTimeout(() => { setCountdown(0); setGameState("racing"); audioRef.current?.startEngine(); }, 3000));
  };
  const startRace = async () => {
    setResult(null); setRaceKey((k) => k + 1);
    controlsRef.current = { up: false, down: false, left: false, right: false };
    audioRef.current?.init(); audioRef.current?.resume();
    if (isTouch && wrapRef.current) {
      try { await wrapRef.current.requestFullscreen?.(); } catch { /* ignore */ }
      try { await screen.orientation?.lock?.("landscape"); } catch { /* ignore */ }
    }
    clearTimers(); beginCountdown();
  };
  const restart = () => { setResult(null); clearTimers(); setRaceKey((k) => k + 1); beginCountdown(); };
  const onFinish = (pos) => { setResult(pos); setGameState("finished"); audioRef.current?.stopEngine(); };
  useEffect(() => () => { clearTimers(); audioRef.current?.stopEngine(); }, []);

  const bindBtn = (key) => ({
    onPointerDown: (e) => { e.preventDefault(); controlsRef.current[key] = true; if (key === "down" && telemetryRef.current.speed > 6) audioRef.current?.brakeDrop(); },
    onPointerUp: (e) => { e.preventDefault(); controlsRef.current[key] = false; },
    onPointerLeave: () => { controlsRef.current[key] = false; },
    onPointerCancel: () => { controlsRef.current[key] = false; },
  });

  const speedKmh = Math.round(hud.speed * 11);

  return (
    <div className="arena" ref={wrapRef}>
      <Canvas
        key={raceKey} shadows dpr={[1, 2]}
        camera={{ position: [0, 8, 20], fov: 55, near: 0.1, far: 600 }}
        gl={{ antialias: true }}
        onCreated={({ gl }) => {
          gl.outputColorSpace = THREE.SRGBColorSpace;
          gl.toneMapping = THREE.ACESFilmicToneMapping;
          gl.toneMappingExposure = 1.15;
          gl.shadowMap.enabled = true;
          gl.shadowMap.type = THREE.PCFSoftShadowMap;
        }}
      >
        <color attach="background" args={["#0b0e14"]} />
        <fog attach="fog" args={["#0b0e14", 90, 240]} />
        <RaceWorld gameStateRef={gameStateRef} controlsRef={controlsRef} telemetryRef={telemetryRef} onFinish={onFinish} />
      </Canvas>

      <button className="arena__back" onClick={() => navigate("/")}><ArrowLeft size={18} /> Chiqish</button>

      {(gameState === "racing" || gameState === "countdown") && (
        <div className="arena__hud">
          <div className="arena__gauge"><span>{speedKmh}</span><small>km/s</small></div>
          <div className="arena__pos"><span>{hud.position}</span><small>/ {RACE_CARS.length}</small></div>
          <div className="arena__bar"><div style={{ width: `${hud.progress * 100}%` }} /><Flag size={13} /></div>
        </div>
      )}

      {gameState === "countdown" && <div className="arena__count">{countdown > 0 ? countdown : "GO!"}</div>}

      {gameState === "idle" && (
        <div className="arena__overlay">
          <Trophy size={48} className="arena__icon" />
          <h2>Poyga arenasi</h2>
          <p>racing_track.glb · raycast collision · AI raqiblar</p>
          <button className="arena__start" onClick={startRace}><Play size={20} fill="#fff" /> Boshlash</button>
          <span className="arena__hint">{isTouch ? "📱 Ekran yon buriladi + tugmalar" : "⌨️ WASD / strelkalar · S = tormoz"}</span>
        </div>
      )}

      {gameState === "finished" && (
        <div className="arena__overlay">
          <div className="arena__medal">{result === 1 ? "🥇" : result === 2 ? "🥈" : result === 3 ? "🥉" : "🏁"}</div>
          <h2>{result === 1 ? "G'olib!" : `${result}-o'rin`}</h2>
          <p>{result === 1 ? "Ajoyib haydash!" : "Yana urinib ko'ring!"}</p>
          <div className="arena__overlay-btns">
            <button className="arena__start" onClick={restart}><RotateCcw size={18} /> Qayta</button>
            <button className="arena__ghost" onClick={() => navigate("/")}>Bosh sahifa</button>
          </div>
        </div>
      )}

      {isTouch && (gameState === "racing" || gameState === "countdown") && (
        <div className="arena__touch">
          <div className="arena__steer">
            <button className="arena__tbtn" {...bindBtn("left")}><ChevronLeft size={30} /></button>
            <button className="arena__tbtn" {...bindBtn("right")}><ChevronRight size={30} /></button>
          </div>
          <div className="arena__pedals">
            <button className="arena__tbtn arena__tbtn--brake" {...bindBtn("down")}><ChevronDown size={26} /></button>
            <button className="arena__tbtn arena__tbtn--gas" {...bindBtn("up")}><ChevronUp size={34} /></button>
          </div>
        </div>
      )}
    </div>
  );
}

useGLTF.preload(TRACK_URL);
RACE_CARS.forEach((c) => useGLTF.preload(c.path));
