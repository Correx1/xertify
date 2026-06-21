import React from 'react';
import { CertificateTemplate, TextElement, ImageElement, BadgeElement } from '@/lib/types';
import { BadgeSvg } from './BadgeSvg';
import { QrCodeSvg } from './QrCodeSvg';

interface CertificateRendererProps {
  template: CertificateTemplate;
  values?: Record<string, string>;
  scale?: number;
  svgRef?: React.RefObject<SVGSVGElement | null>;
  className?: string;
  watermark?: boolean;
  onElementClick?: (elementId: string) => void;
}

export const CertificateRenderer: React.FC<CertificateRendererProps> = ({
  template,
  values = {},
  scale = 1,
  svgRef,
  className = '',
  watermark = false,
  onElementClick,
}) => {
  // Unique suffix for SVG IDs so multiple renderer instances in the DOM don't collide
  const uid = template.id;



  const isLandscape = template.layout === 'landscape';
  const width = isLandscape ? 1120 : 800;
  const height = isLandscape ? 800 : 1120;

  // Helper to resolve text values with data mapping or fallback to template default
  const getRenderedText = (el: TextElement): string => {
    const text = el.text;
    const key = el.variableKey || el.id;

    // If the text contains placeholders (e.g. {{recipientName}}), substitute them
    if (text.includes('{{')) {
      let resolvedText = text;
      Object.entries(values).forEach(([k, val]) => {
        if (val !== undefined && val !== '') {
          const placeholderRegex = new RegExp(`\\{\\{\\s*${k}\\s*\\}\\}`, 'gi');
          resolvedText = resolvedText.replace(placeholderRegex, val);
        }
      });
      return resolvedText;
    }

    if (el.isVariable) {
      if (values[key] !== undefined && values[key] !== '') {
        return values[key];
      }
      // Try resolving via case-insensitive keys
      const matchingKey = Object.keys(values).find(
        (k) => k.toLowerCase() === key.toLowerCase()
      );
      if (matchingKey && values[matchingKey] !== undefined && values[matchingKey] !== '') {
        return values[matchingKey];
      }
    }

    return text;
  };

  function renderTemplateBackground() {
    const id = template.id;
    if (id === 'classic-academic') {
      // Design 1: Blue Wavy Corners
      return (
        <g>
          <path d="M 0 0 L 0 240 Q 150 200 240 120 Q 300 50 280 0 Z" fill={`url(#dynamicPrimaryGrad-${uid})`} />
          <path d="M 0 0 L 0 200 Q 120 160 200 100 Q 250 40 230 0 Z" fill={`url(#dynamicAccentGrad-${uid})`} opacity="0.85" />
          
          <path d="M 1120 800 L 1120 560 Q 970 600 880 680 Q 820 750 840 800 Z" fill={`url(#dynamicPrimaryGrad-${uid})`} />
          <path d="M 1120 800 L 1120 600 Q 1000 640 920 700 Q 870 760 890 800 Z" fill={`url(#dynamicAccentGrad-${uid})`} opacity="0.85" />
          
          <rect x="40" y="40" width="1040" height="720" fill="none" stroke="#cbd5e1" strokeWidth="2" />
        </g>
      );
    }
    if (id === 'modern-corporate') {
      // Design 2: Red/Gold Waves Partition (Left side)
      return (
        <g>
          <path d="M 400 0 L 0 0 L 0 800 L 480 800 Q 370 600 320 400 Q 270 200 400 0 Z" fill={`url(#dynamicPrimaryGrad-${uid})`} />
          <path d="M 400 0 Q 270 200 320 400 Q 370 600 480 800 L 465 800 Q 355 600 305 400 Q 255 200 385 0 Z" fill={`url(#dynamicAccentGrad-${uid})`} />
          
          <path d="M 270 0 Q 170 200 220 400 Q 270 600 340 800" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="3" />
          <path d="M 220 0 Q 120 200 170 400 Q 220 600 290 800" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="3" />
          <path d="M 170 0 Q 70 200 120 400 Q 170 600 240 800" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="3" />
        </g>
      );
    }
    if (id === 'achievement-award') {
      // Design 3: Gold Intricate/Ornate Border
      return (
        <g>
          <circle cx="560" cy="400" r="380" fill="none" stroke={`url(#dynamicAccentGrad-${uid})`} strokeWidth="2" opacity="0.1" />
          <circle cx="560" cy="400" r="360" fill="none" stroke={`url(#dynamicAccentGrad-${uid})`} strokeWidth="1.5" opacity="0.08" />
          <circle cx="560" cy="400" r="340" fill="none" stroke={`url(#dynamicAccentGrad-${uid})`} strokeWidth="1" opacity="0.06" />
          
          <rect x="25" y="25" width="1070" height="750" fill="none" stroke={`url(#dynamicAccentGrad-${uid})`} strokeWidth="16" strokeDasharray="10 8" />
          <rect x="50" y="50" width="1020" height="700" fill="none" stroke={`url(#dynamicAccentGrad-${uid})`} strokeWidth="3" />
          <rect x="58" y="58" width="1004" height="684" fill="none" stroke={`url(#dynamicAccentGrad-${uid})`} strokeWidth="1.5" />
          
          <path d="M 45 45 L 85 45 L 85 55 L 55 55 L 55 85 L 45 85 Z" fill={`url(#dynamicAccentGrad-${uid})`} />
          <path d="M 1075 45 L 1035 45 L 1035 55 L 1065 55 L 1065 85 L 1075 85 Z" fill={`url(#dynamicAccentGrad-${uid})`} />
          <path d="M 45 755 L 85 755 L 85 745 L 55 745 L 55 715 L 45 715 Z" fill={`url(#dynamicAccentGrad-${uid})`} />
          <path d="M 1075 755 L 1035 755 L 1035 745 L 1065 745 L 1065 715 L 1075 715 Z" fill={`url(#dynamicAccentGrad-${uid})`} />
        </g>
      );
    }
    if (id === 'participation-badge') {
      // Design 4: Sleek Gold/Black Corners
      return (
        <g>
          <polygon points="0,0 200,0 0,160" fill={`url(#dynamicDarkGrad-${uid})`} />
          <polygon points="0,0 240,0 0,190" fill={`url(#dynamicAccentGrad-${uid})`} opacity="0.45" />
          <polygon points="0,0 160,0 0,130" fill={`url(#dynamicAccentGrad-${uid})`} />
          
          <polygon points="1120,800 920,800 1120,640" fill={`url(#dynamicDarkGrad-${uid})`} />
          <polygon points="1120,800 880,800 1120,610" fill={`url(#dynamicAccentGrad-${uid})`} opacity="0.45" />
          <polygon points="1120,800 960,800 1120,670" fill={`url(#dynamicAccentGrad-${uid})`} />
          
          <path d="M 1040 20 L 1100 20 L 1100 80" fill="none" stroke={`url(#dynamicAccentGrad-${uid})`} strokeWidth="3" />
          <path d="M 1050 30 L 1090 30 L 1090 70" fill="none" stroke={`url(#dynamicAccentGrad-${uid})`} strokeWidth="1" />
          
          <path d="M 80 780 L 20 780 L 20 720" fill="none" stroke={`url(#dynamicAccentGrad-${uid})`} strokeWidth="3" />
          <path d="M 70 770 L 30 770 L 30 730" fill="none" stroke={`url(#dynamicAccentGrad-${uid})`} strokeWidth="1" />
          
          <rect x="40" y="40" width="1040" height="720" fill="none" stroke={`url(#dynamicAccentGrad-${uid})`} strokeWidth="2.5" />
        </g>
      );
    }
    if (id === 'excellence-award') {
      // Design 5: Navy/Gold Corners
      return (
        <g>
          <rect x="40" y="40" width="1040" height="720" fill="none" stroke={`url(#dynamicAccentGrad-${uid})`} strokeWidth="3" />
          
          <polygon points="0,0 180,0 120,40 40,120 0,180" fill={`url(#dynamicDarkGrad-${uid})`} />
          <polygon points="0,0 160,0 0,160" fill={`url(#dynamicAccentGrad-${uid})`} />
          <polygon points="0,0 80,0 0,80" fill={`url(#dynamicDarkGrad-${uid})`} />

          <polygon points="1120,0 940,0 1000,40 1080,120 1120,180" fill={`url(#dynamicDarkGrad-${uid})`} />
          <polygon points="1120,0 960,0 1120,160" fill={`url(#dynamicAccentGrad-${uid})`} />
          <polygon points="1120,0 1040,0 1120,80" fill={`url(#dynamicDarkGrad-${uid})`} />

          <polygon points="0,800 180,800 120,760 40,680 0,620" fill={`url(#dynamicDarkGrad-${uid})`} />
          <polygon points="0,800 160,800 0,640" fill={`url(#dynamicAccentGrad-${uid})`} />
          <polygon points="0,800 80,800 0,720" fill={`url(#dynamicDarkGrad-${uid})`} />

          <polygon points="1120,800 940,800 1000,760 1080,680 1120,620" fill={`url(#dynamicDarkGrad-${uid})`} />
          <polygon points="1120,800 960,800 1120,640" fill={`url(#dynamicAccentGrad-${uid})`} />
          <polygon points="1120,800 1040,800 1120,720" fill={`url(#dynamicDarkGrad-${uid})`} />
        </g>
      );
    }
    if (id === 'training-completion') {
      // Design 6: Navy & Gold abstract geometric corners + wavy lines (Image 1)
      return (
        <g>
          {/* Top-Left Corner */}
          <polygon points="0,0 240,0 0,60" fill={`url(#dynamicPrimaryGrad-${uid})`} />
          <polygon points="0,0 260,0 0,70" fill={`url(#dynamicAccentGrad-${uid})`} opacity="0.3" />
          <polygon points="0,0 120,0 0,120" fill={`url(#dynamicPrimaryGrad-${uid})`} />
          <polygon points="0,0 140,0 0,140" fill={`url(#dynamicAccentGrad-${uid})`} opacity="0.4" />
          
          {/* Top-Right Corner */}
          <polygon points="1120,0 880,0 1120,60" fill={`url(#dynamicPrimaryGrad-${uid})`} />
          <polygon points="1120,0 860,0 1120,70" fill={`url(#dynamicAccentGrad-${uid})`} opacity="0.3" />
          <polygon points="1120,0 960,0 1120,160" fill={`url(#dynamicAccentGrad-${uid})`} />
          <polygon points="1120,0 990,0 1120,130" fill={`url(#dynamicPrimaryGrad-${uid})`} />
          
          {/* Bottom-Left Corner */}
          <polygon points="0,800 240,800 0,740" fill={`url(#dynamicPrimaryGrad-${uid})`} />
          <polygon points="0,800 260,800 0,730" fill={`url(#dynamicAccentGrad-${uid})`} opacity="0.3" />
          <polygon points="0,800 160,800 0,640" fill={`url(#dynamicAccentGrad-${uid})`} />
          <polygon points="0,800 130,800 0,670" fill={`url(#dynamicPrimaryGrad-${uid})`} />
          
          {/* Bottom-Right Corner */}
          <polygon points="1120,800 880,800 1120,740" fill={`url(#dynamicPrimaryGrad-${uid})`} />
          <polygon points="1120,800 860,800 1120,730" fill={`url(#dynamicAccentGrad-${uid})`} opacity="0.3" />
          <polygon points="1120,800 1000,800 1120,680" fill={`url(#dynamicPrimaryGrad-${uid})`} />
          <polygon points="1120,800 1020,800 1120,700" fill={`url(#dynamicAccentGrad-${uid})`} opacity="0.4" />
          
          {/* Wavy/guilloche lines on the sides */}
          <path d="M 10 200 Q 80 250 10 300 T 10 400 T 10 500" fill="none" stroke="#e2e8f0" strokeWidth="2" />
          <path d="M 20 190 Q 90 240 20 290 T 20 390 T 20 490" fill="none" stroke="#e2e8f0" strokeWidth="1" />
          <path d="M 30 180 Q 100 230 30 280 T 30 380 T 30 480" fill="none" stroke="#cbd5e1" opacity="0.5" strokeWidth="1" />
          
          <path d="M 1110 300 Q 1040 350 1110 400 T 1110 500 T 1110 600" fill="none" stroke="#e2e8f0" strokeWidth="2" />
          <path d="M 1100 310 Q 1030 360 1100 410 T 1100 510 T 1100 610" fill="none" stroke="#e2e8f0" strokeWidth="1" />
          <path d="M 1090 320 Q 1020 370 1090 420 T 1090 520 T 1090 620" fill="none" stroke="#cbd5e1" opacity="0.5" strokeWidth="1" />
          
          {/* Inner frame */}
          <rect x="40" y="40" width="1040" height="720" fill="none" stroke="#cbd5e1" strokeWidth="1" />
        </g>
      );
    }
    if (id === 'leadership-award') {
      // Design 7: Left vertical ribbon and double gold border (Image 2)
      return (
        <g>
          {/* Outer gray border */}
          <rect x="15" y="15" width="1090" height="770" fill="none" stroke="#e2e8f0" strokeWidth="2" />
          
          {/* Double gold border */}
          <rect x="45" y="45" width="1030" height="710" fill="none" stroke={`url(#dynamicAccentGrad-${uid})`} strokeWidth="4" />
          <rect x="55" y="55" width="1010" height="690" fill="none" stroke={`url(#dynamicAccentGrad-${uid})`} strokeWidth="1.5" />
          
          {/* Left vertical gold stripe */}
          <rect x="120" y="45" width="160" height="710" fill={`url(#dynamicAccentGrad-${uid})`} opacity="0.15" />
          {/* Solid gold stripe borders */}
          <line x1="120" y1="45" x2="120" y2="755" stroke={`url(#dynamicAccentGrad-${uid})`} strokeWidth="2" />
          <line x1="280" y1="45" x2="280" y2="755" stroke={`url(#dynamicAccentGrad-${uid})`} strokeWidth="2" />
          
          {/* Vertical gold stripe solid inside under the ribbon */}
          <rect x="190" y="45" width="20" height="710" fill={`url(#dynamicAccentGrad-${uid})`} />
          
          {/* Hanging Navy/Primary Ribbon */}
          <path d="M 135 45 L 265 45 L 265 300 Q 265 360 200 360 Q 135 360 135 300 Z" fill={`url(#dynamicPrimaryGrad-${uid})`} />
          {/* Ribbon outline */}
          <path d="M 135 45 L 265 45 L 265 300 Q 265 360 200 360 Q 135 360 135 300 Z" fill="none" stroke={`url(#dynamicAccentGrad-${uid})`} strokeWidth="3" />
        </g>
      );
    }
    if (id === 'appreciation-cert') {
      // Design 8: Ornate gold border, navy background frame, concentric wave pattern, bottom ribbon (Image 3)
      return (
        <g>
          {/* Navy outer border */}
          <rect x="0" y="0" width="1120" height="800" fill="none" stroke={`url(#dynamicPrimaryGrad-${uid})`} strokeWidth="40" />
          
          {/* Thin gold ornate inner border */}
          <rect x="50" y="50" width="1020" height="700" fill="none" stroke={`url(#dynamicAccentGrad-${uid})`} strokeWidth="2" />
          <rect x="56" y="56" width="1008" height="688" fill="none" stroke={`url(#dynamicAccentGrad-${uid})`} strokeWidth="1" />
          
          {/* Ornate Corner Shapes */}
          <path d="M 40 70 L 70 70 L 70 40" fill="none" stroke={`url(#dynamicAccentGrad-${uid})`} strokeWidth="3" />
          <path d="M 1080 70 L 1050 70 L 1050 40" fill="none" stroke={`url(#dynamicAccentGrad-${uid})`} strokeWidth="3" />
          <path d="M 40 730 L 70 730 L 70 760" fill="none" stroke={`url(#dynamicAccentGrad-${uid})`} strokeWidth="3" />
          <path d="M 1080 730 L 1050 730 L 1050 760" fill="none" stroke={`url(#dynamicAccentGrad-${uid})`} strokeWidth="3" />
          
          {/* Concentric Guilloche Wave Background Pattern */}
          <circle cx="560" cy="400" r="380" fill="none" stroke="#e2e8f0" strokeWidth="1" opacity="0.4" />
          <circle cx="560" cy="400" r="360" fill="none" stroke="#e2e8f0" strokeWidth="1.2" opacity="0.4" />
          <circle cx="560" cy="400" r="340" fill="none" stroke="#e2e8f0" strokeWidth="1" opacity="0.3" />
          <circle cx="560" cy="400" r="320" fill="none" stroke="#e2e8f0" strokeWidth="1" opacity="0.3" />
          <circle cx="560" cy="400" r="300" fill="none" stroke="#e2e8f0" strokeWidth="1.5" opacity="0.2" />
          <circle cx="560" cy="400" r="280" fill="none" stroke="#e2e8f0" strokeWidth="1" opacity="0.2" />
          <circle cx="560" cy="400" r="260" fill="none" stroke="#e2e8f0" strokeWidth="1" opacity="0.2" />
          <circle cx="560" cy="400" r="240" fill="none" stroke="#e2e8f0" strokeWidth="1" opacity="0.2" />
          <circle cx="560" cy="400" r="220" fill="none" stroke="#e2e8f0" strokeWidth="1" opacity="0.1" />
          <circle cx="560" cy="400" r="200" fill="none" stroke="#e2e8f0" strokeWidth="1" opacity="0.1" />
          
          {/* Bottom Center horizontal blue ribbon behind the seal */}
          {/* Left Ribbon tail */}
          <path d="M 360 670 L 250 670 L 290 715 L 250 760 L 360 760 Z" fill={`url(#dynamicPrimaryGrad-${uid})`} />
          <path d="M 360 670 L 250 670 L 290 715 L 250 760 L 360 760 Z" fill="none" stroke={`url(#dynamicAccentGrad-${uid})`} strokeWidth="1.5" />
          
          {/* Right Ribbon tail */}
          <path d="M 760 670 L 870 670 L 830 715 L 870 760 L 760 760 Z" fill={`url(#dynamicPrimaryGrad-${uid})`} />
          <path d="M 760 670 L 870 670 L 830 715 L 870 760 L 760 760 Z" fill="none" stroke={`url(#dynamicAccentGrad-${uid})`} strokeWidth="1.5" />
          
          {/* Center Ribbon rectangle */}
          <rect x="340" y="685" width="440" height="60" fill={`url(#dynamicPrimaryGrad-${uid})`} />
          <rect x="340" y="685" width="440" height="60" fill="none" stroke={`url(#dynamicAccentGrad-${uid})`} strokeWidth="2" />
        </g>
      );
    }
    if (id === 'professional-dev') {
      // Design 9: Curved modern overlapping corners (Image 4)
      return (
        <g>
          {/* Top-Left Curves */}
          <path d="M 0 0 L 400 0 Q 300 120 180 200 Q 80 280 0 360 Z" fill={`url(#dynamicPrimaryGrad-${uid})`} />
          <path d="M 0 0 L 415 0 Q 315 130 195 210 Q 95 290 0 375 Z" fill={`url(#dynamicAccentGrad-${uid})`} opacity="0.6" />
          <path d="M 0 0 L 260 0 Q 200 80 120 130 Q 50 180 0 240 Z" fill={`url(#dynamicPrimaryGrad-${uid})`} />
          
          {/* Bottom-Right Curves */}
          <path d="M 1120 800 L 720 800 Q 820 680 940 600 Q 1040 520 1120 440 Z" fill={`url(#dynamicPrimaryGrad-${uid})`} />
          <path d="M 1120 800 L 705 800 Q 805 670 925 590 Q 1025 510 1120 425 Z" fill={`url(#dynamicAccentGrad-${uid})`} opacity="0.6" />
          <path d="M 1120 800 L 860 800 Q 920 720 1000 670 Q 1070 620 1120 560 Z" fill={`url(#dynamicPrimaryGrad-${uid})`} />
          
          {/* Bottom-Left small gold curve */}
          <path d="M 0 800 L 0 720 Q 40 740 80 800 Z" fill={`url(#dynamicAccentGrad-${uid})`} />
          
          {/* Subtle thin gold borders on the white section */}
          <path d="M 440 80 L 1040 80 Q 1060 80 1060 100 L 1060 380" fill="none" stroke={`url(#dynamicAccentGrad-${uid})`} strokeWidth="1" opacity="0.25" />
          <path d="M 80 720 L 80 420 Q 80 400 100 400 L 680 400" fill="none" stroke={`url(#dynamicAccentGrad-${uid})`} strokeWidth="1" opacity="0.25" />
        </g>
      );
    }
    if (id === 'minimal-blank') {
      // Design 10: Elegant dark borders, dotted corners with gold curves, wavy inner lines (Image 5)
      return (
        <g>
          {/* Dark outer frame */}
          <rect x="0" y="0" width="1120" height="800" fill="none" stroke={`url(#dynamicDarkGrad-${uid})`} strokeWidth="40" />
          
          {/* Corner dark decorative panels with dot grid */}
          {/* Top-Left */}
          <path d="M 0 0 L 280 0 Q 220 80 140 140 Q 80 220 0 280 Z" fill="#111827" />
          <path d="M 0 0 L 280 0 Q 220 80 140 140 Q 80 220 0 280 Z" fill={`url(#cornerDots-${uid})`} />
          <path d="M 280 0 Q 220 80 140 140 Q 80 220 0 280" fill="none" stroke={`url(#dynamicAccentGrad-${uid})`} strokeWidth="4" />
          
          {/* Bottom-Left */}
          <path d="M 0 800 L 280 800 Q 220 720 140 660 Q 80 580 0 520 Z" fill="#111827" />
          <path d="M 0 800 L 280 800 Q 220 720 140 660 Q 80 580 0 520 Z" fill={`url(#cornerDots-${uid})`} />
          <path d="M 280 800 Q 220 720 140 660 Q 80 580 0 520" fill="none" stroke={`url(#dynamicAccentGrad-${uid})`} strokeWidth="4" />
          
          {/* Top-Right */}
          <path d="M 1120 0 L 840 0 Q 900 80 980 140 Q 1040 220 1120 280 Z" fill="#111827" />
          <path d="M 1120 0 L 840 0 Q 900 80 980 140 Q 1040 220 1120 280 Z" fill={`url(#cornerDots-${uid})`} />
          <path d="M 840 0 Q 900 80 980 140 Q 1040 220 1120 280" fill="none" stroke={`url(#dynamicAccentGrad-${uid})`} strokeWidth="4" />
          
          {/* Bottom-Right */}
          <path d="M 1120 800 L 840 800 Q 900 720 980 660 Q 1040 580 1120 520 Z" fill="#111827" />
          <path d="M 1120 800 L 840 800 Q 900 720 980 660 Q 1040 580 1120 520 Z" fill={`url(#cornerDots-${uid})`} />
          <path d="M 840 800 Q 900 720 980 660 Q 1040 580 1120 520" fill="none" stroke={`url(#dynamicAccentGrad-${uid})`} strokeWidth="4" />
          
          {/* Double gold inner border */}
          <rect x="60" y="60" width="1000" height="680" fill="none" stroke={`url(#dynamicAccentGrad-${uid})`} strokeWidth="3" />
          <rect x="68" y="68" width="984" height="664" fill="none" stroke={`url(#dynamicAccentGrad-${uid})`} strokeWidth="1" />
          
          {/* Soft wavy lines in background */}
          <path d="M 80 460 Q 300 500 560 440 T 1040 420" fill="none" stroke="#e2e8f0" strokeWidth="2" />
          <path d="M 80 490 Q 300 530 560 470 T 1040 450" fill="none" stroke="#e2e8f0" strokeWidth="2.5" />
          <path d="M 80 520 Q 300 560 560 500 T 1040 480" fill="none" stroke="#cbd5e1" opacity="0.5" strokeWidth="1.5" />
        </g>
      );
    }
    return null;
  };

  return (
    <div
      className={`relative select-none overflow-hidden transition-all duration-300 ${className}`}
      style={{
        width: `${width * scale}px`,
        height: `${height * scale}px`,
      }}
    >
      <svg
        ref={svgRef}
        width={width}
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        className="bg-white"
        style={{
          transform: `scale(${scale})`,
          transformOrigin: 'top left',
        }}
      >
        <defs key={`defs-${template.id}`}>
          <linearGradient id={`dynamicAccentGrad-${uid}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={template.styles.accentColor || template.accentColor} />
            <stop offset="50%" stopColor="#fef08a" />
            <stop offset="100%" stopColor={template.styles.accentColor || template.accentColor} />
          </linearGradient>
          <linearGradient id={`dynamicPrimaryGrad-${uid}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={template.styles.borderColor || template.primaryColor} />
            <stop offset="100%" stopColor={template.styles.accentColor || template.accentColor || template.primaryColor} />
          </linearGradient>
          <linearGradient id={`dynamicDarkGrad-${uid}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#111827" />
            <stop offset="100%" stopColor={template.styles.borderColor || template.primaryColor} />
          </linearGradient>
          <pattern id={`cornerDots-${uid}`} width="10" height="10" patternUnits="userSpaceOnUse">
            <circle cx="5" cy="5" r="1" fill="#ffffff" opacity="0.3" />
          </pattern>
        </defs>

        {/* Native background color container */}
        <rect width={width} height={height} fill={template.styles.backgroundColor || '#ffffff'} />

        {/* Native outer border */}
        {template.styles.borderWidth > 0 && template.styles.borderStyle !== 'none' && (
          <rect
            x={template.styles.borderWidth / 2}
            y={template.styles.borderWidth / 2}
            width={width - template.styles.borderWidth}
            height={height - template.styles.borderWidth}
            fill="none"
            stroke={template.styles.borderColor}
            strokeWidth={template.styles.borderWidth}
          />
        )}

        <g key={`bg-${template.id}`}>
          {renderTemplateBackground()}
        </g>
        {/* Fancy Border Overlay */}
        {template.styles.borderStyle === 'fancy' && (
          <rect
            x={Math.max(6, template.styles.borderWidth / 2)}
            y={Math.max(6, template.styles.borderWidth / 2)}
            width={width - Math.max(12, template.styles.borderWidth)}
            height={height - Math.max(12, template.styles.borderWidth)}
            fill="none"
            stroke={template.styles.accentColor || template.accentColor}
            strokeWidth="4"
            strokeDasharray="16 8"
          />
        )}

        {/* Elements */}
        {template.elements.map((el) => {
          if (!el.visible) return null;

          // 1. Text Elements
          if (el.type === 'text') {
            const txtEl = el as TextElement;
            const displayedText = getRenderedText(txtEl);
            const lines = displayedText.split('\n');
            const startY = el.y - ((lines.length - 1) * txtEl.style.fontSize * 1.25) / 2;

            return (
              <text
                key={el.id}
                x={el.x}
                y={startY}
                onClick={() => onElementClick && onElementClick(el.id)}
                className={onElementClick ? "hover:opacity-70 transition-opacity duration-150 cursor-pointer select-none" : "select-none"}
                textAnchor={
                  txtEl.style.align === 'left' ? 'start' :
                  txtEl.style.align === 'right' ? 'end' : 'middle'
                }
                fill={txtEl.style.color}
                fontSize={txtEl.style.fontSize}
                fontWeight={txtEl.style.fontWeight}
                fontStyle={txtEl.style.fontStyle}
                fontFamily={txtEl.style.fontFamily}
                letterSpacing={txtEl.style.letterSpacing}
                style={{
                  textTransform: txtEl.style.uppercase ? 'uppercase' : 'none',
                  cursor: onElementClick ? 'pointer' : 'default'
                }}
                alignmentBaseline="middle"
                dominantBaseline="middle"
              >
                {lines.map((line, idx) => (
                  <tspan
                    key={idx}
                    x={el.x}
                    dy={idx === 0 ? 0 : txtEl.style.fontSize * 1.25}
                  >
                    {txtEl.style.uppercase ? line.toUpperCase() : line}
                  </tspan>
                ))}
              </text>

            );
          }

          // 2. Badge Emblem Elements
          if (el.type === 'badge') {
            const badgeEl = el as BadgeElement;
            if (badgeEl.badgeType === 'custom' && badgeEl.src) {
              return (
                <image
                  key={el.id}
                  href={badgeEl.src}
                  x={el.x - el.width / 2}
                  y={el.y - el.height / 2}
                  width={el.width}
                  height={el.height}
                  preserveAspectRatio="xMidYMid meet"
                />
              );
            }
            return (
              <svg
                key={el.id}
                x={el.x - el.width / 2}
                y={el.y - el.height / 2}
                width={el.width}
                height={el.height}
                viewBox="0 0 100 100"
              >
                <BadgeSvg
                  badgeType={badgeEl.badgeType}
                  color={badgeEl.color}
                  width={100}
                  height={100}
                />
              </svg>
            );
          }

          // 3. QR Code Elements
          if (el.type === 'qrcode') {
            return (
              <svg
                key={el.id}
                x={el.x - el.width / 2}
                y={el.y - el.height / 2}
                width={el.width}
                height={el.height}
                viewBox="0 0 100 100"
              >
                <QrCodeSvg
                  width={100}
                  height={100}
                />
              </svg>
            );
          }

          // 4. Image / Signature Elements
          if (el.type === 'image' || el.type === 'signature') {
            const imgEl = el as ImageElement;
            if (!imgEl.src) return null;

            return (
              <g key={el.id}>
                <image
                  href={imgEl.src}
                  x={el.x - el.width / 2}
                  y={el.y - el.height / 2}
                  width={el.width}
                  height={el.height}
                  preserveAspectRatio="xMidYMid meet"
                />
                {el.type === 'signature' && imgEl.label && (
                  <text
                    x={el.x}
                    y={el.y + el.height / 2 + 15}
                    textAnchor="middle"
                    fill="#6b7280"
                    fontSize="11"
                    fontFamily="sans-serif"
                    fontWeight="500"
                  >
                    {imgEl.label}
                  </text>
                )}
              </g>
            );
          }

          return null;
        })}
      </svg>

      {/* Optional Watermark Overlay for previews */}
      {watermark && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none overflow-hidden">
          <div className="text-zinc-500/10 dark:text-white/5 text-4xl sm:text-5xl font-black tracking-widest uppercase transform -rotate-45 font-sans border-4 border-dashed border-zinc-500/10 dark:border-white/5 px-6 py-3 rounded-xl scale-125">
            Xertified Preview
          </div>
        </div>
      )}
    </div>
  );
};
