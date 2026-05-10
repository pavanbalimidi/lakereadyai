"use client";

import { motion } from "framer-motion";
import { scoreColor } from "@/lib/utils";

export function ScoreRing({
  score,
  size = 160,
  label,
}: {
  score: number;
  size?: number;
  label?: string;
}) {
  const stroke = 12;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const offset = c - (score / 100) * c;

  return (
    <div className="relative grid place-items-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          strokeWidth={stroke}
          className="fill-none stroke-secondary"
        />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          strokeWidth={stroke}
          strokeLinecap="round"
          className={`fill-none ${scoreColor(score).replace("text-", "stroke-")}`}
          initial={{ strokeDasharray: c, strokeDashoffset: c }}
          animate={{ strokeDasharray: c, strokeDashoffset: offset }}
          transition={{ duration: 1, ease: "easeOut" }}
        />
      </svg>
      <div className="absolute inset-0 grid place-items-center">
        <div className="text-center">
          <div className={`text-4xl font-semibold tabular-nums ${scoreColor(score)}`}>
            {score}
          </div>
          {label && (
            <div className="mt-1 text-xs uppercase tracking-wide text-muted-foreground">
              {label}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
