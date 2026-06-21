// ============================================================
//  RACE ARENA v3 — aniq boshqariladigan OVAL PISTA (kafolatli)
//  - haqiqiy devor-collider (ichki/tashqi radius) -> urilsa qaytadi
//  - faqat yo'lda (ring ichida) harakat, uchmaydi (y=0)
//  - 4 mashina start chizig'ida to'g'ri qatorda, oldinga qaraydi
//  - rul to'g'ri, chuqur multi-layer (sawtooth+triangle->lowpass) ovoz
// ============================================================
import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Environment, useGLTF } from "@react-three/drei";
import {
  ArrowLeft, Play, RotateCcw, Trophy, Flag,
  ChevronUp, ChevronDown, ChevronLeft, ChevronRight,
} from "lucide-react";
import * as THREE from "three";
import "./RaceArena.css";

/* ----------------------------- Pista o'lchamlari ----------------------------- */
const R_IN = 26;            // ichki devor radiusi
const R_OUT = 44;           // tashqi devor radiusi
const R_MID = (R_IN + R_OUT) / 2;
const WALL_PAD = 1.4;
const LAPS = 2;
const START_ANGLE = -Math.PI / 2;   // start chizig'i (pastda)
const TARGET_CAR_LENGTH = 3.4;
const CAR_FACING = Math.PI;          // model old tomonini to'g'rilash (0|PI|±PI/2)

const RACE_CARS = [
  { id: "player", path: "/models/spark.glb", color: "#ff3d3d", r: 30.5, back: 0, controllable: true, ai: 0 },
  { id: "ai1", path: "/models/bmw_m5.glb", color: "#2f7dff", r: 38, back: 0, ai: 13.0 },
  { id: "ai2", path: "/models/kia_k5.glb", color: "#eef0f4", r: 30.5, back: 5, ai: 12.2 },
  { id: "ai3", path: "/models/porschee911.glb", color: "#f4b73f", r: 38, back: 5, ai: 13.6 },
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
// kuzatuv: jahon yo'nalish vektoridan heading
const headingFromDir = (dx, dz) => Math.atan2(dx, -dz);

/* ----------------- Chuqur dvigatel ovozi (WebAudio) ----------------- */
class EngineAudio {
  constructor() { this.ctx = null; this.ready = false; }
  init() {
    if (this.ctx) return;
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) return;
    const ctx = new Ctx(); this.ctx = ctx;
    this.master = ctx.createGain(); this.master.gain.value = 0;
    this.lp = ctx.createBiquadFilter(); this.lp.type = "lowpass"; this.lp.frequency.value = 600; this.lp.Q.value = 7;
    this.lp.connect(this.master); this.master.connect(ctx.destination);
    const mk = (type, gain) => { const o = ctx.createOscillator(); o.type = type; const g = ctx.createGain(); g.gain.value = gain; o.connect(g).connect(this.lp); o.start(); return o; };
    this.o1 = mk("sawtooth", 0.17);
    this.o2 = mk("sawtooth", 0.12);
    this.o3 = mk("triangle", 0.22);
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
  setRPM(speed, throttle) {
    if (!this.ready) return;
    const t = this.ctx.currentTime;
    const norm = THREE.MathUtils.clamp(speed / 27, 0, 1);
    const base = 58 * Math.pow(2.5, norm) * (throttle ? 1.18 : 0.9);
    this.o1.frequency.setTargetAtTime(base, t, 0.08);
    this.o2.frequency.setTargetAtTime(base * 1.01, t, 0.08);
    this.o3.frequency.setTargetAtTime(base * 0.5, t, 0.08);
    this.lp.frequency.setTargetAtTime(420 + norm * 1500 + (throttle ? 280 : 0), t, 0.1);
  }
  brakeDrop() {
    if (!this.ready) return;
    const t = this.ctx.currentTime;
    [this.o1, this.o2, this.o3].forEach((o, i) => { o.frequency.cancelScheduledValues(t); o.frequency.setTargetAtTime(i === 2 ? 26 : 52, t, 0.12); });
    this.screech();
  }
  screech() {
    if (!this.ready) return;
    const t = this.ctx.currentTime;
    const src = this.ctx.createBufferSource(); src.buffer = this.noise;
    const hp = this.ctx.createBiquadFilter(); hp.type = "highpass"; hp.frequency.value = 1600;
    const bp = this.ctx.createBiquadFilter(); bp.type = "bandpass"; bp.frequency.value = 2400; bp.Q.value = 8;
    const g = this.ctx.createGain(); g.gain.value = 0;
    src.connect(hp).connect(bp).connect(g).connect(this.ctx.destination);
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(0.26, t + 0.04);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.55);
    src.start(t); src.stop(t + 0.6);
  }
  dispose() { try { this.ctx?.close?.(); } catch { /* ignore */ } this.ctx = null; this.ready = false; }
}

/* ----------------------------- Pista geometriyasi ----------------------------- */
function CircuitTrack() {
  // start/finish chizig'i pozitsiyasi
  const sx = Math.cos(START_ANGLE) * R_MID;
  const sz = Math.sin(START_ANGLE) * R_MID;
  const tiles = [];
  const n = 10;
  for (let i = 0; i < n; i++) {
    tiles.push(
      <mesh key={i} position={[sx - (R_OUT - R_IN) / 2 + (i + 0.5) * ((R_OUT - R_IN) / n), 0.04, sz]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[(R_OUT - R_IN) / n, 1.6]} />
        <meshStandardMaterial color={i % 2 === 0 ? "#f5f5f7" : "#0a0a0a"} />
      </mesh>,
    );
  }
  return (
    <group>
      {/* tashqi yer */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.05, 0]} receiveShadow>
        <planeGeometry args={[200, 200]} />
        <meshStandardMaterial color="#0e1117" roughness={1} />
      </mesh>
      {/* asfalt ring */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
        <ringGeometry args={[R_IN, R_OUT, 96]} />
        <meshStandardMaterial color="#2f333b" roughness={0.92} metalness={0.04} />
      </mesh>
      {/* o'rta chiziq */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]}>
        <ringGeometry args={[R_MID - 0.12, R_MID + 0.12, 96]} />
        <meshStandardMaterial color="#ffcf3d" emissive="#ffcf3d" emissiveIntensity={0.25} />
      </mesh>
      {/* infield (maydon) */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.005, 0]} receiveShadow>
        <circleGeometry args={[R_IN, 64]} />
        <meshStandardMaterial color="#13351f" roughness={1} />
      </mesh>
      {/* ichki/tashqi barerlar (torus) */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.5, 0]} castShadow>
        <torusGeometry args={[R_IN, 0.45, 12, 96]} />
        <meshStandardMaterial color="#ff3d3d" emissive="#ff3d3d" emissiveIntensity={0.35} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.5, 0]} castShadow>
        <torusGeometry args={[R_OUT, 0.5, 12, 96]} />
        <meshStandardMaterial color="#f5f5f7" emissive="#3d6bff" emissiveIntensity={0.15} />
      </mesh>
      {/* start/finish shaxmat chizig'i */}
      {tiles}
      {/* start darvozasi */}
      <group position={[sx, 0, sz]}>
        {[-(R_OUT - R_IN) / 2 - 0.6, (R_OUT - R_IN) / 2 + 0.6].map((dx) => (
          <mesh key={dx} position={[dx, 3, 0]} castShadow>
            <boxGeometry args={[0.5, 6, 0.5]} />
            <meshStandardMaterial color="#ff3d3d" emissive="#ff3d3d" emissiveIntensity={0.5} />
          </mesh>
        ))}
        <mesh position={[0, 6, 0]}>
          <boxGeometry args={[R_OUT - R_IN + 1.8, 0.7, 0.5]} />
          <meshStandardMaterial color="#ff3d3d" emissive="#ff3d3d" emissiveIntensity={0.5} />
        </mesh>
      </group>
      {/* dekorativ minoralar (tashqarida) */}
      {Array.from({ length: 8 }).map((_, i) => {
        const a = (i / 8) * Math.PI * 2;
        const r = R_OUT + 10;
        return (
          <mesh key={i} position={[Math.cos(a) * r, 6, Math.sin(a) * r]} castShadow>
            <boxGeometry args={[5, 12, 5]} />
            <meshStandardMaterial color="#1a1e26" roughness={0.8} />
          </mesh>
        );
      })}
    </group>
  );
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
      <ambientLight intensity={0.85} color="#dfe9ff" />
      <hemisphereLight args={["#cfe0ff", "#0e1218", 0.6]} />
      <directionalLight
        castShadow position={[40, 70, 30]} intensity={2.5} color="#fff4e2"
        shadow-mapSize-width={2048} shadow-mapSize-height={2048}
        shadow-camera-left={-90} shadow-camera-right={90}
        shadow-camera-top={90} shadow-camera-bottom={-90} shadow-camera-far={250}
      />
      <directionalLight position={[-40, 40, -20]} intensity={0.7} color="#9fd0ff" />
    </>
  );
}

/* ----------------------------- Simulyatsiya ----------------------------- */
function RaceWorld({ gameStateRef, controlsRef, telemetryRef, onFinish }) {
  const carRefs = useRef({});
  const { camera } = useThree();
  const finishedRef = useRef(false);

  const initCar = (c) => {
    const ang = START_ANGLE - c.back / c.r; // start ortida (kichik burchak)
    const x = Math.cos(ang) * c.r;
    const z = Math.sin(ang) * c.r;
    // harakat yo'nalishi = soat strelkasiga teskari tangens
    const tx = -Math.sin(ang), tz = Math.cos(ang);
    return {
      id: c.id, x, z, r: c.r, theta: ang, heading: headingFromDir(tx, tz),
      speed: 0, controllable: !!c.controllable, ai: c.ai,
      lastAngle: Math.atan2(z, x), traveled: 0,
    };
  };
  const sim = useRef(RACE_CARS.map(initCar));

  useEffect(() => {
    camera.position.set(Math.cos(START_ANGLE) * R_MID, 8, Math.sin(START_ANGLE) * R_MID + 16);
    camera.lookAt(Math.cos(START_ANGLE) * R_MID, 1, Math.sin(START_ANGLE) * R_MID);
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
          const steer = (c.right ? 1 : 0) - (c.left ? 1 : 0); // RUL TUZATILDI
          const grip = THREE.MathUtils.clamp(Math.abs(s.speed) / 9, 0.18, 1);
          s.heading += steer * 1.7 * grip * delta;
          // erkin harakat
          s.x += Math.sin(s.heading) * s.speed * delta;
          s.z -= Math.cos(s.heading) * s.speed * delta;
          // DEVOR COLLISION: ring ichida ushlab turish
          const r = Math.hypot(s.x, s.z) || 0.001;
          if (r < R_IN + WALL_PAD) {
            const k = (R_IN + WALL_PAD) / r; s.x *= k; s.z *= k; s.speed *= 0.4;
          } else if (r > R_OUT - WALL_PAD) {
            const k = (R_OUT - WALL_PAD) / r; s.x *= k; s.z *= k; s.speed *= 0.4;
          }
        } else {
          // AI: ideal ring chizig'i bo'ylab
          const target = s.ai + Math.sin(performance.now() / 800 + s.r) * 1.0;
          s.speed += (target - s.speed) * 3.5 * delta;
          s.speed = THREE.MathUtils.clamp(s.speed, 0, 22);
          s.theta += (s.speed / s.r) * delta;
          s.x = Math.cos(s.theta) * s.r;
          s.z = Math.sin(s.theta) * s.r;
          const tx = -Math.sin(s.theta), tz = Math.cos(s.theta);
          s.heading = headingFromDir(tx, tz);
        }
        // bosib o'tilgan burchak (lap progress)
        const ang = Math.atan2(s.z, s.x);
        let d = ang - s.lastAngle;
        if (d > Math.PI) d -= Math.PI * 2;
        if (d < -Math.PI) d += Math.PI * 2;
        s.traveled += d;
        s.lastAngle = ang;
      }
      const g = carRefs.current[s.id];
      if (g) { g.position.set(s.x, 0, s.z); g.rotation.y = s.heading; }
    });

    const player = sim.current.find((s) => s.controllable);
    if (player) {
      const total = LAPS * Math.PI * 2;
      const progress = THREE.MathUtils.clamp(player.traveled / total, 0, 1);
      let pos = 1;
      sim.current.forEach((s) => { if (!s.controllable && s.traveled > player.traveled) pos++; });
      telemetryRef.current = { speed: Math.abs(player.speed), progress, position: pos, lap: Math.min(LAPS, Math.floor(player.traveled / (Math.PI * 2)) + 1) };

      if (gameStateRef.current !== "idle") {
        const dx = Math.sin(player.heading), dz = -Math.cos(player.heading);
        camera.position.lerp(new THREE.Vector3(player.x - dx * 10, 5, player.z - dz * 10), 0.09);
        camera.lookAt(player.x + dx * 3, 1, player.z + dz * 3);
      }
      if (racing && !finishedRef.current && player.traveled >= total) {
        finishedRef.current = true; onFinish(pos);
      }
    }
  });

  return (
    <>
      <ArenaLights />
      <Suspense fallback={null}>
        <CircuitTrack />
        {RACE_CARS.map((car) => (
          <CarModel key={car.id} car={car} registerRef={(el) => (carRefs.current[car.id] = el)} />
        ))}
        <Environment preset="night" background={false} />
      </Suspense>
    </>
  );
}

/* ----------------------------- Sahifa ----------------------------- */
export default function RaceArena() {
  const navigate = useNavigate();
  const [gameState, _setGameState] = useState("idle");
  const gameStateRef = useRef("idle");
  const setGameState = (s) => { gameStateRef.current = s; _setGameState(s); };

  const [countdown, setCountdown] = useState(3);
  const [result, setResult] = useState(null);
  const [hud, setHud] = useState({ speed: 0, progress: 0, position: 1, lap: 1 });
  const [raceKey, setRaceKey] = useState(0);
  const [isTouch, setIsTouch] = useState(false);

  const controlsRef = useRef({ up: false, down: false, left: false, right: false });
  const telemetryRef = useRef({ speed: 0, progress: 0, position: 1, lap: 1 });
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
    window.addEventListener("keydown", dn); window.addEventListener("keyup", up);
    return () => { window.removeEventListener("keydown", dn); window.removeEventListener("keyup", up); };
  }, []);

  useEffect(() => {
    if (gameState !== "racing") return;
    let raf;
    const tick = () => {
      const t = telemetryRef.current; setHud({ ...t });
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
        camera={{ position: [0, 9, 30], fov: 55, near: 0.1, far: 500 }}
        gl={{ antialias: true }}
        onCreated={({ gl }) => {
          gl.outputColorSpace = THREE.SRGBColorSpace;
          gl.toneMapping = THREE.ACESFilmicToneMapping;
          gl.toneMappingExposure = 1.15;
          gl.shadowMap.enabled = true; gl.shadowMap.type = THREE.PCFSoftShadowMap;
        }}
      >
        <color attach="background" args={["#0a0c12"]} />
        <fog attach="fog" args={["#0a0c12", 80, 200]} />
        <RaceWorld gameStateRef={gameStateRef} controlsRef={controlsRef} telemetryRef={telemetryRef} onFinish={onFinish} />
      </Canvas>

      <button className="arena__back" onClick={() => navigate("/")}><ArrowLeft size={18} /> Chiqish</button>

      {(gameState === "racing" || gameState === "countdown") && (
        <div className="arena__hud">
          <div className="arena__gauge"><span>{speedKmh}</span><small>km/s</small></div>
          <div className="arena__pos"><span>{hud.position}</span><small>/ {RACE_CARS.length}</small></div>
          <div className="arena__gauge"><span>{hud.lap}</span><small>/ {LAPS} krug</small></div>
          <div className="arena__bar"><div style={{ width: `${hud.progress * 100}%` }} /><Flag size={13} /></div>
        </div>
      )}

      {gameState === "countdown" && <div className="arena__count">{countdown > 0 ? countdown : "GO!"}</div>}

      {gameState === "idle" && (
        <div className="arena__overlay">
          <Trophy size={48} className="arena__icon" />
          <h2>Poyga arenasi</h2>
          <p>{LAPS} krug · oval pista · AI raqiblar</p>
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

RACE_CARS.forEach((c) => useGLTF.preload(c.path));
