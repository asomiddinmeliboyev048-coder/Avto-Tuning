import { Suspense, useMemo, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, ContactShadows, Float, Html } from "@react-three/drei";
import { Check, RotateCcw, Sparkles } from "lucide-react";
import CarModel from "./garage/CarModel.jsx";
import {
  CAR_MODELS,
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
      <div className="garage__loading">3D sahna yuklanmoqda…</div>
    </Html>
  );
}

export default function VirtualGarage() {
  const [model, setModel] = useState(CAR_MODELS[0]);
  const [color, setColor] = useState(BODY_COLORS[0]);
  const [tint, setTint] = useState(TINT_LEVELS[0]);
  const [wheel, setWheel] = useState(WHEEL_OPTIONS[0]);
  const [addons, setAddons] = useState({});

  const toggleAddon = (id) =>
    setAddons((prev) => ({ ...prev, [id]: !prev[id] }));

  const reset = () => {
    setColor(BODY_COLORS[0]);
    setTint(TINT_LEVELS[0]);
    setWheel(WHEEL_OPTIONS[0]);
    setAddons({});
  };

  const total = useMemo(() => {
    let sum = model.basePrice + color.price + tint.price + wheel.price;
    TUNING_ADDONS.forEach((a) => {
      if (addons[a.id]) sum += a.price;
    });
    return sum;
  }, [model, color, tint, wheel, addons]);

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
            O'z mashinangizni <span className="gradient-text">jonli</span>{" "}
            loyihalang
          </h2>
          <p className="section-sub">
            Modelni tanlang, rang, tonirovka, disklar va tuning detallarini
            qo'shing — o'zgarishlarni real vaqtda 3D ko'rinishda ko'ring va narx
            avtomatik hisoblanadi.
          </p>
        </div>

        <div className="garage__layout">
          {/* 3D Viewport */}
          <div className="garage__viewport">
            <Canvas
              shadows
              dpr={[1, 2]}
              camera={{ position: [6, 3, 7], fov: 38 }}
              gl={{ alpha: true, antialias: true }}
            >
              <ambientLight intensity={0.6} />
              <spotLight
                position={[8, 12, 6]}
                angle={0.3}
                penumbra={1}
                intensity={2.2}
                castShadow
                shadow-mapSize={[1024, 1024]}
              />
              <spotLight position={[-8, 6, -6]} intensity={1} color="#ff8a3d" />
              <pointLight
                position={[0, 4, -8]}
                intensity={0.8}
                color="#3d6bff"
              />

              <Suspense fallback={<CanvasLoader />}>
                <Float
                  speed={1.2}
                  rotationIntensity={0.15}
                  floatIntensity={0.3}
                >
                  <CarModel
                    bodyColor={color.hex}
                    tintOpacity={tint.opacity}
                    wheelColor={wheel.color}
                    addons={addonMap}
                    modelType={model.id}
                  />
                </Float>
                <ContactShadows
                  position={[0, -0.02, 0]}
                  opacity={0.55}
                  scale={14}
                  blur={2.6}
                  far={5}
                />
              </Suspense>

              <OrbitControls
                enablePan={false}
                minPolarAngle={0.4}
                maxPolarAngle={Math.PI / 2.05}
                minDistance={6}
                maxDistance={14}
                autoRotate
                autoRotateSpeed={0.6}
              />
            </Canvas>

            <div className="garage__hint">
              Sichqoncha bilan aylantiring · g'ildirakda yaqinlashtiring
            </div>
            <button className="garage__reset interactive" onClick={reset}>
              <RotateCcw size={15} /> Tiklash
            </button>
          </div>

          {/* Configurator panel */}
          <aside className="garage__panel glass">
            <div className="garage__panel-scroll">
              {/* Model */}
              <div className="cfg">
                <div className="cfg__label">Model</div>
                <div className="cfg__chips">
                  {CAR_MODELS.map((m) => (
                    <button
                      key={m.id}
                      className={`chip interactive ${
                        model.id === m.id ? "chip--active" : ""
                      }`}
                      onClick={() => setModel(m)}
                    >
                      {m.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Body color */}
              <div className="cfg">
                <div className="cfg__label">Tana rangi</div>
                <div className="cfg__colors">
                  {BODY_COLORS.map((c) => (
                    <button
                      key={c.id}
                      className={`swatch interactive ${
                        color.id === c.id ? "swatch--active" : ""
                      }`}
                      style={{ background: c.hex }}
                      onClick={() => setColor(c)}
                      title={`${c.name}${c.price ? " · +" + formatPrice(c.price) : ""}`}
                    >
                      {color.id === c.id && <Check size={16} />}
                    </button>
                  ))}
                </div>
                <div className="cfg__hint">{color.name}</div>
              </div>

              {/* Tint */}
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

              {/* Wheels */}
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

              {/* Addons */}
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

            {/* Total */}
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
