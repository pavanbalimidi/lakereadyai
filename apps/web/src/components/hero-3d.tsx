"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import {
  Float,
  Icosahedron,
  MeshDistortMaterial,
  Sphere,
  Stars,
} from "@react-three/drei";
import { useRef, Suspense } from "react";
import * as THREE from "three";

function CoreOrb() {
  const ref = useRef<THREE.Mesh>(null!);
  const innerRef = useRef<THREE.Mesh>(null!);

  useFrame((state, delta) => {
    if (ref.current) {
      ref.current.rotation.y += delta * 0.15;
      ref.current.rotation.x += delta * 0.05;
      const m = state.mouse;
      ref.current.rotation.x += (m.y * 0.4 - ref.current.rotation.x) * 0.02;
      ref.current.rotation.y += (m.x * 0.4 - ref.current.rotation.y) * 0.02;
    }
    if (innerRef.current) {
      innerRef.current.rotation.y -= delta * 0.4;
      innerRef.current.rotation.z += delta * 0.2;
    }
  });

  return (
    <group ref={ref}>
      {/* Outer distorted glass sphere */}
      <Sphere args={[1.6, 96, 96]}>
        <MeshDistortMaterial
          color="#5b6bff"
          attach="material"
          distort={0.45}
          speed={1.2}
          roughness={0.05}
          metalness={0.2}
          emissive="#3a48d8"
          emissiveIntensity={0.6}
        />
      </Sphere>

      {/* Inner glowing icosahedron */}
      <Icosahedron ref={innerRef} args={[0.95, 1]}>
        <meshStandardMaterial
          color="#7c3aed"
          emissive="#a855f7"
          emissiveIntensity={1.2}
          wireframe
        />
      </Icosahedron>

      {/* Floating data nodes */}
      {Array.from({ length: 14 }).map((_, i) => {
        const phi = Math.acos(-1 + (2 * i) / 14);
        const theta = Math.sqrt(14 * Math.PI) * phi;
        const r = 2.6;
        const x = r * Math.cos(theta) * Math.sin(phi);
        const y = r * Math.sin(theta) * Math.sin(phi);
        const z = r * Math.cos(phi);
        return (
          <Float key={i} speed={1.5} rotationIntensity={0.6} floatIntensity={1.2}>
            <mesh position={[x, y, z]}>
              <boxGeometry args={[0.12, 0.12, 0.12]} />
              <meshStandardMaterial
                color="#22d3ee"
                emissive="#06b6d4"
                emissiveIntensity={1}
              />
            </mesh>
          </Float>
        );
      })}
    </group>
  );
}

export function Hero3D() {
  return (
    <Canvas
      dpr={[1, 1.8]}
      gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
      camera={{ position: [0, 0, 5.2], fov: 45 }}
      className="!absolute inset-0"
    >
      <color attach="background" args={["#000000"]} />
      <fog attach="fog" args={["#000010", 5, 15]} />
      <ambientLight intensity={0.4} />
      <directionalLight position={[5, 5, 5]} intensity={1.2} color="#a78bfa" />
      <directionalLight position={[-5, -3, -2]} intensity={0.6} color="#22d3ee" />
      <pointLight position={[0, 0, 3]} intensity={1.5} color="#5b6bff" />

      <Suspense fallback={null}>
        <CoreOrb />
        <Stars
          radius={50}
          depth={30}
          count={1500}
          factor={4}
          saturation={0}
          fade
          speed={0.5}
        />
      </Suspense>
    </Canvas>
  );
}
