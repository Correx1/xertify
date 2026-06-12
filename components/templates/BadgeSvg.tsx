import React from 'react';

interface BadgeSvgProps {
  badgeType: 'gold_seal' | 'silver_star' | 'laurel_wreath' | 'shield' | 'custom';
  color: string;
  className?: string;
  width?: number;
  height?: number;
}

export const BadgeSvg: React.FC<BadgeSvgProps> = ({
  badgeType,
  color,
  className = '',
  width = 90,
  height = 90,
}) => {
  const renderBadge = () => {
    switch (badgeType) {
      case 'gold_seal':
        return (
          <g>
            {/* Serrated Seal Edges */}
            <path
              d="M50 5 L55 17 L67 15 L67 28 L79 30 L74 42 L83 50 L74 58 L79 70 L67 72 L67 85 L55 83 L50 95 L45 83 L33 85 L33 72 L21 70 L26 58 L17 50 L26 42 L21 30 L33 28 L33 15 L45 17 Z"
              fill={color}
              stroke="#ffffff"
              strokeWidth="2"
              filter="drop-shadow(0px 3px 5px rgba(0,0,0,0.15))"
            />
            {/* Concentric rings */}
            <circle cx="50" cy="50" r="32" fill="none" stroke="#ffffff" strokeWidth="1.5" strokeDasharray="3 2" />
            <circle cx="50" cy="50" r="28" fill="none" stroke="#ffffff" strokeWidth="1" />
            {/* Internal Ribbon tail representation in SVG */}
            <path d="M 38 65 L 20 92 L 35 90 L 50 78 L 65 90 L 80 92 L 62 65" fill={color} opacity="0.85" />
            <circle cx="50" cy="50" r="20" fill="none" stroke="#ffffff" strokeWidth="2" />
            {/* Text inside the seal */}
            <path id="seal-text-path" d="M 32 50 A 18 18 0 0 1 68 50" fill="none" />
            <text fill="#ffffff" fontSize="5.5" fontWeight="bold" fontFamily="Montserrat" textAnchor="middle">
              <textPath href="#seal-text-path" startOffset="50%">
                OFFICIAL SEAL
              </textPath>
            </text>
            <polygon points="50,42 53,49 60,49 55,53 57,60 50,56 43,60 45,53 40,49 47,49" fill="#ffffff" />
          </g>
        );

      case 'silver_star':
        return (
          <g>
            {/* Soft decagon back */}
            <circle
              cx="50"
              cy="50"
              r="44"
              fill={color}
              stroke="#ffffff"
              strokeWidth="2"
              filter="drop-shadow(0px 4px 6px rgba(0,0,0,0.15))"
            />
            <circle cx="50" cy="50" r="38" fill="none" stroke="#ffffff" strokeWidth="1.5" />
            {/* Ribbon Tails */}
            <path d="M 30 75 L 15 95 L 30 92 L 40 80 L 50 92 L 65 95 L 50 75" fill={color} opacity="0.9" />
            {/* Laurel details in silver */}
            <path
              d="M 24 50 C 24 35 34 25 50 25 C 66 25 76 35 76 50 C 76 65 66 75 50 75 C 34 75 24 65 24 50"
              fill="none"
              stroke="#ffffff"
              strokeWidth="1"
              strokeDasharray="2 4"
            />
            {/* Central Star */}
            <polygon
              points="50,26 57,40 72,40 60,49 65,64 50,55 35,64 40,49 28,40 43,40"
              fill="#ffffff"
              filter="drop-shadow(0px 1px 2px rgba(0,0,0,0.1))"
            />
          </g>
        );

      case 'laurel_wreath':
        return (
          <g>
            {/* Ribbon support */}
            <path d="M 40 70 L 30 95 L 50 88 L 70 95 L 60 70 Z" fill={color} opacity="0.8" />
            {/* Core outer shield/circle */}
            <circle
              cx="50"
              cy="50"
              r="34"
              fill={color}
              stroke="#ffffff"
              strokeWidth="2.5"
              filter="drop-shadow(0px 3px 5px rgba(0,0,0,0.2))"
            />
            <circle cx="50" cy="50" r="29" fill="none" stroke="#ffffff" strokeWidth="1" />
            {/* Laurel branches surrounding the circle */}
            <path
              d="M 20 60 Q 12 50 16 34 Q 20 22 34 16 M 80 60 Q 88 50 84 34 Q 80 22 66 16"
              fill="none"
              stroke={color}
              strokeWidth="3.5"
              strokeLinecap="round"
            />
            {/* Laurel Leaves (SVG Circles/Polygons) */}
            <path
              d="M 17 46 Q 10 42 16 38 M 21 34 Q 15 28 22 26 M 31 22 Q 28 14 36 16 M 83 46 Q 90 42 84 38 M 79 34 Q 85 28 78 26 M 69 22 Q 72 14 64 16"
              fill="none"
              stroke="#ffffff"
              strokeWidth="2.5"
              strokeLinecap="round"
            />
            {/* Center Trophy or Cup Icon */}
            <path
              d="M 40 37 H 60 V 44 C 60 50 55 55 50 55 C 45 55 40 50 40 44 Z"
              fill="#ffffff"
            />
            <path d="M 46 55 H 54 V 58 H 46 Z M 42 58 H 58 V 61 H 42 Z" fill="#ffffff" />
            <path d="M 37 39 C 35 39 35 45 40 45 M 63 39 C 65 39 65 45 60 45" fill="none" stroke="#ffffff" strokeWidth="2.5" />
          </g>
        );

      case 'shield':
        return (
          <g>
            {/* Shield outline */}
            <path
              d="M 50 15 C 65 15 75 12 78 22 C 78 45 74 65 50 80 C 26 65 22 45 22 22 C 25 12 35 15 50 15 Z"
              fill={color}
              stroke="#ffffff"
              strokeWidth="3"
              filter="drop-shadow(0px 4px 6px rgba(0,0,0,0.2))"
            />
            {/* Inside boundary */}
            <path
              d="M 50 21 C 61 21 69 19 71 27 C 71 45 68 60 50 72 C 32 60 29 45 29 27 C 31 19 39 21 50 21 Z"
              fill="none"
              stroke="#ffffff"
              strokeWidth="1.5"
              opacity="0.8"
            />
            {/* Horizontal Banner ribbon */}
            <path
              d="M 15 48 H 85 V 58 H 15 Z"
              fill="#ffffff"
              filter="drop-shadow(0px 2px 3px rgba(0,0,0,0.15))"
            />
            <text
              x="50"
              y="55"
              fill={color}
              fontSize="6.5"
              fontWeight="900"
              fontFamily="Montserrat"
              textAnchor="middle"
            >
              APPROVED
            </text>
            {/* 3 Stars in top section */}
            <polygon points="50,27 52,31 56,31 53,33 54,37 50,35 46,37 47,33 44,31 48,31" fill="#ffffff" />
            <polygon points="40,29 42,33 46,33 43,35 44,39 40,37 36,39 37,35 34,33 38,33" fill="#ffffff" />
            <polygon points="60,29 62,33 66,33 63,35 64,39 60,37 56,39 57,35 54,33 58,33" fill="#ffffff" />
          </g>
        );

      default:
        return null;
    }
  };

  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 100 100"
      className={className}
      style={{ overflow: 'visible' }}
    >
      {renderBadge()}
    </svg>
  );
};
