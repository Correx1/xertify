import React from 'react';

interface QrCodeSvgProps {
  color?: string;
  className?: string;
  width?: number;
  height?: number;
}

export const QrCodeSvg: React.FC<QrCodeSvgProps> = ({
  color = '#000000',
  className = '',
  width = 80,
  height = 80,
}) => {
  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 100 100"
      className={className}
      style={{ overflow: 'visible' }}
    >
      <g fill={color}>
        {/* Background white card for contrast */}
        <rect width="100" height="100" fill="#ffffff" rx="6" />
        
        {/* Corner Position Detection Pattern: Top-Left */}
        <rect x="8" y="8" width="24" height="24" />
        <rect x="12" y="12" width="16" height="16" fill="#ffffff" />
        <rect x="15" y="15" width="10" height="10" />

        {/* Corner Position Detection Pattern: Top-Right */}
        <rect x="68" y="8" width="24" height="24" />
        <rect x="72" y="12" width="16" height="16" fill="#ffffff" />
        <rect x="75" y="15" width="10" height="10" />

        {/* Corner Position Detection Pattern: Bottom-Left */}
        <rect x="8" y="68" width="24" height="24" />
        <rect x="12" y="72" width="16" height="16" fill="#ffffff" />
        <rect x="15" y="75" width="10" height="10" />
        
        {/* Smaller alignment pattern: Bottom-Right */}
        <rect x="72" y="72" width="10" height="10" />
        <rect x="75" y="75" width="4" height="4" fill="#ffffff" />
        <rect x="76" y="76" width="2" height="2" />

        {/* Timing patterns (connecting lines) */}
        <rect x="32" y="18" width="36" height="4" strokeDasharray="4 4" fill="none" stroke={color} strokeWidth="4" />
        <rect x="18" y="32" width="4" height="36" strokeDasharray="4 4" fill="none" stroke={color} strokeWidth="4" />

        {/* Mock Data Blocks */}
        <rect x="38" y="8" width="6" height="6" />
        <rect x="48" y="8" width="6" height="6" />
        <rect x="38" y="20" width="6" height="6" />
        <rect x="54" y="14" width="6" height="6" />

        <rect x="8" y="38" width="6" height="6" />
        <rect x="20" y="38" width="6" height="6" />
        <rect x="14" y="48" width="6" height="6" />

        <rect x="38" y="38" width="12" height="6" />
        <rect x="54" y="38" width="6" height="12" />
        <rect x="44" y="48" width="6" height="6" />

        <rect x="38" y="56" width="6" height="12" />
        <rect x="48" y="56" width="12" height="6" />
        <rect x="54" y="66" width="6" height="6" />

        <rect x="72" y="38" width="12" height="6" />
        <rect x="78" y="48" width="6" height="12" />

        <rect x="8" y="54" width="6" height="6" />
        <rect x="20" y="54" width="6" height="6" />
        
        <rect x="38" y="72" width="12" height="8" />
        <rect x="54" y="76" width="10" height="6" />
        <rect x="72" y="58" width="8" height="8" />
      </g>
    </svg>
  );
};
