import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { Canvas } from "@react-three/fiber";
import {
  OrbitControls,
  ContactShadows,
  Environment,
  Lightformer,
  Html,
  MeshReflectorMaterial,
} from "@react-three/drei";
import {
  Check,
  RotateCcw,
  Sparkles,
  Maximize2,
  Minimize2,
  Car,
} from "lucide-react";
import CarModel from "./garage/CarModel.jsx";
import {
  UZ_CARS,
  BODY_COLORS,
  TINT_LEVELS,
  WHEEL_OPTIONS,
  TUNING_ADDONS,
  formatPrice,
} from "../data/content.js";
import "./VirtualGarage.css";

function CanvasLoader() {
  return (
    <Html center>
      <div className="garage__loading">3D mashina yuklanmoqda…</div>
    </Html>
  );
}

// Showroom poli (aks etuvchi) + chiroqlar
function Showroom() {
  return (
    <>
      <ambientLight intensity={0.5} />
      <spotLight
        position={[6, 10, 6]}
        angle={0.35}
        penumbra={1}
        intensity={2.4}
        castShadow
        shadow-mapSize={[2048, 2048]}
      />
      <spotLight position={[-8, 6, -4]} intensity={1.1} color="#ff8a3d" />
      <pointLight position={[0, 5, -8]} intensity={0.7} color="#3d6bff" />

      {/* Tashqi fayl talab qilmaydigan studiya muhiti (akslar uchun) */}
      <Environment resolution={256}>
        <Lightformer
          intensity={2}
          position={[0, 5, -5]}
          scale={[10, 5, 1]}
          color="#ffffff"
        />
        <Lightformer
          intensity={1.4}
          position={[-5, 2, 2]}
          scale={[6, 6, 1]}
          color="#aac4ff"
        />
        <Lightformer
          intensity={1.4}
          position={[5, 2, 2]}
          scale={[6, 6, 1]}
          color="#ffd0a8"
        />
        <Lightformer
          intensity={3}
          position={[0, 6, 3]}
          scale={[10, 1, 1]}
          color="#ffffff"
        />
      </Environment>

      {/* Aks etuvchi pol */}
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, -0.51, 0]}
        receiveShadow
      >
        <planeGeometry args={[60, 60]} />
        <MeshReflectorMaterial
          resolution={512}
          mirror={0.45}
          mixBlur={6}
          mixStrength={1.2}
          blur={[300, 80]}
          roughness={0.9}
          depthScale={1.1}
          minDepthThreshold={0.4}
          maxDepthThreshold={1.2}
          color="#0a0a0f"
          metalness={0.6}
        />
      </mesh>
      <ContactShadows
        position={[0, -0.5, 0]}
        opacity={0.6}
        scale={16}
        blur={2.4}
        far={6}
      />
    </>
  );
}

export default function VirtualGarage() {
  const [car, setCar] = useState(UZ_CARS[1]); // Nexia default
  const [color, setColor] = useState(BODY_COLORS[0]); // oq default
  const [tint, setTint] = useState(TINT_LEVELS[0]);
  const [wheel, setWheel] = useState(WHEEL_OPTIONS[0]);
  const [addons, setAddons] = useState({});
  const [fullscreen, setFullscreen] = useState(false);
  const stageRef = useRef(null);

  const toggleAddon = (id) =>
    setAddons((prev) => ({ ...prev, [id]: !prev[id] }));

  const reset = () => {
    setColor(BODY_COLORS[0]);
    setTint(TINT_LEVELS[0]);
    setWheel(WHEEL_OPTIONS[0]);
    setAddons({});
  };

  // Fullscreen boshqaruvi
  const toggleFullscreen = () => {
    const el = stageRef.current;
    if (!document.fullscreenElement) {
      el?.requestFullscreen?.().catch(() => {});
    } else {
      document.exitFullscreen?.();
    }
  };
  useEffect(() => {
    const onChange = () => setFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", onChange);
    return () => document.removeEventListener("fullscreenchange", onChange);
  }, []);

  const total = useMemo(() => {
    let sum = car.basePrice + color.price + tint.price + wheel.price;
    TUNING_ADDONS.forEach((a) => {
      if (addons[a.id]) sum += a.price;
    });
    return sum;
  }, [car, color, tint, wheel, addons]);

  const addonMap = useMemo(
    () => ({
      bodykit: addons.bodykit,
      spoiler: addons.spoiler,
      exhaust: addons.exhaust,
      suspension: addons.suspension,
    }),
    [addons],
  );

  return (
    <section id="garage" className="section garage">
      <div className="container">
        <div className="garage__head">
          <span className="eyebrow">
            <Sparkles size={14} /> Virtual garaj
          </span>
          <h2 className="section-title">
            O'z mashinangizni <span className="gradient-text">tanlang</span> va
            jonli loyihalang
          </h2>
          <p className="section-sub">
            O'zbekistondagi mashinani tanlang — aynan o'sha model 3D'da chiqadi.
            Rang, tonirovka, disk va tuning detallarini qo'shing, 360°
            aylantiring va to'liq ekranda ko'ring. Narx avtomatik hisoblanadi.
          </p>
        </div>

        <div
          className={`garage__stage ${fullscreen ? "garage__stage--fs" : ""}`}
          ref={stageRef}
        >
          {/* 3D ko'rinish */}
          <div className="garage__viewport">
            <Canvas
              shadows
              dpr={[1, 2]}
              gl={{ alpha: true, antialias: true }}
              camera={{ position: [6.5, 2.4, 7.5], fov: 38 }}
            >
              <Suspense fallback={<CanvasLoader />}>
                <Showroom />
                <CarModel
                  spec={car.spec}
                  shape={car.shape}
                  bodyColor={color.hex}
                  tintOpacity={tint.opacity}
                  wheelColor={wheel.color}
                  wheelSpokes={wheel.spokes}
                  addons={addonMap}
                />
              </Suspense>

              <OrbitControls
                enablePan={false}
                minPolarAngle={0.3}
                maxPolarAngle={Math.PI / 2.05}
                minDistance={5}
                maxDistance={16}
                autoRotate
                autoRotateSpeed={0.7}
                target={[0, 0.1, 0]}
              />
            </Canvas>

            <div className="garage__car-tag">
              <Car size={15} /> {car.name}
            </div>
            <div className="garage__hint">
              Aylantiring · g'ildirakda yaqinlashtiring
            </div>
            <div className="garage__viewport-actions">
              <button
                className="garage__icon-btn interactive"
                onClick={reset}
                title="Tiklash"
              >
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

          {/* Konfigurator paneli */}
          <aside className="garage__panel glass">
            <div className="garage__panel-scroll">
              {/* Mashina tanlash */}
              <div className="cfg">
                <div className="cfg__label">Mashinani tanlang</div>
                <div className="cfg__cars">
                  {UZ_CARS.map((c) => (
                    <button
                      key={c.id}
                      className={`carbtn interactive ${
                        car.id === c.id ? "carbtn--active" : ""
                      }`}
                      onClick={() => setCar(c)}
                    >
                      <span className="carbtn__name">{c.name}</span>
                      <span className="carbtn__price">
                        {formatPrice(c.basePrice)}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Tana rangi */}
              <div className="cfg">
                <div className="cfg__label">Tana rangi</div>
                <div className="cfg__colors">
                  {BODY_COLORS.map((c) => (
                    <button
                      key={c.id}
                      className={`swatch interactive ${
                        color.id === c.id ? "swatch--active" : ""
                      }`}
                      style={{
                        background: c.hex,
                        color: ["white", "silver"].includes(c.id)
                          ? "#111"
                          : "#fff",
                      }}
                      onClick={() => setColor(c)}
                      title={`${c.name}${c.price ? " · +" + formatPrice(c.price) : ""}`}
                    >
                      {color.id === c.id && <Check size={16} />}
                    </button>
                  ))}
                </div>
                <div className="cfg__hint">{color.name}</div>
              </div>

              {/* Tonirovka */}
              <div className="cfg">
                <div className="cfg__label">Tonirovka</div>
                <div className="cfg__chips">
                  {TINT_LEVELS.map((t) => (
                    <button
                      key={t.id}
                      className={`chip interactive ${
                        tint.id === t.id ? "chip--active" : ""
                      }`}
                      onClick={() => setTint(t)}
                    >
                      {t.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Disklar */}
              <div className="cfg">
                <div className="cfg__label">Disklar</div>
                <div className="cfg__chips">
                  {WHEEL_OPTIONS.map((w) => (
                    <button
                      key={w.id}
                      className={`chip interactive ${
                        wheel.id === w.id ? "chip--active" : ""
                      }`}
                      onClick={() => setWheel(w)}
                    >
                      <span
                        className="chip__dot"
                        style={{ background: w.color }}
                      />
                      {w.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Tuning */}
              <div className="cfg">
                <div className="cfg__label">Tuning detallari</div>
                <div className="cfg__addons">
                  {TUNING_ADDONS.map((a) => (
                    <button
                      key={a.id}
                      className={`addon interactive ${
                        addons[a.id] ? "addon--active" : ""
                      }`}
                      onClick={() => toggleAddon(a.id)}
                    >
                      <span className="addon__check">
                        {addons[a.id] && <Check size={14} />}
                      </span>
                      <span className="addon__name">{a.name}</span>
                      <span className="addon__price">
                        +{formatPrice(a.price)}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Jami narx */}
            <div className="garage__total">
              <div>
                <div className="garage__total-label">Umumiy narx</div>
                <div className="garage__total-value gradient-text">
                  {formatPrice(total)}
                </div>
              </div>
              <button className="btn btn-primary interactive">
                Buyurtma berish
              </button>
            </div>
          </aside>
        </div>
      </div>
    </section>
  );
}
