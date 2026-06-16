import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { RoundedBox } from "@react-three/drei";

function Wheel({ position, color }) {
  const ref = useRef();
  // Subtle idle spin
  useFrame((_, delta) => {
    if (ref.current) ref.current.rotation.x += delta * 0.4;
  });
  return (
    <group position={position} rotation={[0, 0, Math.PI / 2]}>
      {/* Tyre */}
      <mesh castShadow>
        <cylinderGeometry args={[0.5, 0.5, 0.32, 32]} />
        <meshStandardMaterial color="#0c0c10" roughness={0.85} />
      </mesh>
      {/* Rim */}
      <mesh ref={ref} position={[0, 0.001, 0]}>
        <cylinderGeometry args={[0.34, 0.34, 0.34, 7]} />
        <meshStandardMaterial color={color} metalness={0.95} roughness={0.2} />
      </mesh>
    </group>
  );
}

export default function CarModel({
  bodyColor = "#0c0c12",
  tintOpacity = 0,
  wheelColor = "#2a2a32",
  addons = {},
  modelType = "coupe",
}) {
  const group = useRef();

  // Gentle floating + auto-rotate handled by OrbitControls autoRotate.
  useFrame((state) => {
    if (group.current) {
      group.current.position.y = Math.sin(state.clock.elapsedTime * 0.8) * 0.04;
    }
  });

  const roofHeight =
    modelType === "suv" ? 0.85 : modelType === "sedan" ? 0.6 : 0.5;
  const cabinLength =
    modelType === "sedan" ? 1.9 : modelType === "suv" ? 2.0 : 1.6;

  return (
    <group ref={group} rotation={[0, -0.5, 0]} scale={1.1}>
      {/* Main lower body */}
      <RoundedBox
        args={[4.4, 0.85, 1.9]}
        radius={0.28}
        smoothness={6}
        position={[0, 0.55, 0]}
        castShadow
      >
        <meshStandardMaterial
          color={bodyColor}
          metalness={0.75}
          roughness={0.22}
          envMapIntensity={1}
        />
      </RoundedBox>

      {/* Cabin / roof */}
      <RoundedBox
        args={[cabinLength, roofHeight, 1.6]}
        radius={0.22}
        smoothness={6}
        position={[
          modelType === "sedan" ? -0.1 : 0,
          1.05 + roofHeight / 2 - 0.1,
          0,
        ]}
        castShadow
      >
        <meshStandardMaterial
          color={bodyColor}
          metalness={0.7}
          roughness={0.25}
        />
      </RoundedBox>

      {/* Windows (tint changes opacity/darkness) */}
      <RoundedBox
        args={[cabinLength - 0.12, roofHeight - 0.12, 1.64]}
        radius={0.16}
        smoothness={4}
        position={[
          modelType === "sedan" ? -0.1 : 0,
          1.05 + roofHeight / 2 - 0.1,
          0,
        ]}
      >
        <meshPhysicalMaterial
          color="#9fd0ff"
          transparent
          transmission={1 - tintOpacity * 0.9}
          opacity={1}
          roughness={0.05}
          metalness={0}
          ior={1.3}
          thickness={0.5}
          attenuationColor="#1a2230"
        />
      </RoundedBox>

      {/* Tint glass overlay (darkens with level) */}
      {tintOpacity > 0 && (
        <RoundedBox
          args={[cabinLength - 0.1, roofHeight - 0.1, 1.66]}
          radius={0.16}
          smoothness={4}
          position={[
            modelType === "sedan" ? -0.1 : 0,
            1.05 + roofHeight / 2 - 0.1,
            0,
          ]}
        >
          <meshStandardMaterial
            color="#05060a"
            transparent
            opacity={tintOpacity}
            roughness={0.1}
          />
        </RoundedBox>
      )}

      {/* Headlights */}
      <mesh position={[2.22, 0.6, 0.6]}>
        <boxGeometry args={[0.05, 0.18, 0.4]} />
        <meshStandardMaterial
          color="#ffffff"
          emissive="#cfe8ff"
          emissiveIntensity={1.4}
        />
      </mesh>
      <mesh position={[2.22, 0.6, -0.6]}>
        <boxGeometry args={[0.05, 0.18, 0.4]} />
        <meshStandardMaterial
          color="#ffffff"
          emissive="#cfe8ff"
          emissiveIntensity={1.4}
        />
      </mesh>

      {/* Tail lights */}
      <mesh position={[-2.22, 0.62, 0.55]}>
        <boxGeometry args={[0.05, 0.16, 0.5]} />
        <meshStandardMaterial
          color="#ff2d2d"
          emissive="#ff2d2d"
          emissiveIntensity={1.6}
        />
      </mesh>
      <mesh position={[-2.22, 0.62, -0.55]}>
        <boxGeometry args={[0.05, 0.16, 0.5]} />
        <meshStandardMaterial
          color="#ff2d2d"
          emissive="#ff2d2d"
          emissiveIntensity={1.6}
        />
      </mesh>

      {/* Wheels */}
      <Wheel position={[1.4, 0.5, 1.0]} color={wheelColor} />
      <Wheel position={[1.4, 0.5, -1.0]} color={wheelColor} />
      <Wheel position={[-1.4, 0.5, 1.0]} color={wheelColor} />
      <Wheel position={[-1.4, 0.5, -1.0]} color={wheelColor} />

      {/* Addon: aero body kit (side skirts) */}
      {addons.bodykit && (
        <>
          <mesh position={[0, 0.2, 1.0]} castShadow>
            <boxGeometry args={[3.6, 0.16, 0.18]} />
            <meshStandardMaterial
              color="#111114"
              roughness={0.5}
              metalness={0.4}
            />
          </mesh>
          <mesh position={[0, 0.2, -1.0]} castShadow>
            <boxGeometry args={[3.6, 0.16, 0.18]} />
            <meshStandardMaterial
              color="#111114"
              roughness={0.5}
              metalness={0.4}
            />
          </mesh>
          {/* Front splitter */}
          <mesh position={[2.25, 0.18, 0]} castShadow>
            <boxGeometry args={[0.3, 0.08, 2.0]} />
            <meshStandardMaterial
              color="#111114"
              roughness={0.5}
              metalness={0.4}
            />
          </mesh>
        </>
      )}

      {/* Addon: rear spoiler */}
      {addons.spoiler && (
        <group position={[-2.0, 1.15, 0]}>
          <mesh position={[0, 0.25, 0.7]} castShadow>
            <boxGeometry args={[0.12, 0.5, 0.12]} />
            <meshStandardMaterial
              color="#0a0a0d"
              roughness={0.4}
              metalness={0.6}
            />
          </mesh>
          <mesh position={[0, 0.25, -0.7]} castShadow>
            <boxGeometry args={[0.12, 0.5, 0.12]} />
            <meshStandardMaterial
              color="#0a0a0d"
              roughness={0.4}
              metalness={0.6}
            />
          </mesh>
          <mesh position={[0, 0.5, 0]} castShadow>
            <boxGeometry args={[0.4, 0.06, 1.7]} />
            <meshStandardMaterial
              color="#0a0a0d"
              roughness={0.4}
              metalness={0.6}
            />
          </mesh>
        </group>
      )}

      {/* Addon: exhaust tips */}
      {addons.exhaust && (
        <>
          <mesh position={[-2.3, 0.32, 0.4]} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.09, 0.09, 0.25, 16]} />
            <meshStandardMaterial
              color="#d8d8e0"
              metalness={1}
              roughness={0.15}
            />
          </mesh>
          <mesh position={[-2.3, 0.32, -0.4]} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.09, 0.09, 0.25, 16]} />
            <meshStandardMaterial
              color="#d8d8e0"
              metalness={1}
              roughness={0.15}
            />
          </mesh>
        </>
      )}
    </group>
  );
}
