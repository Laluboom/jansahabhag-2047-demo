/**
 * Caveat: Brand design decisions are preliminary. A trade mark attorney should
 * confirm the legal position, and the name's spelling and script need a
 * native-speaker decision, before any brand file is treated as final.
 */

import React, { useId } from 'react';

export interface ChaupalRingProps {
  size?: number; // rendered px, default 32
  variant?: 'color' | 'monochrome' | 'on-dark';
  className?: string;
  title?: string; // accessible name; when omitted the svg is aria-hidden
  monochromeColor?: string; // single color for the monochrome variant (defaults to navy)
}

const TOTAL_SLOTS = 12;
// Upper right gap angle: -45° (-pi / 4 radians)
const GAP_ANGLE = -Math.PI / 4;
const CENTER = 16;
const RING_RADIUS = 10.5;
const RING_DOT_RADIUS = 1.8;
const ENTERING_DOT_RADIUS = 2.5;

// Navy, saffron, and white brand colors
const NAVY_COLOR = '#06038D';
const SAFFRON_COLOR = '#FF671F';
const WHITE_COLOR = '#FFFFFF';

export const ChaupalRing: React.FC<ChaupalRingProps> = ({
  size = 32,
  variant = 'color',
  className,
  title,
  monochromeColor,
}) => {
  const titleId = useId();

  // Compute 11 ring dots evenly spaced around the circle leaving a gap at the upper right
  const ringDots = [];
  for (let i = 1; i < TOTAL_SLOTS; i++) {
    const angle = GAP_ANGLE + (i * 2 * Math.PI) / TOTAL_SLOTS;
    const x = Number((CENTER + RING_RADIUS * Math.cos(angle)).toFixed(2));
    const y = Number((CENTER + RING_RADIUS * Math.sin(angle)).toFixed(2));
    ringDots.push({ x, y });
  }

  // Entering dot sitting in that upper-right gap
  const enteringDot = {
    x: Number((CENTER + RING_RADIUS * Math.cos(GAP_ANGLE)).toFixed(2)),
    y: Number((CENTER + RING_RADIUS * Math.sin(GAP_ANGLE)).toFixed(2)),
  };

  let ringColor: string;
  let enteringColor: string;

  if (variant === 'on-dark') {
    ringColor = WHITE_COLOR;
    enteringColor = SAFFRON_COLOR;
  } else if (variant === 'monochrome') {
    const mono = monochromeColor || NAVY_COLOR;
    ringColor = mono;
    enteringColor = mono;
  } else {
    // 'color' (default)
    ringColor = NAVY_COLOR;
    enteringColor = SAFFRON_COLOR;
  }

  return (
    <svg
      viewBox="0 0 32 32"
      width={size}
      height={size}
      className={className}
      role={title ? 'img' : undefined}
      aria-hidden={title ? undefined : 'true'}
      aria-label={title || undefined}
      aria-labelledby={title ? titleId : undefined}
      xmlns="http://www.w3.org/2000/svg"
    >
      {title && <title id={titleId}>{title}</title>}
      {ringDots.map((dot, index) => (
        <circle
          key={`ring-dot-${index}`}
          cx={dot.x}
          cy={dot.y}
          r={RING_DOT_RADIUS}
          fill={ringColor}
          data-mark="ring-dot"
        />
      ))}
      <circle
        cx={enteringDot.x}
        cy={enteringDot.y}
        r={ENTERING_DOT_RADIUS}
        fill={enteringColor}
        data-mark="entering-dot"
      />
    </svg>
  );
};

export default ChaupalRing;
