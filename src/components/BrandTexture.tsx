export function BrandTexture({ className = "" }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      className={`pointer-events-none absolute inset-0 h-full w-full ${className}`}
    >
      <defs>
        <pattern id="brand-texture" width="160" height="160" patternUnits="userSpaceOnUse">
          <g fill="none" stroke="white" strokeOpacity="0.06" strokeWidth="1.5">
            {/* basketball */}
            <circle cx="40" cy="40" r="18" />
            <path d="M22 40h36M40 22v36M28 26q12 14 0 28M52 26q-12 14 0 28" />
            {/* crescent moon */}
            <path d="M120 30a14 14 0 1 0 0 28a11 11 0 0 1 0-28z" />
            {/* star */}
            <path d="M100 100l3.5 8.5 9 .5-7 6 2 9-7.5-5-7.5 5 2-9-7-6 9-.5z" />
          </g>
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#brand-texture)" />
    </svg>
  );
}
