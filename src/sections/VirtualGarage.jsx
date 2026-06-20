import { Component, Suspense, useEffect, useMemo, useRef, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { ContactShadows, Environment, Html, OrbitControls, useGLTF } from "@react-three/drei";
import { Car, Check, Maximize2, Minimize2, RotateCcw, Sparkles } from "lucide-react";
import * as THREE from "three";
import {
  BODY_COLORS,
  TINT_LEVELS,
  WHEEL_OPTIONS,
  TUNING_ADDONS,
  formatPrice,
} from "../data/content.js";
import "./VirtualGarage.css";

const GARAGE_MODEL_PATH = "/models/garage.glb";
const NORMALIZED_CAR_LENGTH = 4.35;

const CARS_CATALOG = [
  { id: "spark", name: "Chevrolet Spark", path: "/models/spark.glb", basePrice: 9500 },
  { id: "gentra", name: "Chevrolet Gentra", path: "/models/genttra.glb", basePrice: 13800 },
  { id: "malibu", name: "Chevrolet Malibu 2", path: "/models/malibu.glb", basePrice: 28000 },
  { id: "nexia3", name: "Chevrolet Nexia 3", path: "/models/chevrolet_nexia3.glb", basePrice: 12500 },
  { id: "onix", name: "Chevrolet Onix", path: "/models/chevrolet_onix.glb", basePrice: 15500 },
  { id: "captiva", name: "Chevrolet Captiva", path: "/models/chevrolet_captiva.glb", basePrice: 26000 },
  { id: "damas", name: "Chevrolet Damas", path: "/models/chevrolet_damas.glb", basePrice: 7500 },
  { id: "matiz", name: "Chevrolet Matiz", path: "/models/matizz.glb", basePrice: 8200 },
  { id: "nexia01", name: "Chevrolet Nexia 01", path: "/models/nexia01.glb", basePrice: 10200 },
  { id: "nexia2", name: "Chevrolet Nexia 2", path: "/models/nexia_2.glb", basePrice: 11500 },
  { id: "kia-k5", name: "Kia K5", path: "/models/kia_k5.glb", basePrice: 32500 },
  { id: "bmw-m5", name: "BMW M5", path: "/models/bmw_m5.glb", basePrice: 98000 },
  { id: "lada-vesta", name: "Lada Vesta", path: "/models/lada_vesta.glb", basePrice: 14500 },
  { id: "porsche-911", name: "Porsche 911", path: "/models/porschee911.glb", basePrice: 125000 },
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
const rimKeys = ["rim", "diska", "disc", "wheel_disk", "alloy"];
const tireKeys = ["tire", "tyre", "rubber", "shina"];
const partKeys = {
  bodykit: ["bodykit", "body-kit", "kit", "skirt", "splitter", "diffuser", "lip"],
  spoiler: ["spoiler", "wing"],
  exhaust: ["exhaust", "vyxlop", "muffler"],
  suspension: ["suspension", "coilover", "spring", "podveska"],
};

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

function getMatchedPart(targetName) {
  return Object.entries(partKeys).find(([, keys]) => includesAny(targetName, keys))?.[0];
}

function getNormalizedCarTransform(object) {
  const box = new THREE.Box3().setFromObject(object);
  const size = new THREE.Vector3();
  const center = new THREE.Vector3();

  box.getSize(size);
  box.getCenter(center);

  const longestHorizontalSide = Math.max(size.x, size.z, 0.001);
  const scale = NORMALIZED_CAR_LENGTH / longestHorizontalSide;

  return {
    scale,
    position: [
      -center.x * scale,
      -box.min.y * scale,
      -center.z * scale,
    ],
  };
}

class GarageErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) return <GarageFallback />;
    return this.props.children;
  }
}

function GarageFallback() {
  return (
    <group position={[0, 0, 0]}>
      <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[13, 11]} />
        <meshStandardMaterial color="#17191d" roughness={0.7} metalness={0.15} />
      </mesh>
      <mesh receiveShadow position={[0, 2.2, -5.4]}>
        <boxGeometry args={[13, 4.8, 0.18]} />
        <meshStandardMaterial color="#202329" roughness={0.82} />
      </mesh>
      <mesh receiveShadow position={[-6.4, 2.2, 0]} rotation={[0, Math.PI / 2, 0]}>
        <boxGeometry args={[11, 4.8, 0.18]} />
        <meshStandardMaterial color="#1b1f26" roughness={0.84} />
      </mesh>
      <mesh receiveShadow position={[6.4, 2.2, 0]} rotation={[0, Math.PI / 2, 0]}>
        <boxGeometry args={[11, 4.8, 0.18]} />
        <meshStandardMaterial color="#1b1f26" roughness={0.84} />
      </mesh>
      <mesh position={[0, 4.65, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <planeGeometry args={[13, 11]} />
        <meshStandardMaterial color="#24272d" roughness={0.65} side={THREE.DoubleSide} />
      </mesh>
      {[-2.8, 0, 2.8].map((x) => (
        <mesh key={x} position={[x, 4.35, -0.8]}>
          <boxGeometry args={[1.5, 0.05, 0.32]} />
          <meshStandardMaterial color="#f6f7ff" emissive="#ffffff" emissiveIntensity={1.5} />
        </mesh>
      ))}
    </group>
  );
}

function GarageModel() {
  const { scene } = useGLTF(GARAGE_MODEL_PATH);
  const garage = useMemo(() => cloneSceneWithOwnMaterials(scene), [scene]);

  useEffect(() => {
    garage.traverse((child) => {
      if (!child.isMesh || !child.material) return;

      const materials = Array.isArray(child.material) ? child.material : [child.material];
      materials.forEach((material) => {
        material.roughness = Math.max(material.roughness ?? 0.55, 0.42);
        material.metalness = material.metalness ?? 0.1;
        material.needsUpdate = true;
      });
    });
  }, [garage]);

  return (
    <primitive
      object={garage}
      scale={1}
      position={[0, 0, 0]}
      rotation={[0, 0, 0]}
    />
  );
}

function RealCarModel({ modelPath, options }) {
  const { scene } = useGLTF(modelPath);
  const car = useMemo(() => cloneSceneWithOwnMaterials(scene), [scene]);
  const transform = useMemo(() => getNormalizedCarTransform(car), [car]);

  useEffect(() => {
    car.traverse((child) => {
      if (!child.isMesh || !child.material) return;

      const meshName = child.name?.toLowerCase() ?? "";
      const materialName = Array.isArray(child.material)
        ? child.material.map((material) => material.name ?? "").join(" ").toLowerCase()
        : child.material.name?.toLowerCase() ?? "";
      const targetName = `${meshName} ${materialName}`;

      if (targetName.includes("cube")) {
        child.visible = false;
        return;
      }

      const matchedPart = getMatchedPart(targetName);
      if (matchedPart) {
        child.visible = !!options.activeParts[matchedPart];
      }

      const materials = Array.isArray(child.material) ? child.material : [child.material];

      materials.forEach((material) => {
        if (includesAny(targetName, glassKeys)) {
          material.color.set(options.tintColor);
          material.transparent = true;
          material.opacity = options.tintOpacity;
          material.depthWrite = options.tintOpacity > 0.65;
          material.roughness = 0.08;
          material.metalness = 0;
          material.needsUpdate = true;
          return;
        }

        if (includesAny(targetName, tireKeys)) {
          material.color.set("#101010");
          material.roughness = 0.74;
          material.metalness = 0.02;
          material.needsUpdate = true;
          return;
        }

        if (includesAny(targetName, rimKeys)) {
          material.color.set(options.rimColor);
          material.roughness = 0.28;
          material.metalness = 0.85;
          material.needsUpdate = true;
          return;
        }

        if (includesAny(targetName, bodyKeys)) {
          material.color.set(options.bodyColor);
          material.roughness = 0.24;
          material.metalness = 0.38;
          if ("clearcoat" in material) material.clearcoat = 0.75;
          if ("clearcoatRoughness" in material) material.clearcoatRoughness = 0.18;
          material.needsUpdate = true;
        }

        if (matchedPart && options.activeParts[matchedPart]) {
          material.color.set(options.accentColor);
          material.roughness = 0.3;
          material.metalness = 0.55;
          material.needsUpdate = true;
        }
      });
    });
  }, [car, options]);

  return (
    <group position={[0, 0, 0]} rotation={[0, -Math.PI / 10, 0]}>
      <primitive object={car} scale={transform.scale} position={transform.position} />
    </group>
  );
}

function CanvasLoader() {
  return (
    <Html center>
      <div className="garage__loading">3D studio yuklanmoqda...</div>
    </Html>
  );
}

function GarageLighting() {
  return (
    <>
      <ambientLight intensity={0.38} color="#d8e4ff" />
      <directionalLight
        castShadow
        position={[5, 7, 3]}
        intensity={1.55}
        color="#fff2df"
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-near={0.5}
        shadow-camera-far={30}
        shadow-camera-left={-8}
        shadow-camera-right={8}
        shadow-camera-top={8}
        shadow-camera-bottom={-8}
      />
      <spotLight
        castShadow
        position={[0, 5.8, 1.8]}
        angle={0.62}
        penumbra={0.65}
        intensity={3.4}
        color="#ffffff"
        distance={14}
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
      />
      <spotLight
        position={[-3.8, 3.5, -2.5]}
        angle={0.75}
        penumbra={0.8}
        intensity={1.6}
        color="#9fd7ff"
        distance={12}
      />
    </>
  );
}

export default function VirtualGarage() {
  const [car, setCar] = useState(CARS_CATALOG[0]);
  const [color, setColor] = useState(BODY_COLORS[0]);
  const [tint, setTint] = useState(TINT_LEVELS[1]);
  const [wheel, setWheel] = useState(WHEEL_OPTIONS[0]);
  const [addons, setAddons] = useState({});
  const [fullscreen, setFullscreen] = useState(false);
  const stageRef = useRef(null);

  const reset = () => {
    setColor(BODY_COLORS[0]);
    setTint(TINT_LEVELS[1]);
    setWheel(WHEEL_OPTIONS[0]);
    setAddons({});
  };

  const toggleAddon = (id) => {
    setAddons((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const toggleFullscreen = () => {
    const element = stageRef.current;
    if (!document.fullscreenElement) {
      element?.requestFullscreen?.().catch(() => {});
    } else {
      document.exitFullscreen?.();
    }
  };

  useEffect(() => {
    const onChange = () => {
      setFullscreen(!!document.fullscreenElement);
      if (document.pointerLockElement) {
        document.exitPointerLock?.();
      }
      document.body.classList.remove("has-custom-cursor");
    };

    document.addEventListener("fullscreenchange", onChange);
    document.addEventListener("pointerlockchange", onChange);
    return () => {
      document.removeEventListener("fullscreenchange", onChange);
      document.removeEventListener("pointerlockchange", onChange);
    };
  }, []);

  const options = useMemo(
    () => ({
      bodyColor: color.hex,
      accentColor: wheel.color,
      tintColor: tint.opacity > 0.7 ? "#030303" : "#dce8ff",
      tintOpacity: Math.max(0.18, tint.opacity),
      rimColor: wheel.color,
      activeParts: addons,
    }),
    [addons, color.hex, tint.opacity, wheel.color],
  );

  const total = useMemo(() => {
    let sum = car.basePrice + color.price + tint.price + wheel.price;
    TUNING_ADDONS.forEach((addon) => {
      if (addons[addon.id]) sum += addon.price;
    });
    return sum;
  }, [addons, car.basePrice, color.price, tint.price, wheel.price]);

  return (
    <section id="garage" className="section garage">
      <div className="container">
        <div className="garage__head">
          <span className="eyebrow">
            <Sparkles size={14} /> Virtual garaj
          </span>
          <h2 className="section-title">
            Real 3D mashinani <span className="gradient-text">jonli tuning</span> qiling
          </h2>
          <p className="section-sub">
            Eski tekis ikonlar o'rniga haqiqiy GLB avtomobillar ishlaydi. Rang,
            tonirovka va disk sozlamalari faqat mashinaga qo'llanadi, garaj muhiti
            alohida qoladi.
          </p>
        </div>

        <div
          className={`garage__stage ${fullscreen ? "garage__stage--fs" : ""}`}
          ref={stageRef}
        >
          <div className="garage__viewport">
            <Canvas
              shadows
              dpr={[1, 2]}
              camera={{ position: [4.2, 2.25, 5.2], fov: 43, near: 0.1, far: 120 }}
              gl={{ antialias: true, alpha: false, toneMapping: THREE.ACESFilmicToneMapping }}
              onCreated={({ gl }) => {
                gl.outputColorSpace = THREE.SRGBColorSpace;
                gl.toneMappingExposure = 1.08;
                gl.shadowMap.enabled = true;
                gl.shadowMap.type = THREE.PCFSoftShadowMap;
                gl.domElement.style.cursor = "default";
              }}
            >
              <color attach="background" args={["#15171a"]} />
              <GarageLighting />

              <Suspense fallback={<CanvasLoader />}>
                <GarageErrorBoundary>
                  <GarageModel />
                </GarageErrorBoundary>
                <RealCarModel modelPath={car.path} options={options} />
                <Environment preset="warehouse" background={false} />
                <ContactShadows position={[0, 0.02, 0]} opacity={0.42} scale={8} blur={2.4} far={2.5} />
              </Suspense>

              <OrbitControls
                target={[0, 0.35, 0]}
                maxPolarAngle={Math.PI / 2 - 0.04}
                minDistance={2.4}
                maxDistance={9}
                enableDamping
                dampingFactor={0.08}
              />
            </Canvas>

            <div className="garage__car-tag">
              <Car size={15} /> {car.name}
            </div>
            <div className="garage__hint">Aylantiring · g'ildirakda yaqinlashtiring</div>
            <div className="garage__viewport-actions">
              <button className="garage__icon-btn interactive" onClick={reset} title="Tiklash">
                <RotateCcw size={16} />
              </button>
              <button
                className="garage__icon-btn interactive"
                onClick={toggleFullscreen}
                title={fullscreen ? "Chiqish" : "To'liq ekran"}
              >
                {fullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
              </button>
            </div>
          </div>

          <aside className="garage__panel glass">
            <div className="garage__panel-scroll">
              <div className="cfg">
                <div className="cfg__label">Mashinani tanlang</div>
                <div className="cfg__cars">
                  {CARS_CATALOG.map((item) => (
                    <button
                      key={item.id}
                      className={`carbtn interactive ${car.id === item.id ? "carbtn--active" : ""}`}
                      onClick={() => setCar(item)}
                    >
                      <span className="carbtn__name">{item.name}</span>
                      <span className="carbtn__price">{formatPrice(item.basePrice)}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="cfg">
                <div className="cfg__label">Kuzov rangi</div>
                <div className="cfg__colors">
                  {BODY_COLORS.map((item) => (
                    <button
                      key={item.id}
                      className={`swatch interactive ${color.id === item.id ? "swatch--active" : ""}`}
                      style={{
                        background: item.hex,
                        color: ["white", "silver"].includes(item.id) ? "#111" : "#fff",
                      }}
                      onClick={() => setColor(item)}
                      title={`${item.name}${item.price ? " · +" + formatPrice(item.price) : ""}`}
                    >
                      {color.id === item.id && <Check size={16} />}
                    </button>
                  ))}
                </div>
                <div className="cfg__hint">{color.name}</div>
              </div>

              <div className="cfg">
                <div className="cfg__label">Tonirovka</div>
                <div className="cfg__chips">
                  {TINT_LEVELS.map((item) => (
                    <button
                      key={item.id}
                      className={`chip interactive ${tint.id === item.id ? "chip--active" : ""}`}
                      onClick={() => setTint(item)}
                    >
                      {item.name}
                    </button>
                  ))}
                </div>
              </div>

              <div className="cfg">
                <div className="cfg__label">Disklar</div>
                <div className="cfg__chips">
                  {WHEEL_OPTIONS.map((item) => (
                    <button
                      key={item.id}
                      className={`chip interactive ${wheel.id === item.id ? "chip--active" : ""}`}
                      onClick={() => setWheel(item)}
                    >
                      <span className="chip__dot" style={{ background: item.color }} />
                      {item.name}
                    </button>
                  ))}
                </div>
              </div>

              <div className="cfg">
                <div className="cfg__label">Tuning detallari</div>
                <div className="cfg__addons">
                  {TUNING_ADDONS.map((item) => (
                    <button
                      key={item.id}
                      className={`addon interactive ${addons[item.id] ? "addon--active" : ""}`}
                      onClick={() => toggleAddon(item.id)}
                    >
                      <span className="addon__check">{addons[item.id] && <Check size={14} />}</span>
                      <span className="addon__name">{item.name}</span>
                      <span className="addon__price">+{formatPrice(item.price)}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="garage__total">
              <div>
                <div className="garage__total-label">Umumiy narx</div>
                <div className="garage__total-value gradient-text">{formatPrice(total)}</div>
              </div>
              <button className="btn btn-primary interactive">Buyurtma berish</button>
            </div>
          </aside>
        </div>
      </div>
    </section>
  );
}

CARS_CATALOG.forEach((car) => useGLTF.preload(car.path));
