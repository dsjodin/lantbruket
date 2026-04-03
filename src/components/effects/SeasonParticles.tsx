"use client";

import { useMemo } from "react";
import { Quarter } from "@/types/enums";

interface SeasonParticlesProps {
  quarter: Quarter;
}

interface Particle {
  id: number;
  left: string;
  delay: string;
  duration: string;
  size: string;
  color: string;
  animation: string;
}

function generateParticles(quarter: Quarter): Particle[] {
  const count = 12;
  const particles: Particle[] = [];

  for (let i = 0; i < count; i++) {
    const left = `${(i / count) * 100 + Math.random() * 8}%`;
    const delay = `${Math.random() * 8}s`;
    const duration = `${8 + Math.random() * 6}s`;

    let color: string;
    let animation: string;
    let size: string;

    switch (quarter) {
      case Quarter.Var:
        color = i % 2 === 0 ? "bg-green-400" : "bg-yellow-300";
        animation = "floatUp";
        size = `${3 + Math.random() * 3}px`;
        break;
      case Quarter.Sommar:
        color = i % 2 === 0 ? "bg-amber-300" : "bg-yellow-200";
        animation = "floatUp";
        size = `${2 + Math.random() * 2}px`;
        break;
      case Quarter.Host:
        color = i % 3 === 0 ? "bg-orange-400" : i % 3 === 1 ? "bg-amber-500" : "bg-red-400";
        animation = "floatDown";
        size = `${4 + Math.random() * 4}px`;
        break;
      case Quarter.Vinter:
        color = "bg-white";
        animation = "snowfall";
        size = `${2 + Math.random() * 3}px`;
        break;
    }

    particles.push({ id: i, left, delay, duration, size, color, animation });
  }

  return particles;
}

export default function SeasonParticles({ quarter }: SeasonParticlesProps) {
  const particles = useMemo(() => generateParticles(quarter), [quarter]);

  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
      {particles.map((p) => (
        <div
          key={p.id}
          className={`absolute rounded-full ${p.color}`}
          style={{
            left: p.left,
            width: p.size,
            height: p.size,
            animation: `${p.animation} ${p.duration} ${p.delay} infinite`,
            opacity: 0,
          }}
        />
      ))}
    </div>
  );
}
