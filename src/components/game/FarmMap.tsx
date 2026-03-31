"use client";

import type { Field } from "@/types/farm";

interface FarmMapProps {
  fields: Field[];
  compact?: boolean;
}

const STATUS_COLORS: Record<string, { fill: string; stroke: string }> = {
  "Oplöjd":     { fill: "#a08060", stroke: "#8B7355" },
  "Sådd":       { fill: "#c4b078", stroke: "#b09a60" },
  "Växande":    { fill: "#4ade80", stroke: "#22c55e" },
  "Skördeklar": { fill: "#fbbf24", stroke: "#f59e0b" },
  "Skördad":    { fill: "#d6d3d1", stroke: "#a8a29e" },
};

const CROP_ICONS: Record<string, string> = {
  "Höstvete": "🌾",
  "Vårkorn": "🌾",
  "Havre": "🌾",
  "Höstraps": "🌻",
  "Vall": "🌿",
  "Potatis": "🥔",
  "Sockerbeta": "🫘",
  "Vårvete": "🌾",
  "Maltkorn": "🍺",
  "Foderkorn": "🌾",
  "Grynhavre": "🌾",
  "Foderhavre": "🌾",
  "Höstråg": "🌾",
  "Rågvete": "🌾",
};

/**
 * Simple treemap layout: arranges fields as rectangles proportional to their hectares.
 */
function layoutFields(
  fields: Field[],
  width: number,
  height: number
): { field: Field; x: number; y: number; w: number; h: number }[] {
  if (fields.length === 0) return [];

  const totalArea = fields.reduce((s, f) => s + f.hectares, 0);
  const sorted = [...fields].sort((a, b) => b.hectares - a.hectares);

  const rects: { field: Field; x: number; y: number; w: number; h: number }[] = [];
  let x = 0;
  let y = 0;
  let remainingW = width;
  let remainingH = height;
  let remainingArea = totalArea;
  let i = 0;

  while (i < sorted.length) {
    // Determine orientation: split along the longer axis
    const horizontal = remainingW >= remainingH;

    // Take a strip of fields
    let stripArea = 0;
    const strip: Field[] = [];
    const targetStripSize = Math.max(1, Math.ceil((sorted.length - i) / 2));

    for (let j = 0; j < targetStripSize && i + j < sorted.length; j++) {
      strip.push(sorted[i + j]);
      stripArea += sorted[i + j].hectares;
    }

    const ratio = remainingArea > 0 ? stripArea / remainingArea : 1;

    if (horizontal) {
      const stripW = remainingW * ratio;
      let cy = y;
      for (const field of strip) {
        const fieldH = remainingH * (field.hectares / stripArea);
        rects.push({ field, x, y: cy, w: stripW, h: fieldH });
        cy += fieldH;
      }
      x += stripW;
      remainingW -= stripW;
    } else {
      const stripH = remainingH * ratio;
      let cx = x;
      for (const field of strip) {
        const fieldW = remainingW * (field.hectares / stripArea);
        rects.push({ field, x: cx, y, w: fieldW, h: stripH });
        cx += fieldW;
      }
      y += stripH;
      remainingH -= stripH;
    }

    remainingArea -= stripArea;
    i += strip.length;
  }

  return rects;
}

export default function FarmMap({ fields, compact = false }: FarmMapProps) {
  const W = compact ? 300 : 600;
  const H = compact ? 180 : 320;
  const padding = 2;

  const rects = layoutFields(fields, W, H);

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      className="w-full rounded-lg border border-stone-200 bg-stone-100"
      style={{ maxHeight: compact ? 200 : 360 }}
    >
      {rects.map(({ field, x, y, w, h }) => {
        const colors = STATUS_COLORS[field.status] || STATUS_COLORS["Oplöjd"];
        const icon = field.crop ? (CROP_ICONS[field.crop] || "🌱") : "";
        const showText = w > 40 && h > 25;
        const showDetails = !compact && w > 60 && h > 40;

        return (
          <g key={field.id}>
            <rect
              x={x + padding}
              y={y + padding}
              width={Math.max(0, w - padding * 2)}
              height={Math.max(0, h - padding * 2)}
              rx={4}
              fill={colors.fill}
              stroke={colors.stroke}
              strokeWidth={1.5}
              opacity={field.crop ? 0.9 : 0.6}
            />
            {/* Field name */}
            {showText && (
              <text
                x={x + w / 2}
                y={y + (showDetails ? h * 0.35 : h / 2)}
                textAnchor="middle"
                dominantBaseline="middle"
                fontSize={compact ? 8 : Math.min(11, w / 8)}
                fontWeight="bold"
                fill="white"
                style={{ textShadow: "0 1px 2px rgba(0,0,0,0.5)" }}
              >
                {field.name}
              </text>
            )}
            {/* Crop + hectares */}
            {showDetails && (
              <>
                <text
                  x={x + w / 2}
                  y={y + h * 0.55}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fontSize={9}
                  fill="white"
                  style={{ textShadow: "0 1px 2px rgba(0,0,0,0.4)" }}
                >
                  {icon} {field.crop || "Tomt"}
                </text>
                <text
                  x={x + w / 2}
                  y={y + h * 0.75}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fontSize={8}
                  fill="rgba(255,255,255,0.8)"
                >
                  {field.hectares} ha
                </text>
              </>
            )}
          </g>
        );
      })}
    </svg>
  );
}
