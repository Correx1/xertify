export interface TextStyle {
  fontSize: number;
  fontWeight: 'normal' | 'medium' | 'semibold' | 'bold';
  fontStyle: 'normal' | 'italic';
  fontFamily: string;
  color: string;
  align: 'left' | 'center' | 'right';
  uppercase: boolean;
  letterSpacing: number;
}

export type ElementType = 'text' | 'image' | 'signature' | 'badge' | 'qrcode';

export interface BaseElement {
  id: string;
  type: ElementType;
  x: number; // Pixels relative to 1120px width
  y: number; // Pixels relative to 800px height
  width: number;
  height: number;
  visible: boolean;
}

export interface TextElement extends BaseElement {
  type: 'text';
  text: string;
  style: TextStyle;
  isVariable: boolean; // True if replaced dynamically (e.g. {{recipient_name}})
  variableKey?: string; // e.g. "recipient_name"
}

export interface ImageElement extends BaseElement {
  type: 'image' | 'signature';
  src: string; // Base64 image data or placeholder
  label?: string; // Optional subtitle (e.g. "Authorized Signature")
}

export interface BadgeElement extends BaseElement {
  type: 'badge';
  badgeType: 'gold_seal' | 'silver_star' | 'laurel_wreath' | 'shield' | 'custom';
  color: string;
  src?: string;
}

export interface QrCodeElement extends BaseElement {
  type: 'qrcode';
  value?: string;
  src?: string;
}

export type CanvasElement = TextElement | ImageElement | BadgeElement | QrCodeElement;

export interface CertificateTemplate {
  id: string;
  name: string;
  description: string;
  category: 'Academic' | 'Corporate' | 'Award' | 'General';
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  textColor: string;
  fontFamily: string;
  layout: 'portrait' | 'landscape';
  fields: string[];
  isCustom?: boolean;
  styles: {
    backgroundColor: string;
    backgroundType: 'color' | 'gradient' | 'pattern';
    backgroundGradient?: string;
    backgroundPattern?: string; // Name of pattern or SVG pattern ID
    borderColor: string;
    borderWidth: number;
    borderStyle: 'solid' | 'double' | 'fancy' | 'none';
    accentColor: string;
  };
  elements: CanvasElement[];
}

export interface CertData {
  recipientName: string;
  courseName: string;
  date: string;
  issuerName: string;
  issuerTitle: string;
  signatureUrl?: string;
}

export interface CSVRow {
  [key: string]: string;
}
