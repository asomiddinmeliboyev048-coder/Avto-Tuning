import { useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";

/* ------------------------------------------------------------------
   Realistik avtomobil generatori.
   Har bir kuzov turi (sedan / hatchback / suv / van / pickup) uchun
   2D yon-profil quriladi va kenglik bo'ylab extrude qilinadi —
   bu bilan kapot, old oyna qiyaligi, tom va orqa siluet hosil bo'ladi.
------------------------------------------------------------------- */

const BEVEL = 0.07;

// Yon-profil nuqtalarini (x = uzunlik, y = balandlik) qaytaradi.
function buildProfile(shape, s) {
  const hL = s.length / 2;
  const BH = s.bodyH;
  const roofY = BH + s.roofH;
  const hoodLen = s.hoodLen;
  const cabinLen = s.cabinLen;
  const rx = s.roofX || 0;
  const cowlX = hL - hoodLen + rx;
  const pts = [];

  if (shape === "van") {
    const wsRun = cabinLen * 0.12;
    pts.push(
      [hL, BH * 0.4],
      [hL, BH * 0.78],
      [hL - hoodLen * 0.6, BH * 0.95],
      [cowlX, BH * 0.92],
      [cowlX + wsRun, roofY],
      [-hL + 0.18, roofY],
      [-hL + 0.02, roofY - 0.12],
      [-hL, BH * 0.55],
      [-hL, BH * 0.4],
    );
  } else if (shape === "pickup") {
    const cabFrontX = hL - hoodLen - 0.1;
    const cabRearX = cabFrontX - cabinLen;
    const bedY = BH * 0.92;
    pts.push(
      [hL, BH * 0.4],
      [hL, BH * 0.82],
      [cabFrontX + 0.1, BH * 0.92],
      [cabFrontX, roofY],
      [cabRearX, roofY],
      [cabRearX - 0.1, bedY],
      [cabRearX - 0.12, BH * 0.62],
      [-hL + 0.05, BH * 0.62],
      [-hL, BH * 0.6],
      [-hL, BH * 0.4],
    );
  } else if (shape === "suv") {
    const wsRun = cabinLen * 0.2;
    const roofFrontX = cowlX + wsRun;
    const roofRearX = roofFrontX - cabinLen;
    pts.push(
      [hL, BH * 0.42],
      [hL, BH * 0.84],
      [hL - 0.18, BH * 0.95],
      [cowlX, BH],
      [roofFrontX, roofY],
      [roofRearX, roofY],
      [roofRearX - 0.18, roofY - 0.05],
      [-hL + 0.06, BH * 0.96],
      [-hL, BH * 0.55],
      [-hL, BH * 0.42],
    );
  } else if (shape === "hatchback") {
    const wsRun = cabinLen * 0.32;
    const roofFrontX = cowlX + wsRun;
    const roofRearX = roofFrontX - cabinLen * 0.78;
    pts.push(
      [hL, BH * 0.4],
      [hL, BH * 0.8],
      [hL - 0.14, BH * 0.92],
      [cowlX, BH],
      [roofFrontX, roofY],
      [roofRearX, roofY],
      [-hL + 0.05, BH * 0.74],
      [-hL, BH * 0.5],
      [-hL, BH * 0.4],
    );
  } else {
    // sedan
    const wsRun = cabinLen * 0.3;
    const blRun = cabinLen * 0.32;
    const roofFrontX = cowlX + wsRun;
    const roofRearX = roofFrontX - cabinLen;
    const trunkX = roofRearX - blRun;
    pts.push(
      [hL, BH * 0.4],
      [hL, BH * 0.78],
      [hL - 0.16, BH * 0.9],
      [cowlX, BH],
      [roofFrontX, roofY],
      [roofRearX, roofY],
      [trunkX, BH],
      [-hL + 0.06, BH * 0.92],
      [-hL, BH * 0.55],
      [-hL, BH * 0.4],
    );
  }
  return pts;
}

function BodyShell({ shape, spec, color }) {
  const geometry = useMemo(() => {
    const pts = buildProfile(shape, spec);
    const sh = new THREE.Shape();
    sh.moveTo(pts[0][0], pts[0][1]);
    for (let i = 1; i < pts.length; i++) sh.lineTo(pts[i][0], pts[i][1]);
    sh.closePath();

    const depth = spec.width;
    const geo = new THREE.ExtrudeGeometry(sh, {
      depth,
      bevelEnabled: true,
      bevelThickness: BEVEL,
      bevelSize: BEVEL,
      bevelSegments: 4,
      steps: 1,
      curveSegments: 12,
    });
    geo.translate(0, 0, -depth / 2);
    geo.computeVertexNormals();
    return geo;
  }, [shape, spec]);

  return (
    <mesh
      geometry={geometry}
      castShadow
      receiveShadow
      position={[0, spec.ground, 0]}
    >
      <meshPhysicalMaterial
        color={color}
        metalness={0.55}
        roughness={0.32}
        clearcoat={1}
        clearcoatRoughness={0.12}
        envMapIntensity={1.25}
      />
    </mesh>
  );
}

function Glass({ shape, spec, tintOpacity }) {
  const s = spec;
  const hL = s.length / 2;
  const BH = s.bodyH;
  const roofY = BH + s.roofH;
  const rx = s.roofX || 0;
  const cowlX = hL - s.hoodLen + rx;
  const beltY = s.ground + BH + 0.04;
  const topY = s.ground + roofY - 0.08;
  const midY = (beltY + topY) / 2;
  const greenLen = s.cabinLen * (shape === "hatchback" ? 0.7 : 0.82);
  // Greenhouse markazi (taxminan kabina markazi)
  const centerX =
    shape === "van" || shape === "pickup"
      ? cowlX - greenLen * 0.45
      : cowlX - s.cabinLen * 0.45 + greenLen * 0.05;

  const sideOuter = s.width / 2 + BEVEL;
  const glassColor = "#0a0d14";
  const sideOpacity = Math.min(0.93, 0.5 + tintOpacity * 0.5);

  return (
    <group>
      {/* Yon oynalar — tana sirtiga joylashtiriladi */}
      {[1, -1].map((side) => (
        <mesh key={side} position={[centerX, midY, side * sideOuter]}>
          <boxGeometry args={[greenLen, (topY - beltY) * 0.9, 0.03]} />
          <meshPhysicalMaterial
            color={glassColor}
            metalness={0.2}
            roughness={0.06}
            transparent
            opacity={sideOpacity}
            transmission={0.2}
            clearcoat={1}
          />
        </mesh>
      ))}

      {/* Old oyna (windshield) — old tom qiyaligida */}
      {shape !== "van" && (
        <mesh
          position={[centerX + greenLen / 2 + 0.18, midY + 0.04, 0]}
          rotation={[0, 0, -0.95]}
        >
          <boxGeometry args={[(topY - beltY) * 1.3, 0.03, s.width * 0.82]} />
          <meshPhysicalMaterial
            color="#9cc0e0"
            metalness={0.1}
            roughness={0.04}
            transparent
            opacity={0.42}
            transmission={0.7}
            clearcoat={1}
          />
        </mesh>
      )}
    </group>
  );
}

function Wheel({ radius = 0.34, width = 0.26, color = "#3a3d44", spokes = 5 }) {
  const ref = useRef();
  // Aylanish o'qi Z bo'ylab (mashina kengligi). Z atrofida aylanadi.
  useFrame((_, delta) => {
    if (ref.current) ref.current.rotation.z += delta * 0.4;
  });
  const rim = radius * 0.62;
  return (
    <group>
      {/* Shina (o'qi Z) */}
      <mesh castShadow>
        <torusGeometry args={[radius * 0.84, radius * 0.34, 20, 40]} />
        <meshStandardMaterial color="#0a0a0d" roughness={0.85} />
      </mesh>
      {/* Yon devor to'ldiruvchi */}
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[radius * 0.85, radius * 0.85, width, 40]} />
        <meshStandardMaterial color="#0c0c10" roughness={0.9} />
      </mesh>
      {/* Tormoz diski */}
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[rim * 0.92, rim * 0.92, width * 0.5, 28]} />
        <meshStandardMaterial color="#6a6d75" metalness={0.9} roughness={0.4} />
      </mesh>
      {/* Aylanuvchi disk */}
      <group ref={ref}>
        <mesh
          position={[0, 0, width / 2 - 0.02]}
          rotation={[Math.PI / 2, 0, 0]}
        >
          <cylinderGeometry args={[rim, rim, 0.06, 32]} />
          <meshStandardMaterial
            color={color}
            metalness={0.95}
            roughness={0.18}
          />
        </mesh>
        {/* Spitsalar (disk yuzasida) */}
        {Array.from({ length: spokes }).map((_, i) => {
          const a = (i / spokes) * Math.PI * 2;
          return (
            <mesh
              key={i}
              position={[
                Math.cos(a) * rim * 0.5,
                Math.sin(a) * rim * 0.5,
                width / 2,
              ]}
              rotation={[0, 0, -a]}
            >
              <boxGeometry args={[rim * 0.9, rim * 0.2, 0.05]} />
              <meshStandardMaterial
                color={color}
                metalness={0.95}
                roughness={0.2}
              />
            </mesh>
          );
        })}
        {/* Markaziy qopqoq */}
        <mesh
          position={[0, 0, width / 2 + 0.02]}
          rotation={[Math.PI / 2, 0, 0]}
        >
          <cylinderGeometry args={[rim * 0.22, rim * 0.22, 0.05, 20]} />
          <meshStandardMaterial
            color="#ff3d3d"
            metalness={0.5}
            roughness={0.3}
          />
        </mesh>
      </group>
    </group>
  );
}

export default function CarModel({
  bodyColor = "#eef0f2",
  tintOpacity = 0,
  wheelColor = "#3a3d44",
  wheelSpokes = 5,
  addons = {},
  spec,
  shape = "sedan",
}) {
  const group = useRef();

  useFrame((state) => {
    if (group.current) {
      group.current.position.y =
        -0.44 + Math.sin(state.clock.elapsedTime * 0.7) * 0.012;
    }
  });

  if (!spec) return null;

  const s = spec;
  const hL = s.length / 2;
  const wbX = s.wheelbase / 2;
  const sideOuter = s.width / 2 + BEVEL;
  const wheelZ = s.width / 2 - 0.04;
  const wheelY = s.wheelR;
  const archY = s.ground + s.bodyH * 0.3;

  const wheelPositions = [
    [wbX, wheelY, wheelZ],
    [wbX, wheelY, -wheelZ],
    [-wbX, wheelY, wheelZ],
    [-wbX, wheelY, -wheelZ],
  ];

  // Barcha mashinalar ekranda mos kelishi uchun masshtab
  const scale = 4.4 / s.length;

  return (
    <group
      ref={group}
      scale={scale}
      position={[0, -0.44, 0]}
      rotation={[0, -0.6, 0]}
    >
      <BodyShell shape={shape} spec={s} color={bodyColor} />
      <Glass shape={shape} spec={s} tintOpacity={tintOpacity} />

      {/* G'ildirak archlari (yarim halqa, tana yonida) */}
      {wheelPositions.map((p, i) => (
        <mesh
          key={"arch" + i}
          position={[p[0], archY, p[2] > 0 ? sideOuter : -sideOuter]}
        >
          <torusGeometry args={[s.wheelR * 1.16, 0.06, 12, 24, Math.PI]} />
          <meshStandardMaterial color="#0e0e12" roughness={0.7} />
        </mesh>
      ))}

      {/* G'ildiraklar */}
      {wheelPositions.map((p, i) => (
        <group key={"wheel" + i} position={p}>
          <Wheel
            radius={s.wheelR}
            width={s.width * 0.14}
            color={wheelColor}
            spokes={wheelSpokes}
          />
        </group>
      ))}

      {/* Old faralar */}
      {[1, -1].map((side) => (
        <mesh
          key={"hl" + side}
          position={[
            hL + BEVEL + 0.01,
            s.ground + s.bodyH * 0.62,
            side * (s.width / 2 - 0.26),
          ]}
        >
          <boxGeometry args={[0.05, 0.16, 0.34]} />
          <meshStandardMaterial
            color="#eef6ff"
            emissive="#bfe0ff"
            emissiveIntensity={1.3}
          />
        </mesh>
      ))}
      {/* Radiator panjarasi */}
      <mesh position={[hL + BEVEL, s.ground + s.bodyH * 0.42, 0]}>
        <boxGeometry args={[0.04, 0.2, s.width * 0.55]} />
        <meshStandardMaterial color="#0c0c10" metalness={0.6} roughness={0.5} />
      </mesh>

      {/* Orqa chiroqlar */}
      {[1, -1].map((side) => (
        <mesh
          key={"tl" + side}
          position={[
            -hL - BEVEL - 0.01,
            s.ground + s.bodyH * 0.66,
            side * (s.width / 2 - 0.24),
          ]}
        >
          <boxGeometry args={[0.04, 0.18, 0.4]} />
          <meshStandardMaterial
            color="#ff2d2d"
            emissive="#ff2d2d"
            emissiveIntensity={1.5}
          />
        </mesh>
      ))}

      {/* Yon ko'zgular */}
      {shape !== "pickup" &&
        [1, -1].map((side) => (
          <mesh
            key={"mir" + side}
            position={[
              hL - s.hoodLen + (s.roofX || 0) + 0.1,
              s.ground + s.bodyH + 0.04,
              side * (sideOuter + 0.06),
            ]}
          >
            <boxGeometry args={[0.16, 0.1, 0.06]} />
            <meshStandardMaterial
              color={bodyColor}
              metalness={0.5}
              roughness={0.4}
            />
          </mesh>
        ))}

      {/* Yon bezak chizig'i */}
      {[1, -1].map((side) => (
        <mesh
          key={"line" + side}
          position={[
            s.roofX || 0,
            s.ground + s.bodyH * 0.5,
            side * (sideOuter + 0.005),
          ]}
        >
          <boxGeometry args={[s.length * 0.7, 0.022, 0.02]} />
          <meshStandardMaterial color="#000000" roughness={0.6} />
        </mesh>
      ))}

      {/* --- Tuning qo'shimchalari --- */}
      {addons.bodykit &&
        [1, -1].map((side) => (
          <mesh
            key={"skirt" + side}
            position={[
              s.roofX || 0,
              s.ground + 0.05,
              side * (sideOuter - 0.01),
            ]}
            castShadow
          >
            <boxGeometry args={[s.length * 0.62, 0.1, 0.08]} />
            <meshStandardMaterial
              color="#0a0a0d"
              roughness={0.5}
              metalness={0.4}
            />
          </mesh>
        ))}

      {addons.spoiler && shape !== "van" && (
        <group
          position={[
            -hL + 0.15,
            s.ground + s.bodyH + (shape === "suv" ? s.roofH : 0.1),
            0,
          ]}
        >
          {[1, -1].map((side) => (
            <mesh
              key={"sp" + side}
              position={[0, 0.12, side * (s.width / 2 - 0.25)]}
              castShadow
            >
              <boxGeometry args={[0.1, 0.24, 0.08]} />
              <meshStandardMaterial
                color="#0a0a0d"
                metalness={0.6}
                roughness={0.4}
              />
            </mesh>
          ))}
          <mesh position={[-0.02, 0.26, 0]} castShadow>
            <boxGeometry args={[0.34, 0.05, s.width * 0.82]} />
            <meshStandardMaterial
              color="#0a0a0d"
              metalness={0.6}
              roughness={0.4}
            />
          </mesh>
        </group>
      )}

      {addons.exhaust &&
        [0.32, -0.32].map((z, i) => (
          <mesh
            key={"exh" + i}
            position={[-hL - BEVEL - 0.02, s.ground + 0.16, z]}
            rotation={[0, 0, Math.PI / 2]}
          >
            <cylinderGeometry args={[0.07, 0.07, 0.2, 16]} />
            <meshStandardMaterial
              color="#d8d8e0"
              metalness={1}
              roughness={0.15}
            />
          </mesh>
        ))}
    </group>
  );
}
