"use client";

import dynamic from "next/dynamic";

// Three.js touches `window` at module load; defer it client-side only.
const Hero3D = dynamic(() => import("@/components/hero-3d").then((m) => m.Hero3D), {
  ssr: false,
  loading: () => null,
});

export function Hero3DMount() {
  return <Hero3D />;
}
