import { Component, Suspense, useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Environment, Html, OrbitControls, PerspectiveCamera, useGLTF } from "@react-three/drei";
import { Gamepad2, RotateCcw } from "lucide-react";
import * as THREE from "three";
import "./RacingGame.css";

const TRACK_MODEL_PATH = "/models/racing_track.glb";
const TARGET_CAR_LENGTH = 2.35;
const STARTING_GRID_CENTER = [0, 0.04, 0];
const LANE_SPACING = 2.35;
const ROW_SPACING = 3.05;
const STARTING_ROTATION_Y = Math.PI;

const RACE_CARS = [
  {
    id: "player",
    label: "Player",
    path: "/models/spark.glb",
    color: "#ff3d3d",
    grid: [-LANE_SPACING / 2, 0, 0],
    controllable: true,
  },
  {
    id: "opponent-1",
    label: "Opponent 1",
    path: "/models/bmw_m5.glb",
    color: "#2f7dff",
    grid: [LANE_SPACING / 2, 0, 0],
  },
  {
    id: "opponent-2",
    label: "Opponent 2",
    path: "/models/kia_k5.glb",
    color: "#f5f5f7",
    grid: [-LANE_SPACING / 2, 0, ROW_SPACING],
  },
  {
    id: "opponent-3",
    label: "Opponent 3",
    path: "/models/porschee911.glb",
    color: "#f4b73f",
    grid: [LANE_SPACING / 2, 0, ROW_SPACING],
  },
];

const bodyKeys = [
  "body",
  "kuzov",
  "carpaint",
  "paint",
  "chassis",
  "hood",
  "door",
  "bumper",
  "fender",
  "roof",
  "bonnet",
  "trunk",
  "quarter",
];

const glassKeys = ["glass", "oyna", "window", "windshield", "windscreen", "clearglass"];
const wheelKeys = ["rim", "diska", "disc", "wheel_disk", "alloy"];
const tireKeys = ["tire", "tyre", "rubber", "shina"];

function includesAny(value, keys) {
  return keys.some((key) => value.includes(key));
}

function cloneSceneWithOwnMaterials(scene) {
  const clone = scene.clone(true);

  clone.traverse((child) => {
    if (!child.isMesh) return;

    const meshName = child.name?.toLowerCase() ?? "";
    if (meshName === "cube" || meshName.includes("cube")) {
      child.visible = false;
      return;
    }

    child.castShadow = true;
    child.receiveShadow = true;

    if (Array.isArray(child.material)) {
      child.material = child.material.map((material) => material.clone());
    } else if (child.material) {
      child.material = child.material.clone();
    }
  });

  return clone;
}

function getNormalizedTransform(object) {
  const box = new THREE.Box3().setFromObject(object);
  const size = new THREE.Vector3();
  const center = new THREE.Vector3();

  box.getSize(size);
  box.getCenter(center);

  const longestSide = Math.max(size.x, size.z, 0.001);
  const scale = TARGET_CAR_LENGTH / longestSide;

  return {
    scale,
    position: [-center.x * scale, -box.min.y * scale, -center.z * scale],
  };
}

function SceneLoader() {
  return (
    <Html center>
      <div className="race__loading">Race scene yuklanmoqda...</div>
    </Html>
  );
}

// 3D modelda xato bo'lsa butun sayt qulamasligi uchun zaxira trassa.
class TrackErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  render() {
    if (this.state.hasError) return <FallbackTrack />;
    return this.props.children;
  }
}

function FallbackTrack() {
  return (
    <group>
      {/* asfalt */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 8]} receiveShadow>
        <planeGeometry args={[14, 60]} />
        <meshStandardMaterial color="#1c1f26" roughness={0.9} />
      </mesh>
      {/* o'rta chiziq */}
      {Array.from({ length: 16 }).map((_, i) => (
        <mesh key={i} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, -6 + i * 3]}>
          <planeGeometry args={[0.18, 1.4]} />
          <meshStandardMaterial color="#f4f4f7" emissive="#f4f4f7" emissiveIntensity={0.4} />
        </mesh>
      ))}
      {/* start chizig'i */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, -2]}>
        <planeGeometry args={[7, 0.6]} />
        <meshStandardMaterial color="#ffffff" />
      </mesh>
    </group>
  );
}

function RacingTrack() {
  const { scene } = useGLTF(TRACK_MODEL_PATH);
  const track = useMemo(() => cloneSceneWithOwnMaterials(scene), [scene]);

  useEffect(() => {
    track.traverse((child) => {
      if (!child.isMesh || !child.material) return;
      child.receiveShadow = true;
      child.castShadow = false;
    });
  }, [track]);

  return <primitive object={track} position={[0, 0, 0]} rotation={[0, 0, 0]} scale={1} />;
}

function RaceCar({ car, controlsRef, onPlayerPose }) {
  const { scene } = useGLTF(car.path);
  const model = useMemo(() => cloneSceneWithOwnMaterials(scene), [scene]);
  const transform = useMemo(() => getNormalizedTransform(model), [model]);
  const groupRef = useRef(null);
  const velocityRef = useRef(0);

  const startPosition = useMemo(
    () => [
      STARTING_GRID_CENTER[0] + car.grid[0],
      STARTING_GRID_CENTER[1] + car.grid[1],
      STARTING_GRID_CENTER[2] + car.grid[2],
    ],
    [car.grid],
  );

  useEffect(() => {
    model.traverse((child) => {
      if (!child.isMesh || !child.material) return;

      const meshName = child.name?.toLowerCase() ?? "";
      const materialName = Array.isArray(child.material)
        ? child.material.map((material) => material.name ?? "").join(" ").toLowerCase()
        : child.material.name?.toLowerCase() ?? "";
      const targetName = `${meshName} ${materialName}`;
      const materials = Array.isArray(child.material) ? child.material : [child.material];

      materials.forEach((material) => {
        if (includesAny(targetName, glassKeys)) {
          material.color.set("#121722");
          material.transparent = true;
          material.opacity = 0.48;
          material.roughness = 0.08;
          material.needsUpdate = true;
          return;
        }

        if (includesAny(targetName, tireKeys)) {
          material.color.set("#101010");
          material.roughness = 0.78;
          material.needsUpdate = true;
          return;
        }

        if (includesAny(targetName, wheelKeys)) {
          material.color.set("#d4d7dd");
          material.metalness = 0.85;
          material.roughness = 0.22;
          material.needsUpdate = true;
          return;
        }

        if (includesAny(targetName, bodyKeys)) {
          material.color.set(car.color);
          material.metalness = 0.38;
          material.roughness = 0.24;
          if ("clearcoat" in material) material.clearcoat = 0.75;
          material.needsUpdate = true;
        }
      });
    });
  }, [car.color, model]);

  useFrame((_, delta) => {
    const group = groupRef.current;
    if (!group || !car.controllable) return;

    const controls = controlsRef.current;
    const forward = controls.has("KeyW") || controls.has("ArrowUp");
    const reverse = controls.has("KeyS") || controls.has("ArrowDown");
    const left = controls.has("KeyA") || controls.has("ArrowLeft");
    const right = controls.has("KeyD") || controls.has("ArrowRight");

    const acceleration = forward ? 6.2 : reverse ? -3.5 : 0;
    velocityRef.current += acceleration * delta;
    velocityRef.current *= 0.965;
    velocityRef.current = THREE.MathUtils.clamp(velocityRef.current, -3.2, 7.5);

    const steering = (left ? 1 : 0) - (right ? 1 : 0);
    const steeringStrength = THREE.MathUtils.clamp(Math.abs(velocityRef.current) / 3.5, 0.25, 1);
    group.rotation.y += steering * steeringStrength * 1.9 * delta;

    group.position.x += Math.sin(group.rotation.y) * velocityRef.current * delta;
    group.position.z += Math.cos(group.rotation.y) * velocityRef.current * delta;

    onPlayerPose?.(group.position, group.rotation.y);
  });

  return (
    <group ref={groupRef} position={startPosition} rotation={[0, STARTING_ROTATION_Y, 0]}>
      <primitive object={model} scale={transform.scale} position={transform.position} />
    </group>
  );
}

function RacingScene() {
  const keysRef = useRef(new Set());
  const controlsRef = useRef(keysRef.current);
  const orbitRef = useRef(null);

  useEffect(() => {
    const onKeyDown = (event) => {
      if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "KeyW", "KeyA", "KeyS", "KeyD"].includes(event.code)) {
        event.preventDefault();
        keysRef.current.add(event.code);
      }
    };
    const onKeyUp = (event) => keysRef.current.delete(event.code);

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
    };
  }, []);

  const handlePlayerPose = (position) => {
    if (!orbitRef.current) return;
    orbitRef.current.target.lerp(position, 0.08);
  };

  return (
    <>
      <PerspectiveCamera makeDefault position={[0, 10, 13]} fov={48} />
      <ambientLight intensity={0.6} />
      <directionalLight
        castShadow
        position={[8, 14, 7]}
        intensity={2.1}
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-left={-20}
        shadow-camera-right={20}
        shadow-camera-top={20}
        shadow-camera-bottom={-20}
      />
      <spotLight position={[-8, 10, -6]} intensity={1.4} angle={0.5} penumbra={0.7} />

      <Suspense fallback={<SceneLoader />}>
        <TrackErrorBoundary>
          <RacingTrack />
        </TrackErrorBoundary>
        {RACE_CARS.map((car) => (
          <RaceCar
            key={car.id}
            car={car}
            controlsRef={controlsRef}
            onPlayerPose={car.controllable ? handlePlayerPose : undefined}
          />
        ))}
        <Environment preset="city" background={false} />
      </Suspense>

      <OrbitControls
        ref={orbitRef}
        target={[STARTING_GRID_CENTER[0], STARTING_GRID_CENTER[1], STARTING_GRID_CENTER[2] + 1]}
        enableDamping
        dampingFactor={0.08}
        maxPolarAngle={Math.PI / 2 - 0.04}
        minDistance={5}
        maxDistance={26}
      />
    </>
  );
}

export default function RacingGame() {
  const [resetKey, setResetKey] = useState(0);

  return (
    <section id="race" className="section race">
      <div className="container">
        <div className="race__head">
          <span className="eyebrow">
            <Gamepad2 size={14} /> Race mode
          </span>
          <h2 className="section-title">
            Start chizig'ida <span className="gradient-text">4 ta real GLB mashina</span>
          </h2>
          <p className="section-sub">
            WASD yoki arrow keys bilan player mashinani boshqaring. Barcha
            avtomobillar bounding box orqali bir xil o'lchamga keltirilgan va
            2x2 start gridga joylangan.
          </p>
        </div>

        <div className="race__stage glass">
          <Canvas
            key={resetKey}
            shadows
            dpr={[1, 2]}
            gl={{ antialias: true }}
            onCreated={({ gl }) => {
              gl.outputColorSpace = THREE.SRGBColorSpace;
              gl.shadowMap.enabled = true;
              gl.shadowMap.type = THREE.PCFSoftShadowMap;
            }}
          >
            <color attach="background" args={["#11141a"]} />
            <RacingScene />
          </Canvas>

          <div className="race__hud">
            <div>
              <div className="race__hud-label">Controls</div>
              <div className="race__hud-value">WASD / Arrow keys</div>
            </div>
            <button className="race__reset interactive" onClick={() => setResetKey((value) => value + 1)}>
              <RotateCcw size={16} />
              Reset
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

useGLTF.preload(TRACK_MODEL_PATH);
RACE_CARS.forEach((car) => useGLTF.preload(car.path));
