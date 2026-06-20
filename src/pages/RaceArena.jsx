// ============================================================
//  RACE ARENA — to'liq ekran 3D poyga (Forza uslubida)
//  - racing_track.glb real trassa + yorqin yoritish
//  - mashinalar yerga o'tiradi (raycast bilan), uchmaydi
//  - barcha mashinalar finish tomon to'g'ri qaraydi
//  - rul tuzatilgan (chap = chap, o'ng = o'ng)
//  - WebAudio: dvigatel revi, gaz pitch, tormoz screech
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

/* ----------------------------- Sozlamalar ----------------------------- */
const TRACK_URL = "/models/racing_track.glb";
const TRACK_LENGTH = 200;            // normallashtirilgan uzunlik (z bo'ylab)
const START_Z = TRACK_LENGTH / 2 - 14;
const FINISH_Z = -(TRACK_LENGTH / 2 - 14);
const ROAD_HALF = 5.4;               // yo'lak yarmi (lateral chegara)
const TARGET_CAR_LENGTH = 3.0;
// Model old tomoni -z ga qarashi uchun tuzatish.
// Agar mashinalar teskari/yon qarasa, bu qiymatni o'zgartiring: 0 | Math.PI | Math.PI/2 | -Math.PI/2
const CAR_FACING = Math.PI;

const RACE_CARS = [
  { id: "player", label: "Siz", path: "/models/spark.glb", color: "#ff3d3d", lane: -3.2, controllable: true, ai: 0 },
  { id: "ai1", label: "BMW M5", path: "/models/bmw_m5.glb", color: "#2f7dff", lane: -1.1, ai: 17.5 },
  { id: "ai2", label: "Kia K5", path: "/models/kia_k5.glb", color: "#eef0f4", lane: 1.1, ai: 16.6 },
  { id: "ai3", label: "Porsche", path: "/models/porschee911.glb", color: "#f4b73f", lane: 3.2, ai: 18.4 },
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

/* ----------------------------- Dvigatel audiosi (WebAudio) ----------------------------- */
class EngineAudio {
  constructor() { this.ctx = null; this.ready = false; }
  init() {
    if (this.ctx) return;
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) return;
    this.ctx = new Ctx();
    this.master = this.ctx.createGain(); this.master.gain.value = 0; this.master.connect(this.ctx.destination);
    this.osc = this.ctx.createOscillator(); this.osc.type = "sawtooth"; this.osc.frequency.value = 55;
    this.oscGain = this.ctx.createGain(); this.oscGain.gain.value = 0.16;
    this.osc.connect(this.oscGain).connect(this.master);
    this.sub = this.ctx.createOscillator(); this.sub.type = "square"; this.sub.frequency.value = 28;
    this.subGain = this.ctx.createGain(); this.subGain.gain.value = 0.07;
    this.sub.connect(this.subGain).connect(this.master);
    this.osc.start(); this.sub.start();
    const buf = this.ctx.createBuffer(1, this.ctx.sampleRate, this.ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    this.noise = buf;
    this.ready = true;
  }
  resume() { this.ctx?.resume?.(); }
  startEngine() { if (!this.ready) return; this.resume(); const t = this.ctx.currentTime; this.master.gain.setTargetAtTime(0.5, t, 0.1); this.rev(); }
  stopEngine() { if (!this.ready) return; this.master.gain.setTargetAtTime(0.0001, this.ctx.currentTime, 0.25); }
  rev() {
    if (!this.ready) return;
    const t = this.ctx.currentTime;
    this.osc.frequency.cancelScheduledValues(t);
    this.osc.frequency.setValueAtTime(55, t);
    this.osc.frequency.linearRampToValueAtTime(240, t + 0.5);
    this.osc.frequency.linearRampToValueAtTime(95, t + 1.1);
  }
  setSpeed(speed, throttle) {
    if (!this.ready) return;
    const f = 55 + speed * 9 + (throttle ? 28 : 0);
    const t = this.ctx.currentTime;
    this.osc.frequency.setTargetAtTime(f, t, 0.07);
    this.sub.frequency.setTargetAtTime(f / 2, t, 0.07);
  }
  screech() {
    if (!this.ready) return;
    const t = this.ctx.currentTime;
    const src = this.ctx.createBufferSource(); src.buffer = this.noise;
    const bp = this.ctx.createBiquadFilter(); bp.type = "bandpass"; bp.frequency.value = 1700; bp.Q.value = 7;
    const g = this.ctx.createGain(); g.gain.value = 0;
    src.connect(bp).connect(g).connect(this.ctx.destination);
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(0.22, t + 0.04);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.45);
    src.start(t); src.stop(t + 0.5);
  }
  dispose() { try { this.ctx?.close?.(); } catch { /* ignore */ } this.ctx = null; this.ready = false; }
}

/* ----------------------------- Trassa ----------------------------- */
function TrackModel({ trackRef }) {
  const { scene } = useGLTF(TRACK_URL);
  const track = useMemo(() => {
    const clone = cloneScene(scene);
    // uzun o'qni z ga to'g'rilash
    let box = new THREE.Box3().setFromObject(clone);
    const size = new THREE.Vector3(); box.getSize(size);
    if (size.x > size.z) { clone.rotation.y = Math.PI / 2; clone.updateMatrixWorld(true); }
    // masshtab (uzunlik ~ TRACK_LENGTH)
    box = new THREE.Box3().setFromObject(clone);
    box.getSize(size);
    const longest = Math.max(size.x, size.z, 0.001);
    const scale = TRACK_LENGTH / longest;
    clone.scale.setScalar(scale);
    clone.updateMatrixWorld(true);
    // markazlash + yerga o'tirg'izish (min.y -> 0)
    box = new THREE.Box3().setFromObject(clone);
    const center = new THREE.Vector3(); box.getCenter(center);
    clone.position.set(-center.x, -box.min.y, -center.z);
    clone.updateMatrixWorld(true);
    // materiallarni yorqinroq qilish
    clone.traverse((c) => {
      if (!c.isMesh || !c.material) return;
      c.receiveShadow = true;
      const mats = Array.isArray(c.material) ? c.material : [c.material];
      mats.forEach((m) => {
        if ("metalness" in m) m.metalness = Math.min(m.metalness ?? 0.2, 0.25);
        if ("roughness" in m) m.roughness = Math.min(Math.max(m.roughness ?? 0.7, 0.4), 0.95);
        if ("envMapIntensity" in m) m.envMapIntensity = 1.1;
        m.needsUpdate = true;
      });
    });
    return clone;
  }, [scene]);

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
      {/* old tomonni -z ga qaratish uchun ichki burilish */}
      <group rotation={[0, CAR_FACING, 0]}>
        <primitive object={model} scale={transform.scale} position={transform.position} />
      </group>
    </group>
  );
}

/* ----------------------------- Yoritish ----------------------------- */
function ArenaLights() {
  return (
    <>
      <ambientLight intensity={0.85} color="#dfe9ff" />
      <hemisphereLight args={["#cfe0ff", "#10131a", 0.6]} />
      <directionalLight
        castShadow position={[40, 60, 30]} intensity={2.4} color="#fff4e2"
        shadow-mapSize-width={2048} shadow-mapSize-height={2048}
        shadow-camera-left={-120} shadow-camera-right={120}
        shadow-camera-top={120} shadow-camera-bottom={-120}
        shadow-camera-near={1} shadow-camera-far={300}
      />
      <directionalLight position={[-40, 30, -20]} intensity={0.7} color="#9fd0ff" />
    </>
  );
}

/* ----------------------------- Simulyatsiya ----------------------------- */
function RaceWorld({ gameStateRef, controlsRef, telemetryRef, onFinish }) {
  const trackRef = useRef(null);
  const carRefs = useRef({});
  const { camera } = useThree();
  const ray = useRef(new THREE.Raycaster());
  const downVec = useMemo(() => new THREE.Vector3(0, -1, 0), []);
  const finishedRef = useRef(false);

  const sim = useRef(
    RACE_CARS.map((c) => ({
      id: c.id, x: c.lane, y: 0, z: START_Z, heading: 0, speed: 0,
      controllable: !!c.controllable, aiTarget: c.ai, lane: c.lane,
    })),
  );

  // yer balandligini topish (uchmaslik uchun)
  const surfaceY = (x, z) => {
    if (!trackRef.current) return 0;
    ray.current.set(new THREE.Vector3(x, 60, z), downVec);
    const hits = ray.current.intersectObject(trackRef.current, true);
    return hits.length ? hits[0].point.y : 0;
  };

  // kamerani start chizig'iga qaratish (boshlanishida)
  useEffect(() => {
    camera.position.set(0, 5.5, START_Z + 12);
    camera.lookAt(0, 1, START_Z - 4);
  }, [camera]);

  useFrame((_, dt) => {
    const delta = Math.min(dt, 0.05);
    const racing = gameStateRef.current === "racing";

    sim.current.forEach((s) => {
      if (racing) {
        if (s.controllable) {
          const c = controlsRef.current;
          const accel = c.up ? 30 : c.down ? -18 : 0;
          s.speed += accel * delta;
          if (!c.up && !c.down) s.speed *= 0.99;
          s.speed = THREE.MathUtils.clamp(s.speed, -7, 27);
          // RUL TUZATILDI: o'ng - chap (chap = chapga buriladi)
          const steer = (c.right ? 1 : 0) - (c.left ? 1 : 0);
          const grip = THREE.MathUtils.clamp(Math.abs(s.speed) / 9, 0.18, 1);
          s.heading += steer * 1.7 * grip * delta;
        } else {
          const target = s.aiTarget + Math.sin(performance.now() / 850 + s.lane) * 1.4;
          s.speed += (target - s.speed) * 3.5 * delta;
          s.speed = THREE.MathUtils.clamp(s.speed, 0, 24);
          s.heading += (-(s.x - s.lane) * 0.04 - s.heading) * 2.2 * delta;
        }
        // harakat (old = -z)
        s.x += Math.sin(s.heading) * s.speed * delta;
        s.z -= Math.cos(s.heading) * s.speed * delta;
        if (s.x > ROAD_HALF) { s.x = ROAD_HALF; s.heading *= 0.35; }
        if (s.x < -ROAD_HALF) { s.x = -ROAD_HALF; s.heading *= 0.35; }
      }
      // yerga o'tirg'izish
      const targetY = surfaceY(s.x, s.z);
      s.y += (targetY - s.y) * 0.4;
      const g = carRefs.current[s.id];
      if (g) {
        g.position.set(s.x, s.y, s.z);
        g.rotation.y = s.heading;
      }
    });

    const player = sim.current.find((s) => s.controllable);
    if (player) {
      const progress = THREE.MathUtils.clamp((START_Z - player.z) / (START_Z - FINISH_Z), 0, 1);
      let pos = 1;
      sim.current.forEach((s) => { if (!s.controllable && s.z < player.z) pos++; });
      telemetryRef.current = { speed: Math.abs(player.speed), progress, position: pos };

      if (gameStateRef.current !== "idle") {
        const camX = player.x - Math.sin(player.heading) * 9.5;
        const camZ = player.z + Math.cos(player.heading) * 9.5;
        camera.position.lerp(new THREE.Vector3(camX, player.y + 4.2, camZ), 0.09);
        camera.lookAt(player.x, player.y + 0.9, player.z - 3);
      }

      if (racing && !finishedRef.current && player.z <= FINISH_Z) {
        finishedRef.current = true;
        onFinish(pos);
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
        {/* zaxira yer — raycast topolmasa ham uchmaydi */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.02, 0]} receiveShadow>
          <planeGeometry args={[60, TRACK_LENGTH + 80]} />
          <meshStandardMaterial color="#161a20" roughness={0.95} />
        </mesh>
        {/* FINISH darvozasi */}
        <group position={[0, 0, FINISH_Z]}>
          {[-ROAD_HALF - 0.6, ROAD_HALF + 0.6].map((x) => (
            <mesh key={x} position={[x, 2.4, 0]} castShadow>
              <boxGeometry args={[0.5, 4.8, 0.5]} />
              <meshStandardMaterial color="#ff3d3d" emissive="#ff3d3d" emissiveIntensity={0.6} />
            </mesh>
          ))}
          <mesh position={[0, 4.8, 0]}>
            <boxGeometry args={[ROAD_HALF * 2 + 1.7, 0.6, 0.5]} />
            <meshStandardMaterial color="#ff3d3d" emissive="#ff3d3d" emissiveIntensity={0.6} />
          </mesh>
        </group>
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

  // klaviatura + brake screech
  useEffect(() => {
    const map = { KeyW: "up", ArrowUp: "up", KeyS: "down", ArrowDown: "down", KeyA: "left", ArrowLeft: "left", KeyD: "right", ArrowRight: "right" };
    const down = (e) => {
      const k = map[e.code]; if (!k) return; e.preventDefault();
      if (!controlsRef.current[k]) {
        controlsRef.current[k] = true;
        if (k === "down" && telemetryRef.current.speed > 6) audioRef.current?.screech();
      }
    };
    const up = (e) => { if (map[e.code]) controlsRef.current[map[e.code]] = false; };
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    return () => { window.removeEventListener("keydown", down); window.removeEventListener("keyup", up); };
  }, []);

  // HUD + audio pitch loop
  useEffect(() => {
    if (gameState !== "racing") return;
    let raf;
    const tick = () => {
      const t = telemetryRef.current;
      setHud({ ...t });
      audioRef.current?.setSpeed(t.speed, controlsRef.current.up);
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
    timersRef.current.push(setTimeout(() => {
      setCountdown(0); setGameState("racing");
      audioRef.current?.startEngine(); // dvigatel revi start'da
    }, 3000));
  };

  const startRace = async () => {
    setResult(null);
    setRaceKey((k) => k + 1);
    controlsRef.current = { up: false, down: false, left: false, right: false };
    audioRef.current?.init(); audioRef.current?.resume(); // user gesture
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
    onPointerDown: (e) => { e.preventDefault(); controlsRef.current[key] = true; if (key === "down" && telemetryRef.current.speed > 6) audioRef.current?.screech(); },
    onPointerUp: (e) => { e.preventDefault(); controlsRef.current[key] = false; },
    onPointerLeave: () => { controlsRef.current[key] = false; },
    onPointerCancel: () => { controlsRef.current[key] = false; },
  });

  const speedKmh = Math.round(hud.speed * 11);

  return (
    <div className="arena" ref={wrapRef}>
      <Canvas
        key={raceKey} shadows dpr={[1, 2]}
        camera={{ position: [0, 5.5, START_Z + 12], fov: 55, near: 0.1, far: 400 }}
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
        <fog attach="fog" args={["#0b0e14", 70, 180]} />
        <RaceWorld gameStateRef={gameStateRef} controlsRef={controlsRef} telemetryRef={telemetryRef} onFinish={onFinish} />
      </Canvas>

      {/* Orqaga */}
      <button className="arena__back" onClick={() => navigate("/")}>
        <ArrowLeft size={18} /> Chiqish
      </button>

      {/* HUD */}
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
          <p>racing_track.glb trassasi · AI raqiblar · finishgacha poyga</p>
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
