import { Suspense, useRef } from "react";
import { Canvas } from "@react-three/fiber";
import { useFrame } from "@react-three/fiber";
import { Float, ContactShadows } from "@react-three/drei";
import { useInView } from "../../lib/useInView.js";

function Rim({ color = "#d4af37" }) {
  const ref = useRef();
  useFrame((_, delta) => {
    if (ref.current) ref.current.rotation.z += delta * 0.5;
  });
  return (
    <group rotation={[Math.PI / 2.4, 0, 0]}>
      <group ref={ref}>
        {/* Tyre */}
        <mesh>
          <torusGeometry args={[1.15, 0.32, 24, 48]} />
          <meshStandardMaterial color="#0c0c10" roughness={0.85} />
        </mesh>
        {/* Rim base */}
        <mesh>
          <cylinderGeometry args={[1.0, 1.0, 0.4, 48]} />
          <meshStandardMaterial
            color={color}
            metalness={0.95}
            roughness={0.18}
          />
        </mesh>
        {/* Spokes */}
        {Array.from({ length: 7 }).map((_, i) => {
          const a = (i / 7) * Math.PI * 2;
          return (
            <mesh
              key={i}
              position={[Math.cos(a) * 0.5, 0, Math.sin(a) * 0.5]}
              rotation={[0, -a, 0]}
            >
              <boxGeometry args={[0.9, 0.42, 0.16]} />
              <meshStandardMaterial
                color={color}
                metalness={0.95}
                roughness={0.2}
              />
            </mesh>
          );
        })}
        {/* Center cap */}
        <mesh position={[0, 0.22, 0]}>
          <cylinderGeometry args={[0.22, 0.22, 0.12, 24]} />
          <meshStandardMaterial
            color="#ff3d3d"
            metalness={0.6}
            roughness={0.3}
          />
        </mesh>
      </group>
    </group>
  );
}

export default function PartShowcase3D({ color }) {
  const [wrapRef, inView] = useInView();
  return (
    <div ref={wrapRef} style={{ width: "100%", height: "100%" }}>
      <Canvas
        frameloop={inView ? "always" : "never"}
        dpr={[1, 2]}
        camera={{ position: [0, 1.5, 4.5], fov: 40 }}
        gl={{
          antialias: true,
          alpha: true,
          premultipliedAlpha: false,
          powerPreference: "high-performance",
          precision: "mediump",
          stencil: false,
          depth: true,
        }}
        style={{ width: "100%", height: "100%", display: "block", touchAction: "pan-y" }}
      >
        <ambientLight intensity={0.7} />
        <spotLight position={[5, 8, 5]} intensity={2} angle={0.4} penumbra={1} />
        <pointLight position={[-5, 2, -5]} intensity={1} color="#ff8a3d" />
        <Suspense fallback={null}>
          <Float speed={2} rotationIntensity={0.4} floatIntensity={0.6}>
            <Rim color={color} />
          </Float>
          <ContactShadows
            position={[0, -1.6, 0]}
            opacity={0.4}
            scale={8}
            blur={2.5}
          />
        </Suspense>
      </Canvas>
    </div>
  );
}
