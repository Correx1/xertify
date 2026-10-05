'use client';

import React, { useEffect, useState } from 'react';
import QRCode from 'qrcode';

interface QrCodeSvgProps {
  value?: string;
  color?: string;
  className?: string;
  width?: number;
  height?: number;
}

export const QrCodeSvg: React.FC<QrCodeSvgProps> = ({
  value = 'https://xertified.app/verify',
  color = '#000000',
  className = '',
  width = 100,
  height = 100,
}) => {
  const [dataUrl, setDataUrl] = useState<string>('');

  useEffect(() => {
    let isMounted = true;
    const targetUrl = value || 'https://xertified.app/verify';

    QRCode.toDataURL(targetUrl, {
      margin: 1,
      width: 300,
      errorCorrectionLevel: 'L',
      color: {
        dark: color || '#000000',
        light: '#ffffff',
      },
    })
      .then((url) => {
        if (isMounted) {
          setDataUrl(url);
        }
      })
      .catch((err) => {
        console.error('Failed to generate real QR code:', err);
      });

    return () => {
      isMounted = false;
    };
  }, [value, color]);

  if (!dataUrl) {
    return (
      <rect width={width} height={height} fill="#ffffff" rx="6" />
    );
  }

  return (
    <image
      href={dataUrl}
      x="0"
      y="0"
      width={width}
      height={height}
      className={className}
      preserveAspectRatio="xMidYMid meet"
    />
  );
};
