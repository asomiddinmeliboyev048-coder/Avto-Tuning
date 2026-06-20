import { Component, Suspense, useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Environment, Html, useGLTF } from "@react-three/drei";
import {
  Gamepad2,
  Flag,
  RotateCcw,
  Play,
  ChevronUp,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Trophy,
  Maximize2,
} from "lucide-react";
import * as THREE from "three";
import "./RacingGame.css";

/* ----------------------------- Trassa o'lchamlari ----------------------------- */
const ROAD_WIDTH = 12;
const ROAD_HALF = ROAD_WIDTH / 2 - 0.8;
const TRACK_LENGTH = 240; // -z yo'nalishida
const FINISH_Z = -(TRACK_LENGTH - 22);
const START_Z = 0;
const CAR_YAW = Math.PI; // model yo'nalishini tuzatish
const TARGET_CAR_LENGTH = 2.35;

const RACE_CARS = [
  { id: "player", label: "Siz", path: "/models/spark.glb", color: "#ff3d3d", lane: -3, controllable: true, ai: 0 },
  { id: "ai1", label: "BMW M5", path: "/models/bmw_m5.glb", color: "#2f7dff", lane: -1, ai: 15.5 },
  { id: "ai2", label: "Kia K5", path: "/models/kia_k5.glb", color: "#f5f5f7", lane: 1, ai: 14.8 },
  { id: "ai3", label: "Porsche", path: "/models/porschee911.glb", color: "#f4b73f", lane: 3, ai: 16.2 },
];

const bodyKeys = ["body", "kuzov", "carpaint", "paint", "chassis", "hood", "door", "bumper", "fender", "roof", "bonnet", "trunk", "quarter"];
const glassKeys = ["glass", "oyna", "window", "windshield", "windscreen", "clearglass"];
const wheelKeys = ["rim", "diska", "disc", "wheel_disk", "alloy"];
const tireKeys = ["tire", "tyre", "rubber", "shina"];
const includesAny = (value, keys) => keys.some((k) => value.includes(k));

function cloneSceneWithOwnMaterials(scene) {
  const clone = scene.clone(true);
  clone.traverse((child) => {
    if (!child.isMesh) return;
    const n = child.name?.toLowerCase() ?? "";
    if (n.includes("cube")) {
      child.visible = false;
      return;
    }
    child.castShadow = true;
    child.receiveShadow = true;
    child.material = Array.isArray(child.material)
      ? child.material.map((m) => m.clone())
      : child.material?.clone();
  });
  return clone;
}

function getNormalizedTransform(object) {
  const box = new THREE.Box3().setFromObject(object);
  const size = new THREE.Vector3();
  const center = new THREE.Vector3();
  box.getSize(size);
  box.getCenter(center);
  const longest = Math.max(size.x, size.z, 0.001);
  const scale = TARGET_CAR_LENGTH / longest;
  return { scale, position: [-center.x * scale, -box.min.y * scale, -center.z * scale] };
}

/* ----------------------------- Mashina modeli ----------------------------- */
function CarModel({ car, registerRef }) {
  const { scene } = useGLTF(car.path);
  const model = useMemo(() => cloneSceneWithOwnMaterials(scene), [scene]);
  const transform = useMemo(() => getNormalizedTransform(model), [model]);

  useEffect(() => {
    model.traverse((child) => {
      if (!child.isMesh || !child.material) return;
      const meshName = child.name?.toLowerCase() ?? "";
      const matName = Array.isArray(child.material)
        ? child.material.map((m) => m.name ?? "").join(" ").toLowerCase()
        : child.material.name?.toLowerCase() ?? "";
      const target = `${meshName} ${matName}`;
      const materials = Array.isArray(child.material) ? child.material : [child.material];
      materials.forEach((m) => {
        if (includesAny(target, glassKeys)) {
          m.color.set("#121722"); m.transparent = true; m.opacity = 0.5; m.roughness = 0.08;
        } else if (includesAny(target, tireKeys)) {
          m.color.set("#101010"); m.roughness = 0.8;
        } else if (includesAny(target, wheelKeys)) {
          m.color.set("#d4d7dd"); m.metalness = 0.85; m.roughness = 0.22;
        } else if (includesAny(target, bodyKeys)) {
          m.color.set(car.color); m.metalness = 0.4; m.roughness = 0.25;
          if ("clearcoat" in m) m.clearcoat = 0.7;
        }
        m.needsUpdate = true;
      });
    });
  }, [car.color, model]);

  return (
    <group ref={registerRef}>
      <group rotation={[0, CAR_YAW, 0]}>
        <primitive object={model} scale={transform.scale} position={transform.position} />
      </group>
    </group>
  );
}

/* ----------------------------- Trassa (procedural) ----------------------------- */
function Road() {
  const dashes = useMemo(() => {
    const arr = [];
    for (let i = 0; i < TRACK_LENGTH / 4; i++) arr.push(START_Z - 4 - i * 4);
    return arr;
  }, []);
  const lanes = [-ROAD_WIDTH / 4, ROAD_WIDTH / 4];

  return (
    <group>
      {/* asfalt */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, -TRACK_LENGTH / 2]} receiveShadow>
        <planeGeometry args={[ROAD_WIDTH, TRACK_LENGTH + 40]} />
        <meshStandardMaterial color="#1b1e25" roughness={0.95} metalness={0.05} />
      </mesh>
      {/* yon chiziqlar */}
      {[-ROAD_HALF - 0.4, ROAD_HALF + 0.4].map((x) => (
        <mesh key={x} rotation={[-Math.PI / 2, 0, 0]} position={[x, 0.01, -TRACK_LENGTH / 2]}>
          <planeGeometry args={[0.22, TRACK_LENGTH + 40]} />
          <meshStandardMaterial color="#ff8a3d" emissive="#ff8a3d" emissiveIntensity={0.35} />
        </mesh>
      ))}
      {/* o'rta uzuq chiziqlar */}
      {lanes.map((lx) =>
        dashes.map((z) => (
          <mesh key={`${lx}-${z}`} rotation={[-Math.PI / 2, 0, 0]} position={[lx, 0.01, z]}>
            <planeGeometry args={[0.16, 1.6]} />
            <meshStandardMaterial color="#e8eaf0" emissive="#e8eaf0" emissiveIntensity={0.25} />
          </mesh>
        )),
      )}
      {/* devor-to'siqlar */}
      {[-ROAD_WIDTH / 2 - 0.3, ROAD_WIDTH / 2 + 0.3].map((x) => (
        <mesh key={x} position={[x, 0.5, -TRACK_LENGTH / 2]} castShadow receiveShadow>
          <boxGeometry args={[0.6, 1, TRACK_LENGTH + 40]} />
          <meshStandardMaterial color="#23262e" roughness={0.8} />
        </mesh>
      ))}
      {/* START chizig'i */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, START_Z + 1]}>
        <planeGeometry args={[ROAD_WIDTH - 1.4, 1.2]} />
        <meshStandardMaterial color="#ffffff" />
      </mesh>
      {/* FINISH — shaxmat chizig'i + darvoza */}
      <FinishLine />
    </group>
  );
}

function FinishLine() {
  const tiles = [];
  const cols = 14;
  const rows = 2;
  const tileW = (ROAD_WIDTH - 1.2) / cols;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const dark = (r + c) % 2 === 0;
      tiles.push(
        <mesh
          key={`${r}-${c}`}
          rotation={[-Math.PI / 2, 0, 0]}
          position={[-(ROAD_WIDTH - 1.2) / 2 + tileW / 2 + c * tileW, 0.02, FINISH_Z - r * tileW]}
        >
          <planeGeometry args={[tileW, tileW]} />
          <meshStandardMaterial color={dark ? "#0a0a0a" : "#f5f5f7"} />
        </mesh>,
      );
    }
  }
  return (
    <group>
      {tiles}
      {[-ROAD_WIDTH / 2, ROAD_WIDTH / 2].map((x) => (
        <mesh key={x} position={[x, 2, FINISH_Z]}>
          <boxGeometry args={[0.4, 4, 0.4]} />
          <meshStandardMaterial color="#ff3d3d" emissive="#ff3d3d" emissiveIntensity={0.5} />
        </mesh>
      ))}
      <mesh position={[0, 4, FINISH_Z]}>
        <boxGeometry args={[ROAD_WIDTH + 0.4, 0.5, 0.4]} />
        <meshStandardMaterial color="#ff3d3d" emissive="#ff3d3d" emissiveIntensity={0.5} />
      </mesh>
    </group>
  );
}

/* ----------------------------- Simulyatsiya ----------------------------- */
function RaceWorld({ gameStateRef, controlsRef, telemetryRef, onFinish }) {
  const carRefs = useRef({});
  const sim = useRef(
    RACE_CARS.map((c) => ({
      id: c.id,
      x: c.lane,
      z: START_Z,
      heading: 0,
      speed: 0,
      controllable: !!c.controllable,
      aiTarget: c.ai,
      startLane: c.lane,
    })),
  );
  const finishedRef = useRef(false);
  const { camera } = useThree();

  // start holatiga qaytarish
  const resetSim = () => {
    sim.current.forEach((s, i) => {
      s.x = RACE_CARS[i].lane;
      s.z = START_Z;
      s.heading = 0;
      s.speed = 0;
    });
    finishedRef.current = false;
  };
  useEffect(() => {
    resetSim();
  }, []);

  useFrame((_, dt) => {
    const delta = Math.min(dt, 0.05);
    const state = gameStateRef.current;
    const racing = state === "racing";

    sim.current.forEach((s) => {
      if (racing) {
        if (s.controllable) {
          const c = controlsRef.current;
          const accel = c.up ? 26 : c.down ? -16 : 0;
          s.speed += accel * delta;
          if (!c.up && !c.down) s.speed *= 0.985;
          s.speed = THREE.MathUtils.clamp(s.speed, -6, 24);
          const steer = (c.left ? 1 : 0) - (c.right ? 1 : 0);
          const grip = THREE.MathUtils.clamp(Math.abs(s.speed) / 8, 0.2, 1);
          s.heading += steer * 1.6 * grip * delta;
        } else {
          // AI: maqsadli tezlikka chiqadi + o'z yo'lagiga qaytadi
          const target = s.aiTarget + Math.sin((performance.now() / 900) + s.x) * 1.2;
          s.speed += (target - s.speed) * 0.8 * delta * 4;
          s.speed = THREE.MathUtils.clamp(s.speed, 0, 22);
          const laneErr = s.x - s.startLane;
          s.heading += (-laneErr * 0.05 - s.heading) * 2 * delta;
        }
        // harakat (oldinga = -z)
        s.x += Math.sin(s.heading) * s.speed * delta;
        s.z -= Math.cos(s.heading) * s.speed * delta;
        // yo'l chegarasi
        if (s.x > ROAD_HALF) { s.x = ROAD_HALF; s.heading *= 0.4; }
        if (s.x < -ROAD_HALF) { s.x = -ROAD_HALF; s.heading *= 0.4; }
      }
      const g = carRefs.current[s.id];
      if (g) {
        g.position.set(s.x, 0, s.z);
        g.rotation.y = s.heading;
      }
    });

    // o'yinchi telemetriyasi
    const player = sim.current.find((s) => s.controllable);
    if (player) {
      const progress = THREE.MathUtils.clamp((START_Z - player.z) / (START_Z - FINISH_Z), 0, 1);
      let pos = 1;
      sim.current.forEach((s) => {
        if (!s.controllable && s.z < player.z) pos++;
      });
      telemetryRef.current = { speed: Math.abs(player.speed), progress, position: pos };

      // ergashuvchi kamera
      const behindX = player.x - Math.sin(player.heading) * 9;
      const behindZ = player.z + Math.cos(player.heading) * 9;
      camera.position.lerp(new THREE.Vector3(behindX, 4.4, behindZ), 0.08);
      camera.lookAt(player.x, 0.8, player.z - 2);

      // finish
      if (racing && !finishedRef.current && player.z <= FINISH_Z) {
        finishedRef.current = true;
        onFinish(pos);
      }
    }
  });

  return (
    <>
      <ambientLight intensity={0.55} color="#cfe0ff" />
      <directionalLight
        castShadow position={[10, 18, 6]} intensity={2.2}
        shadow-mapSize-width={2048} shadow-mapSize-height={2048}
        shadow-camera-left={-30} shadow-camera-right={30}
        shadow-camera-top={30} shadow-camera-bottom={-30} shadow-camera-far={80}
      />
      <hemisphereLight args={["#bcd4ff", "#0a0c10", 0.4]} />
      <Suspense fallback={<Html center><div className="race__loading">Poyga yuklanmoqda...</div></Html>}>
        <Road />
        {RACE_CARS.map((car) => (
          <CarModel key={car.id} car={car} registerRef={(el) => (carRefs.current[car.id] = el)} />
        ))}
        <Environment preset="night" background={false} />
      </Suspense>
    </>
  );
}

/* ----------------------------- Xato chegarasi ----------------------------- */
class RaceErrorBoundary extends Component {
  constructor(props) { super(props); this.state = { hasError: false }; }
  static getDerivedStateFromError() { return { hasError: true }; }
  render() {
    if (this.state.hasError)
      return <div className="race__error">3D poygani yuklab bo'lmadi. Sahifani yangilang.</div>;
    return this.props.children;
  }
}

/* ----------------------------- Asosiy komponent ----------------------------- */
export default function RacingGame() {
  const [gameState, _setGameState] = useState("idle"); // idle | countdown | racing | finished
  const gameStateRef = useRef("idle");
  const setGameState = (s) => { gameStateRef.current = s; _setGameState(s); };

  const [countdown, setCountdown] = useState(3);
  const [result, setResult] = useState(null);
  const [hud, setHud] = useState({ speed: 0, progress: 0, position: 1 });
  const [raceKey, setRaceKey] = useState(0);
  const [isTouch, setIsTouch] = useState(false);

  const controlsRef = useRef({ up: false, down: false, left: false, right: false });
  const telemetryRef = useRef({ speed: 0, progress: 0, position: 1 });
  const stageRef = useRef(null);
  const timersRef = useRef([]);

  useEffect(() => {
    setIsTouch("ontouchstart" in window || navigator.maxTouchPoints > 0);
  }, []);

  // klaviatura
  useEffect(() => {
    const map = { KeyW: "up", ArrowUp: "up", KeyS: "down", ArrowDown: "down", KeyA: "left", ArrowLeft: "left", KeyD: "right", ArrowRight: "right" };
    const down = (e) => { if (map[e.code]) { e.preventDefault(); controlsRef.current[map[e.code]] = true; } };
    const up = (e) => { if (map[e.code]) controlsRef.current[map[e.code]] = false; };
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    return () => { window.removeEventListener("keydown", down); window.removeEventListener("keyup", up); };
  }, []);

  // HUD yangilash (10/s)
  useEffect(() => {
    if (gameState !== "racing") return;
    const id = setInterval(() => setHud({ ...telemetryRef.current }), 100);
    return () => clearInterval(id);
  }, [gameState]);

  const clearTimers = () => { timersRef.current.forEach(clearTimeout); timersRef.current = []; };

  const beginCountdown = () => {
    setGameState("countdown");
    setCountdown(3);
    timersRef.current.push(setTimeout(() => setCountdown(2), 1000));
    timersRef.current.push(setTimeout(() => setCountdown(1), 2000));
    timersRef.current.push(setTimeout(() => { setCountdown(0); setGameState("racing"); }, 3000));
  };

  const startRace = async () => {
    setResult(null);
    setRaceKey((k) => k + 1);
    controlsRef.current = { up: false, down: false, left: false, right: false };
    // mobil: to'liq ekran + landscape
    if (isTouch && stageRef.current) {
      try { await stageRef.current.requestFullscreen?.(); } catch { /* ignore */ }
      try { await screen.orientation?.lock?.("landscape"); } catch { /* ignore */ }
    }
    clearTimers();
    beginCountdown();
  };

  const restart = () => { setResult(null); clearTimers(); setRaceKey((k) => k + 1); beginCountdown(); };

  const onFinish = (pos) => { setResult(pos); setGameState("finished"); };

  useEffect(() => () => clearTimers(), []);

  // touch tugma yordamchisi
  const bindBtn = (key) => ({
    onPointerDown: (e) => { e.preventDefault(); controlsRef.current[key] = true; },
    onPointerUp: (e) => { e.preventDefault(); controlsRef.current[key] = false; },
    onPointerLeave: () => { controlsRef.current[key] = false; },
    onPointerCancel: () => { controlsRef.current[key] = false; },
  });

  const speedKmh = Math.round(hud.speed * 12);

  return (
    <section id="race" className="section race">
      <div className="container">
        <div className="race__head">
          <span className="eyebrow"><Gamepad2 size={14} /> Poyga rejimi</span>
          <h2 className="section-title">
            Start chizig'idan <span className="gradient-text">finishgacha</span>
          </h2>
          <p className="section-sub">
            AI raqiblar bilan poyga. Desktopda WASD/strelkalar, telefonda
            ekrandagi tugmalar bilan boshqaring. Birinchi bo'lib finishga yeting!
          </p>
        </div>
      </div>

      <div className={`race__stage ${gameState !== "idle" ? "race__stage--active" : ""}`} ref={stageRef}>
        <RaceErrorBoundary>
          <Canvas
            key={raceKey}
            shadows dpr={[1, 2]}
            camera={{ position: [0, 4.4, 11], fov: 55, near: 0.1, far: 200 }}
            gl={{ antialias: true }}
            onCreated={({ gl }) => {
              gl.outputColorSpace = THREE.SRGBColorSpace;
              gl.shadowMap.enabled = true;
              gl.shadowMap.type = THREE.PCFSoftShadowMap;
            }}
          >
            <color attach="background" args={["#0a0c12"]} />
            <fog attach="fog" args={["#0a0c12", 30, 90]} />
            <RaceWorld
              gameStateRef={gameStateRef}
              controlsRef={controlsRef}
              telemetryRef={telemetryRef}
              onFinish={onFinish}
            />
          </Canvas>
        </RaceErrorBoundary>

        {/* HUD */}
        {(gameState === "racing" || gameState === "countdown") && (
          <div className="race__hud-top">
            <div className="race__gauge">
              <span className="race__gauge-num">{speedKmh}</span>
              <span className="race__gauge-unit">km/s</span>
            </div>
            <div className="race__pos">
              <span className="race__pos-num">{hud.position}</span>
              <span className="race__pos-label">/ {RACE_CARS.length} o'rin</span>
            </div>
            <div className="race__progress">
              <div className="race__progress-bar" style={{ width: `${hud.progress * 100}%` }} />
              <Flag size={13} className="race__progress-flag" />
            </div>
          </div>
        )}

        {/* Sanoq */}
        {gameState === "countdown" && (
          <div className="race__count">{countdown > 0 ? countdown : "GO!"}</div>
        )}

        {/* Boshlash ekrani */}
        {gameState === "idle" && (
          <div className="race__overlay">
            <Trophy size={46} className="race__overlay-icon" />
            <h3>Poygaga tayyormisiz?</h3>
            <p>4 ta mashina · AI raqiblar · finishgacha yetib boring</p>
            <button className="race__start" onClick={startRace}>
              <Play size={20} fill="#fff" /> Poygani boshlash
            </button>
            <span className="race__ctrl-hint">
              {isTouch ? "📱 Ekran avtomatik yon (landscape) bo'ladi" : "⌨️ WASD yoki strelka tugmalari"}
            </span>
          </div>
        )}

        {/* Natija */}
        {gameState === "finished" && (
          <div className="race__overlay">
            <div className={`race__medal race__medal--${result}`}>
              {result === 1 ? "🥇" : result === 2 ? "🥈" : result === 3 ? "🥉" : "🏁"}
            </div>
            <h3>{result === 1 ? "G'olib! Siz birinchisiz!" : `${result}-o'rin`}</h3>
            <p>{result === 1 ? "Ajoyib haydash!" : "Yana urinib ko'ring!"}</p>
            <button className="race__start" onClick={restart}>
              <RotateCcw size={18} /> Qayta o'ynash
            </button>
          </div>
        )}

        {/* Mobil boshqaruv */}
        {isTouch && (gameState === "racing" || gameState === "countdown") && (
          <div className="race__touch">
            <div className="race__touch-steer">
              <button className="race__tbtn" {...bindBtn("left")} aria-label="Chap"><ChevronLeft size={30} /></button>
              <button className="race__tbtn" {...bindBtn("right")} aria-label="O'ng"><ChevronRight size={30} /></button>
            </div>
            <div className="race__touch-pedals">
              <button className="race__tbtn race__tbtn--brake" {...bindBtn("down")} aria-label="Tormoz"><ChevronDown size={28} /></button>
              <button className="race__tbtn race__tbtn--gas" {...bindBtn("up")} aria-label="Gaz"><ChevronUp size={34} /></button>
            </div>
          </div>
        )}

        {/* To'liq ekran tugmasi (desktop) */}
        {!isTouch && gameState !== "idle" && (
          <button
            className="race__fs interactive"
            onClick={() => {
              if (!document.fullscreenElement) stageRef.current?.requestFullscreen?.();
              else document.exitFullscreen?.();
            }}
            title="To'liq ekran"
          >
            <Maximize2 size={16} />
          </button>
        )}
      </div>
    </section>
  );
}

RACE_CARS.forEach((car) => useGLTF.preload(car.path));
