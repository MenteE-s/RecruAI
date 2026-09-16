import React from "react";

/**
 * MenteE loader — small logo, kept fully visible, with a square
 * outline continuously drawing itself around it.
 *
 * Props:
 *  - size: overall mark width in px (default 56)
 *  - text: caption below (default "Loading…", pass null/"" to hide)
 *  - inline: compact mark for buttons (no caption)
 */
export default function MenteeLoader({ size = 56, text = "Loading…", inline = false, className = "" }) {
  const mark = (box) => (
    <svg width={box} height={box} viewBox="0 0 64 64" fill="none" aria-hidden="true">
      <style>{`
        @keyframes ml-square-draw { to { stroke-dashoffset: -100; } }
        .ml-square-draw { animation: ml-square-draw 1.2s linear infinite; }
      `}</style>
      <image href="/mentee-logo.png" x="20" y="22" width="24" height="21" preserveAspectRatio="xMidYMid meet" />
      <rect
        x="7"
        y="7"
        width="50"
        height="50"
        rx="10"
        stroke="#000000"
        strokeWidth="1.5"
        pathLength="100"
        strokeDasharray="24 76"
        strokeLinecap="round"
        className="ml-square-draw"
      />
    </svg>
  );

  if (inline) {
    return (
      <span className={`inline-flex items-center justify-center ${className}`} role="status" aria-label="Loading">
        {mark(size)}
      </span>
    );
  }

  return (
    <span className={`flex flex-col items-center justify-center gap-1.5 ${className}`} role="status" aria-label={text || "Loading"}>
      {mark(size)}
      {text ? <p className="text-[11px] text-gray-400 font-medium">{text}</p> : null}
    </span>
  );
}
