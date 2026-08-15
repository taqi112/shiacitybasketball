// An original ornate "captain" badge -- gold sunburst, laurel wreath, and
// ribbon banners reading SHIA CITY / CAPTAIN. Deliberately not a copy of any
// real department's insignia (no eagle crest, no official banner text) --
// same general decorative badge language, own artwork and center emblem.
const RAY_ANGLES = Array.from({ length: 24 }, (_, i) => (360 / 24) * i);

function wreathLeaves(mirror: boolean) {
  return Array.from({ length: 7 }, (_, i) => {
    const t = i / 6;
    const angle = -100 - t * 95; // sweeps from lower side up toward the top ribbon
    const radius = 58;
    const cx = 100 + radius * Math.cos((angle * Math.PI) / 180) * (mirror ? -1 : 1);
    const cy = 150 + radius * Math.sin((angle * Math.PI) / 180);
    const rot = (mirror ? 180 - angle : angle) + 90;
    return { key: i, cx, cy, rot };
  });
}

export function CaptainBadge({ className = "h-14 w-14" }: { className?: string }) {
  return (
    <svg viewBox="0 0 200 220" className={className} aria-hidden="true">
      <defs>
        <linearGradient id="captainGold" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#fde68a" />
          <stop offset="45%" stopColor="#fbbf24" />
          <stop offset="100%" stopColor="#b45309" />
        </linearGradient>
      </defs>

      <g transform="translate(100 118)">
        {RAY_ANGLES.map((angle) => (
          <polygon
            key={angle}
            points="-3.5,0 3.5,0 0,-90"
            fill="url(#captainGold)"
            transform={`rotate(${angle})`}
          />
        ))}
      </g>

      {[false, true].map((mirror) => (
        <g key={mirror ? "right" : "left"}>
          {wreathLeaves(mirror).map((leaf) => (
            <ellipse
              key={leaf.key}
              cx={leaf.cx}
              cy={leaf.cy}
              rx="11"
              ry="5"
              fill="url(#captainGold)"
              stroke="#78350f"
              strokeWidth="0.5"
              transform={`rotate(${leaf.rot} ${leaf.cx} ${leaf.cy})`}
            />
          ))}
        </g>
      ))}

      <circle cx="100" cy="100" r="38" fill="#0f172a" stroke="url(#captainGold)" strokeWidth="5" />
      <g stroke="url(#captainGold)" strokeWidth="1.75" fill="none">
        <circle cx="100" cy="100" r="23" />
        <path d="M77,100 H123" />
        <path d="M100,77 V123" />
        <path d="M83.5,83.5 Q100,100 83.5,116.5" />
        <path d="M116.5,83.5 Q100,100 116.5,116.5" />
      </g>

      <polygon
        points="32,36 168,36 157,60 43,60"
        fill="#1e293b"
        stroke="url(#captainGold)"
        strokeWidth="1.5"
      />
      <text
        x="100"
        y="53"
        textAnchor="middle"
        fontSize="14"
        fontWeight="700"
        fill="#fde68a"
        letterSpacing="1.5"
        fontFamily="system-ui, sans-serif"
      >
        SHIA CITY
      </text>

      <polygon
        points="28,158 172,158 182,182 18,182"
        fill="#1e293b"
        stroke="url(#captainGold)"
        strokeWidth="1.5"
      />
      <text
        x="100"
        y="176"
        textAnchor="middle"
        fontSize="16"
        fontWeight="800"
        fill="#fde68a"
        letterSpacing="2"
        fontFamily="system-ui, sans-serif"
      >
        CAPTAIN
      </text>
    </svg>
  );
}
