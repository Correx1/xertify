'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { PREBUILT_TEMPLATES } from '@/lib/templates';
import { CertificateTemplate, TextElement, ImageElement, BadgeElement, QrCodeElement } from '@/lib/types';
import { CertificateRenderer } from '@/components/templates/CertificateRenderer';
import { svgToPngUrl, downloadFile, exportAsPDF, svgToPdfBlob } from '@/lib/export';
import { parseCSV } from '@/lib/csv';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import { 
  Award, 
  ArrowLeft, 
  Download, 
  FileText, 
  Sparkles, 
  Upload,
  ChevronLeft,
  ChevronRight,
  Eye,
  Settings,
  Grid,
  FileDown,
  Sliders,
  CheckSquare,
  Square,
  X,
  Mail,
  Send,
  AlertCircle,
  CheckCircle,
  RefreshCw,
  Server
} from 'lucide-react';

const SCRIPT_FONTS = ['Great Vibes', 'Alex Brush', 'Pinyon Script', 'Italianno', 'Playball', 'Parisienne', 'Tangerine', 'Sacramento', 'Allura'];
const SERIF_FONTS = ['Cinzel', 'Playfair Display'];
const SANS_FONTS = ['Montserrat', 'Inter', 'Space Mono'];

export default function UnifiedGeneratePage() {
  // 10 Prebuilt templates
  const [activeTemplateIndex, setActiveTemplateIndex] = useState<number>(0);
  const activeTemplate = PREBUILT_TEMPLATES[activeTemplateIndex];

  // Shared Form Values (Preserved across template switches)
  const [formValues, setFormValues] = useState<Record<string, string>>({
    recipientName: 'Sarah Jenkins',
    recipientEmail: 'sarah.jenkins@example.com',
    courseName: 'Advanced Web Applications Development',
    date: 'June 9, 2026',
    issuerName: 'Dr. Michael Chen',
    issuerTitle: 'Director of Education',
    issuerName2: 'Dr. Jane Smith',
    issuerTitle2: 'Dean of Academics',
  });

  // Resend Email Engine Feature States
  const [showEmailModal, setShowEmailModal] = useState<boolean>(false);
  const [resendApiKey, setResendApiKey] = useState<string>('');
  const [resendSenderEmail, setResendSenderEmail] = useState<string>('');
  const [emailSubject, setEmailSubject] = useState<string>('Your Certificate of Completion - {{courseName}}');
  const [emailBody, setEmailBody] = useState<string>(
    'Hello {{recipientName}},\n\n' +
    'Congratulations on completing {{courseName}}!\n\n' +
    'Your official PDF certificate of completion is attached to this email.\n\n' +
    'Issued Date: {{date}}\n' +
    'Issued By: {{issuerName}}\n\n' +
    'Best regards,\n' +
    '{{issuerName}}\n' +
    'Xertified Credentials Platform'
  );
  const [emailIsSending, setEmailIsSending] = useState<boolean>(false);
  const [emailProgress, setEmailProgress] = useState<{
    current: number;
    total: number;
    currentEmail?: string;
    logs: { id: number; recipientName: string; email: string; status: 'sending' | 'sent' | 'failed'; message: string; timestamp: string }[];
  } | null>(null);
  const [emailSuccess, setEmailSuccess] = useState<boolean>(false);
  const [emailValidationError, setEmailValidationError] = useState<string>('');
  const [showModalPreview, setShowModalPreview] = useState<boolean>(false);

  // Custom texts for semantic areas, preserved across template switches
  const [customTexts, setCustomTexts] = useState<Record<string, string>>({
    header: '',
    title: '',
    presents: '',
    description: '',
    dateLabel: '',
  });

  const handleInputChange = (key: string, value: string) => {
    setFormValues(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleCustomTextChange = (key: string, value: string) => {
    setCustomTexts(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const getSemanticRole = (id: string): string | null => {
    const cleanId = id.toLowerCase();
    if (cleanId.includes('header')) return 'header';
    if (cleanId.includes('title') && !cleanId.includes('issuer') && !cleanId.includes('signatory')) return 'title';
    if (cleanId.includes('presents')) return 'presents';
    if (cleanId.includes('desc') || cleanId.includes('paragraph')) return 'description';
    if (cleanId.includes('date_line') || cleanId.includes('date_label') || cleanId.includes('date_tribute')) return 'dateLabel';
    return null;
  };

  const getDefaultSemanticText = (role: string): string => {
    if (!activeTemplate) return '';
    const el = activeTemplate.elements.find(e => e.type === 'text' && getSemanticRole(e.id) === role) as TextElement;
    return el ? el.text : '';
  };

  const getSemanticValue = (role: string): string => {
    if (customTexts[role] !== undefined && customTexts[role] !== '') {
      return customTexts[role];
    }
    return '';
  };

  // Design Overrides
  const [bgColor, setBgColor] = useState<string>('');
  const [borderColor, setBorderColor] = useState<string>('');
  const [accentColor, setAccentColor] = useState<string>('');
  const [borderStyle, setBorderStyle] = useState<'solid' | 'double' | 'fancy' | 'none'>('fancy');
  const [borderWidth, setBorderWidth] = useState<number>(12);

  // Toggles
  const [showBadge, setShowBadge] = useState<boolean>(true);
  const [badgeType, setBadgeType] = useState<'gold_seal' | 'silver_star' | 'laurel_wreath' | 'shield' | 'custom'>('laurel_wreath');
  const [badgeColor, setBadgeColor] = useState<string>('');

  const [showQrCode, setShowQrCode] = useState<boolean>(true);
  const [showLogo, setShowLogo] = useState<boolean>(true);
  const [showSignature, setShowSignature] = useState<boolean>(true);

  // Multi-item configurations
  const [logoCount, setLogoCount] = useState<number>(1);
  const [signatureCount, setSignatureCount] = useState<number>(1);
  const [logoSize, setLogoSize] = useState<number>(110);
  const [showStudio, setShowStudio] = useState<boolean>(false);

  // Custom Uploads
  const [customLogo, setCustomLogo] = useState<string>('');
  const [customLogo2, setCustomLogo2] = useState<string>('');
  const [customSignature, setCustomSignature] = useState<string>('');
  const [customSignature2, setCustomSignature2] = useState<string>('');
  const [customSeal, setCustomSeal] = useState<string>('');
  const autoRemoveBg = true;

  // Generation mode: 'single' | 'bulk'
  const [genMode, setGenMode] = useState<'single' | 'bulk'>('single');

  // Bulk Importer States
  const [csvData, setCsvData] = useState<string[][]>([]);
  const [csvHeaders, setCsvHeaders] = useState<string[]>([]);
  const [fileName, setFileName] = useState<string>('');
  const [mappings, setMappings] = useState<Record<string, number>>({});
  const [activePreviewRow, setActivePreviewRow] = useState<number>(0);

  // Search & Filtering states for templates
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');

  // Drag & drop state for CSV
  const [isDragActive, setIsDragActive] = useState<boolean>(false);

  // Bulk offscreen parallel rendering states
  const [bulkRenderRows, setBulkRenderRows] = useState<Record<string, string>[]>([]);
  const [bulkIsProcessing, setBulkIsProcessing] = useState<boolean>(false);
  const [bulkProgress, setBulkProgress] = useState<{ current: number; total: number } | null>(null);

  // Preview Layout Sizing
  const previewSvgRef = useRef<SVGSVGElement>(null);
  const previewContainerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0.55);

  const [fontOverrides, setFontOverrides] = useState<Record<string, string>>({});
  const [fontSizeOverrides, setFontSizeOverrides] = useState<Record<string, number>>({});
  const [isLoaded, setIsLoaded] = useState<boolean>(false);

  // UI/UX Upgrades States
  const [openFontDropdownId, setOpenFontDropdownId] = useState<string | null>(null);
  const [activeFontTab, setActiveFontTab] = useState<'script' | 'serif' | 'sans'>('script');
  const [zoomMode, setZoomMode] = useState<'auto' | 'manual'>('auto');
  const [bulkSuccess, setBulkSuccess] = useState<boolean>(false);
  const hasRestored = useRef<boolean>(false);

  // Load settings on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem('Xertified_settings');
      if (saved) {
        const data = JSON.parse(saved);
        hasRestored.current = true;
        setTimeout(() => {
          if (data.formValues) setFormValues(data.formValues);
          if (data.customTexts) setCustomTexts(data.customTexts);
          if (data.bgColor !== undefined) setBgColor(data.bgColor);
          if (data.borderColor !== undefined) setBorderColor(data.borderColor);
          if (data.accentColor !== undefined) setAccentColor(data.accentColor);
          if (data.borderStyle !== undefined) setBorderStyle(data.borderStyle);
          if (data.borderWidth !== undefined) setBorderWidth(data.borderWidth);
          if (data.showBadge !== undefined) setShowBadge(data.showBadge);
          if (data.badgeType !== undefined) setBadgeType(data.badgeType);
          if (data.badgeColor !== undefined) setBadgeColor(data.badgeColor);
          if (data.showQrCode !== undefined) setShowQrCode(data.showQrCode);
          if (data.showLogo !== undefined) setShowLogo(data.showLogo);
          if (data.showSignature !== undefined) setShowSignature(data.showSignature);
          if (data.customLogo !== undefined) setCustomLogo(data.customLogo);
          if (data.customLogo2 !== undefined) setCustomLogo2(data.customLogo2);
          if (data.customSignature !== undefined) setCustomSignature(data.customSignature);
          if (data.customSignature2 !== undefined) setCustomSignature2(data.customSignature2);
          if (data.customSeal !== undefined) setCustomSeal(data.customSeal);
          if (data.logoCount !== undefined) setLogoCount(data.logoCount);
          if (data.signatureCount !== undefined) setSignatureCount(data.signatureCount);
          if (data.logoSize !== undefined) setLogoSize(data.logoSize);
          if (data.showStudio !== undefined) setShowStudio(data.showStudio);
          if (data.fontOverrides !== undefined) setFontOverrides(data.fontOverrides);
          if (data.fontSizeOverrides !== undefined) setFontSizeOverrides(data.fontSizeOverrides);
          if (data.activeTemplateIndex !== undefined) setActiveTemplateIndex(data.activeTemplateIndex);
        }, 0);
      }
    } catch (e) {
      console.error('Error loading settings', e);
    } finally {
      setIsLoaded(true);
    }
  }, []);

  // Save settings on changes
  useEffect(() => {
    if (!isLoaded) return;
    try {
      const settings = {
        formValues,
        customTexts,
        bgColor,
        borderColor,
        accentColor,
        borderStyle,
        borderWidth,
        showBadge,
        badgeType,
        badgeColor,
        showQrCode,
        showLogo,
        showSignature,
        customLogo,
        customLogo2,
        customSignature,
        customSignature2,
        customSeal,
        logoCount,
        signatureCount,
        logoSize,
        showStudio,
        fontOverrides,
        fontSizeOverrides,
        activeTemplateIndex,
      };
      localStorage.setItem('Xertified_settings', JSON.stringify(settings));
    } catch (e) {
      console.error('Error saving settings', e);
    }
  }, [
    isLoaded,
    formValues,
    customTexts,
    bgColor,
    borderColor,
    accentColor,
    borderStyle,
    borderWidth,
    showBadge,
    badgeType,
    badgeColor,
    showQrCode,
    showLogo,
    showSignature,
    customLogo,
    customLogo2,
    customSignature,
    customSignature2,
    customSeal,
    logoCount,
    signatureCount,
    logoSize,
    showStudio,
    fontOverrides,
    fontSizeOverrides,
    activeTemplateIndex,
  ]);

  // Handle manual template switching and load layout defaults
  const handleTemplateSwitch = (idx: number) => {
    setActiveTemplateIndex(idx);
    const t = PREBUILT_TEMPLATES[idx];
    if (t) {
      setBgColor(t.styles.backgroundColor);
      setBorderColor(t.styles.borderColor);
      setAccentColor(t.styles.accentColor || t.primaryColor);
      setBorderStyle(t.styles.borderStyle);
      setBorderWidth(t.styles.borderWidth);

      // Find badge type
      const badgeEl = t.elements.find(el => el.type === 'badge') as BadgeElement;
      if (badgeEl) {
        setShowBadge(badgeEl.visible);
        setBadgeType(badgeEl.badgeType);
        setBadgeColor(badgeEl.color);
      }

      // Find qr code
      const qrEl = t.elements.find(el => el.type === 'qrcode');
      if (qrEl) {
        setShowQrCode(qrEl.visible);
      }

      // Find logo image
      const logoEl = t.elements.find(el => el.type === 'image');
      if (logoEl) {
        setShowLogo(logoEl.visible);
      }

      // Find signature
      const sigEl = t.elements.find(el => el.type === 'signature');
      if (sigEl) {
        setShowSignature(sigEl.visible);
      }
    }
  };

  // Scaling listener
  useEffect(() => {
    if (zoomMode !== 'auto') return;
    const handleResize = () => {
      if (previewContainerRef.current) {
        const w = previewContainerRef.current.clientWidth;
        const isLandscape = activeTemplate?.layout === 'landscape';
        const targetWidth = isLandscape ? 1120 : 800;
        setScale(Math.min((w - 32) / targetWidth, 0.72));
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [activeTemplateIndex, activeTemplate, genMode, csvData, zoomMode]);

  // Remove white background algorithm
  const removeWhiteBackground = (base64Str: string): Promise<string> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.naturalWidth || img.width;
        canvas.height = img.naturalHeight || img.height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0);
          try {
            const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const data = imgData.data;
            // Tolerance-based white/near-white removal
            for (let i = 0; i < data.length; i += 4) {
              const r = data[i];
              const g = data[i + 1];
              const b = data[i + 2];
              const brightness = (r + g + b) / 3;
              // Remove pixels that are near-white (high brightness, low saturation)
              const maxChannel = Math.max(r, g, b);
              const minChannel = Math.min(r, g, b);
              const saturation = maxChannel === 0 ? 0 : (maxChannel - minChannel) / maxChannel;
              if (brightness > 200 && saturation < 0.15) {
                // Smooth edge: alpha proportional to how white it is
                const whiteness = (brightness - 200) / 55;
                data[i + 3] = Math.round(data[i + 3] * (1 - whiteness));
              }
            }
            ctx.putImageData(imgData, 0, 0);
            resolve(canvas.toDataURL('image/png'));
          } catch {
            resolve(base64Str);
          }
        } else {
          resolve(base64Str);
        }
      };
      img.onerror = () => resolve(base64Str);
      img.src = base64Str;
    });
  };

  const readFileAsDataURL = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target?.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const base64 = await readFileAsDataURL(file);
      setCustomLogo(base64);
    }
  };

  const handleSignatureUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const rawBase64 = await readFileAsDataURL(file);
      if (autoRemoveBg) {
        const transparentBase64 = await removeWhiteBackground(rawBase64);
        setCustomSignature(transparentBase64);
      } else {
        setCustomSignature(rawBase64);
      }
    }
  };

  const handleSealUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const rawBase64 = await readFileAsDataURL(file);
      const transparentBase64 = await removeWhiteBackground(rawBase64);
      setCustomSeal(transparentBase64);
      setBadgeType('custom');
    }
  };
  // Build values object for active preview row in bulk mode, or direct state in single mode
  const getActiveValues = (): Record<string, string> => {
    if (genMode === 'single') {
      return formValues;
    }
    
    // In bulk mode, resolve values from the mapped columns of the active CSV row
    const resolvedValues: Record<string, string> = { ...formValues };
    if (csvData[activePreviewRow]) {
      Object.entries(mappings).forEach(([key, colIdx]) => {
        if (csvData[activePreviewRow][colIdx] !== undefined) {
          resolvedValues[key] = csvData[activePreviewRow][colIdx];
        }
      });
    }
    return resolvedValues;
  };

  // Modified template using user design customization overrides
  const getCustomizedTemplate = (): CertificateTemplate => {
    if (!activeTemplate) return PREBUILT_TEMPLATES[0];

    const isLandscape = activeTemplate.layout === 'landscape';
    const width = isLandscape ? 1120 : 800;
    const height = isLandscape ? 800 : 1120;

    // Filter and customize elements
    const customizedElements = activeTemplate.elements
      // Remove any existing logo or signature elements to handle them dynamically and consistently
      .filter(el => {
        const idLower = el.id.toLowerCase();
        const isLogo = el.type === 'image' && idLower.includes('logo');
        const isSig = el.type === 'signature';
        
        // If signatureCount is 2, also filter out the default date and signatory text fields
        if (showSignature && signatureCount === 2) {
          const isDateOrSignatory = idLower === 'date' || 
                                    idLower.includes('date_line') || 
                                    idLower.includes('date_label') ||
                                    idLower === 'issuername' || 
                                    idLower === 'issuertitle' ||
                                    idLower.includes('issuer_name') || 
                                    idLower.includes('issuer_title');
          return !isLogo && !isSig && !isDateOrSignatory;
        }
        
        return !isLogo && !isSig;
      })
      .map(el => {
        // 1. Text overrides
        if (el.type === 'text') {
          const txtEl = el as TextElement;
          const role = getSemanticRole(el.id);
          
          let textVal = txtEl.text;
          let isVar = txtEl.isVariable;
          if (role && customTexts[role] !== '') {
            textVal = customTexts[role];
            isVar = false;
          }

          // Apply accent color to titles/headers and variables
          let elementColor = txtEl.style.color;
          if (accentColor) {
            if (role === 'title' || role === 'header' || txtEl.id === 'recipientName' || txtEl.id === 'courseName') {
              elementColor = accentColor;
            }
          }

          // Apply font family and size overrides
          const elementFont = fontOverrides[txtEl.id] || txtEl.style.fontFamily;
          const elementSize = fontSizeOverrides[txtEl.id] || txtEl.style.fontSize;

          // Spacing optimization: Bring header/title/presents down
          let elementY = txtEl.y;
          if (role === 'header') {
            elementY = 195;
          } else if (role === 'title') {
            elementY = 265;
          } else if (role === 'presents') {
            elementY = 335;
          }

          return {
            ...txtEl,
            text: textVal,
            isVariable: isVar,
            y: elementY,
            style: {
              ...txtEl.style,
              color: elementColor,
              fontFamily: elementFont,
              fontSize: elementSize
            }
          } as TextElement;
        }

        // 2. Badge Emblem override
        if (el.type === 'badge') {
          let badgeY = el.y;
          if (showSignature && signatureCount === 2) {
            const originalIssuerEl = activeTemplate.elements.find(e => e.id === 'issuerName') as TextElement;
            const textY1 = originalIssuerEl ? originalIssuerEl.y : (height - 150);
            badgeY = textY1 + 15; // Shift down slightly so it sits between left/right sig lines
          }
          return {
            ...el,
            visible: showBadge,
            badgeType: badgeType,
            color: badgeColor || accentColor,
            y: badgeY,
            src: badgeType === 'custom' ? customSeal : undefined
          } as BadgeElement;
        }

        // 3. QR Code override (if it exists)
        if (el.type === 'qrcode') {
          return {
            ...el,
            visible: showQrCode
          };
        }

        return el;
      });

    // Logo dimensions and positions
    const logoY = 110;
    const logoWidth = logoSize;
    const logoHeight = Math.round(logoSize * (75 / 110));
    const isLeftAligned = activeTemplate.id === 'modern-corporate' || activeTemplate.id === 'leadership-award';
    const logoX = isLeftAligned ? 420 + logoWidth / 2 : width / 2;

    if (showLogo) {
      if (logoCount === 1) {
        customizedElements.push({
          id: 'injected_logo',
          type: 'image',
          x: logoX,
          y: logoY,
          width: logoWidth,
          height: logoHeight,
          visible: true,
          src: customLogo || 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="%234169e1" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="7"/><polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88"/></svg>',
        } as ImageElement);
      } else {
        // logoCount === 2: Place them at the top left and top right of the certificate
        const marginX = isLandscape ? 65 : 50;
        const leftLogoX = marginX + logoWidth / 2;
        const rightLogoX = width - marginX - logoWidth / 2;

        customizedElements.push({
          id: 'injected_logo1',
          type: 'image',
          x: leftLogoX,
          y: logoY,
          width: logoWidth,
          height: logoHeight,
          visible: true,
          src: customLogo || 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="%234169e1" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="7"/><polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88"/></svg>',
        } as ImageElement);
        customizedElements.push({
          id: 'injected_logo2',
          type: 'image',
          x: rightLogoX,
          y: logoY,
          width: logoWidth,
          height: logoHeight,
          visible: true,
          src: customLogo2 || 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="%23eab308" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>',
        } as ImageElement);
      }
    }

    // Signature Placement logic
    if (showSignature) {
      if (signatureCount === 1) {
        // Keep single signature on right signatory line
        const issuerEl = activeTemplate.elements.find(el => el.id === 'issuerName') as TextElement;
        let sigX = width * 0.75;
        let sigY = height * 0.75 - 45;
        if (issuerEl) {
          sigX = issuerEl.x;
          sigY = issuerEl.y - 45;
        }
        customizedElements.push({
          id: 'injected_signature',
          type: 'signature',
          x: sigX,
          y: sigY,
          width: 130,
          height: 50,
          visible: true,
          src: customSignature || 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 100"><path d="M 30,60 Q 60,30 90,65 T 150,45 Q 170,35 190,55" fill="none" stroke="%231e293b" stroke-width="2" stroke-linecap="round"/></svg>',
        } as ImageElement);
      } else {
        // signatureCount === 2: Left signatory, Right signatory, Centered Date
        const leftX = isLandscape ? 280 : 200;
        const rightX = isLandscape ? 840 : 600;
        const centerX = width / 2;
        
        // Find signatory Y coordinate from template issuerName or fallback
        const originalIssuerEl = activeTemplate.elements.find(el => el.id === 'issuerName') as TextElement;
        const textY1 = originalIssuerEl ? originalIssuerEl.y : (height - 150);
        const textY2 = textY1 + 40;
        const sigY = textY1 - 45;

        // Inject Left Signature
        customizedElements.push({
          id: 'injected_signature1',
          type: 'signature',
          x: leftX,
          y: sigY,
          width: 130,
          height: 50,
          visible: true,
          src: customSignature || 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 100"><path d="M 30,60 Q 60,30 90,65 T 150,45 Q 170,35 190,55" fill="none" stroke="%231e293b" stroke-width="2" stroke-linecap="round"/></svg>',
        } as ImageElement);

        customizedElements.push({
          id: 'issuerName',
          type: 'text',
          x: leftX,
          y: textY1,
          width: 250,
          height: 35,
          visible: true,
          text: '{{issuerName}}',
          style: {
            fontSize: 15,
            fontWeight: 'bold',
            fontStyle: 'normal',
            fontFamily: activeTemplate.fontFamily,
            color: accentColor || activeTemplate.textColor,
            align: 'center',
            uppercase: false,
            letterSpacing: 0,
          },
          isVariable: true,
          variableKey: 'issuerName',
        } as TextElement);

        customizedElements.push({
          id: 'issuerTitle',
          type: 'text',
          x: leftX,
          y: textY2,
          width: 250,
          height: 20,
          visible: true,
          text: '{{issuerTitle}}',
          style: {
            fontSize: 10,
            fontWeight: 'bold',
            fontStyle: 'normal',
            fontFamily: 'Inter',
            color: '#6b7280',
            align: 'center',
            uppercase: true,
            letterSpacing: 1,
          },
          isVariable: true,
          variableKey: 'issuerTitle',
        } as TextElement);

        // Inject Right Signature
        customizedElements.push({
          id: 'injected_signature2',
          type: 'signature',
          x: rightX,
          y: sigY,
          width: 130,
          height: 50,
          visible: true,
          src: customSignature2 || 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 100"><path d="M 30,50 Q 70,20 110,75 T 180,35" fill="none" stroke="%231e293b" stroke-width="2" stroke-linecap="round"/></svg>',
        } as ImageElement);

        customizedElements.push({
          id: 'issuerName2',
          type: 'text',
          x: rightX,
          y: textY1,
          width: 250,
          height: 35,
          visible: true,
          text: '{{issuerName2}}',
          style: {
            fontSize: 15,
            fontWeight: 'bold',
            fontStyle: 'normal',
            fontFamily: activeTemplate.fontFamily,
            color: accentColor || activeTemplate.textColor,
            align: 'center',
            uppercase: false,
            letterSpacing: 0,
          },
          isVariable: true,
          variableKey: 'issuerName2',
        } as TextElement);

        customizedElements.push({
          id: 'issuerTitle2',
          type: 'text',
          x: rightX,
          y: textY2,
          width: 250,
          height: 20,
          visible: true,
          text: '{{issuerTitle2}}',
          style: {
            fontSize: 10,
            fontWeight: 'bold',
            fontStyle: 'normal',
            fontFamily: 'Inter',
            color: '#6b7280',
            align: 'center',
            uppercase: true,
            letterSpacing: 1,
          },
          isVariable: true,
          variableKey: 'issuerTitle2',
        } as TextElement);

        // Inject Centered Date
        customizedElements.push({
          id: 'date',
          type: 'text',
          x: centerX,
          y: textY1 - 75, // Avoid overlap with center seal
          width: 250,
          height: 35,
          visible: true,
          text: '{{date}}',
          style: {
            fontSize: 14,
            fontWeight: 'normal',
            fontStyle: 'normal',
            fontFamily: 'Inter',
            color: activeTemplate.textColor,
            align: 'center',
            uppercase: false,
            letterSpacing: 0,
          },
          isVariable: true,
          variableKey: 'date',
        } as TextElement);

        customizedElements.push({
          id: 'date_label',
          type: 'text',
          x: centerX,
          y: textY1 - 50, // Avoid overlap with center seal
          width: 250,
          height: 20,
          visible: true,
          text: 'DATE OF ISSUANCE',
          style: {
            fontSize: 10,
            fontWeight: 'bold',
            fontStyle: 'normal',
            fontFamily: 'Montserrat',
            color: '#6b7280',
            align: 'center',
            uppercase: true,
            letterSpacing: 1,
          },
          isVariable: false,
        } as TextElement);
      }
    }

    // Inject QR Code if enabled and missing
    const qrExists = customizedElements.some(el => el.type === 'qrcode');
    if (showQrCode && !qrExists) {
      let qrX = width * 0.25;
      let qrY = height * 0.75 - 65;
      
      // Place centered left-to-right relative to date if date is centered or left-aligned
      if (signatureCount === 2) {
        // Move QR to the bottom left or bottom right, or bottom center below date
        qrX = isLandscape ? 120 : 90;
        qrY = height - (isLandscape ? 130 : 150);
      } else {
        const dateEl = customizedElements.find(el => el.id === 'date');
        if (dateEl) {
          qrX = dateEl.x;
          qrY = dateEl.y - 65;
        } else {
          qrX = isLandscape ? 180 : 150;
          qrY = height - (isLandscape ? 180 : 200);
        }
      }
      
      customizedElements.push({
        id: 'injected_qrcode',
        type: 'qrcode',
        x: qrX,
        y: qrY,
        width: 65,
        height: 65,
        visible: true,
      } as QrCodeElement);
    }

    return {
      ...activeTemplate,
      styles: {
        ...activeTemplate.styles,
        backgroundColor: bgColor || activeTemplate.styles.backgroundColor,
        borderColor: borderColor || activeTemplate.styles.borderColor,
        borderStyle: borderStyle,
        borderWidth: borderWidth,
        // Always fall back to the template's own accentColor — never pass an empty string
        // which would cause SVG gradient stops to render as black
        accentColor: accentColor || activeTemplate.styles.accentColor || activeTemplate.accentColor,
      },
      elements: customizedElements
    };
  };

  // Helper to determine active fonts dynamically to avoid loading unused stylesheets
  const getDynamicFontsStylesheetUrl = () => {
    const fontSet = new Set<string>();
    
    // Add default font family from customized template elements
    customizedTemplate.elements.forEach(el => {
      if (el.type === 'text') {
        const txtEl = el as TextElement;
        const font = fontOverrides[txtEl.id] || txtEl.style.fontFamily;
        if (font) fontSet.add(font);
      }
    });

    if (fontSet.size === 0) {
      return '';
    }

    const FONT_PARAMS: Record<string, string> = {
      'Montserrat': 'Montserrat:wght@400;600;800',
      'Cinzel': 'Cinzel:wght@500;700',
      'Playfair Display': 'Playfair+Display:ital,wght@0,500;0,700;1,400',
      'Inter': 'Inter:wght@400;600',
      'Space Mono': 'Space+Mono',
      'Great Vibes': 'Great+Vibes',
      'Alex Brush': 'Alex+Brush',
      'Pinyon Script': 'Pinyon+Script',
      'Italianno': 'Italianno',
      'Playball': 'Playball',
      'Parisienne': 'Parisienne',
      'Tangerine': 'Tangerine',
      'Sacramento': 'Sacramento',
      'Allura': 'Allura'
    };

    const families = Array.from(fontSet)
      .map(font => FONT_PARAMS[font] || font.replace(/\s+/g, '+'))
      .filter(Boolean);

    if (families.length === 0) return '';
    return `https://fonts.googleapis.com/css2?family=${families.join('&family=')}&display=swap`;
  };

  const downloadPNG = async () => {
    if (!previewSvgRef.current) return;
    try {
      const activeValues = getActiveValues();
      const name = activeValues['recipientName'] || 'certificate';
      const cleanFileName = `${name.toLowerCase().replace(/[\s_:-]+/g, '_')}_certificate.png`;
      
      const isLandscape = activeTemplate.layout === 'landscape';
      const width = isLandscape ? 2240 : 1600;
      const height = isLandscape ? 1600 : 2240;
      const fontUrl = getDynamicFontsStylesheetUrl();

      const pngUrl = await svgToPngUrl(previewSvgRef.current, width, height, fontUrl);
      downloadFile(pngUrl, cleanFileName);
    } catch (err) {
      alert('PNG compilation failed: ' + (err as Error).message);
    }
  };

  const downloadPDF = async () => {
    if (!previewSvgRef.current) return;
    try {
      const activeValues = getActiveValues();
      const name = activeValues['recipientName'] || 'certificate';
      const cleanFileName = `${name.toLowerCase().replace(/[\s_:-]+/g, '_')}_certificate.pdf`;
      const fontUrl = getDynamicFontsStylesheetUrl();

      await exportAsPDF(previewSvgRef.current, cleanFileName, activeTemplate.layout, fontUrl);
    } catch (err) {
      alert('PDF compilation failed: ' + (err as Error).message);
    }
  };

  // Parallel bulk compiling with JSZip & file-saver in batches of 5
  const generateBulkZip = async (format: 'png' | 'pdf') => {
    if (csvData.length === 0) return;
    setBulkIsProcessing(true);
    setBulkProgress({ current: 0, total: csvData.length });

    const zip = new JSZip();
    const batchSize = 5;
    const fontUrl = getDynamicFontsStylesheetUrl();

    // Map all rows to their corresponding values
    const allRowValues = csvData.map(row => {
      const obj: Record<string, string> = { ...formValues };
      Object.entries(mappings).forEach(([key, colIdx]) => {
        if (row[colIdx] !== undefined) {
          obj[key] = row[colIdx];
        }
      });
      return obj;
    });

    try {
      for (let i = 0; i < allRowValues.length; i += batchSize) {
        const currentBatch = allRowValues.slice(i, i + batchSize);
        
        setBulkRenderRows(currentBatch);
        setBulkProgress({ current: i, total: allRowValues.length });

        // Wait for off-screen rendering pipeline to complete paint/draw operations
        await new Promise(resolve => setTimeout(resolve, 800));

        for (let j = 0; j < currentBatch.length; j++) {
          const containerId = `bulk-cert-container-${j}`;
          const container = document.getElementById(containerId);
          const svgEl = container?.querySelector('svg');
          if (svgEl) {
            const rowVal = currentBatch[j];
            const recipientName = rowVal['recipientName'] || `recipient_${i + j + 1}`;
            const fileNameBase = recipientName.toLowerCase().replace(/[\s_:-]+/g, '_');

            if (format === 'png') {
              const isLandscape = customizedTemplate.layout === 'landscape';
              const w = isLandscape ? 2240 : 1600;
              const h = isLandscape ? 1600 : 2240;
              
              const pngUrl = await svgToPngUrl(svgEl, w, h, fontUrl);
              const base64Data = pngUrl.split(',')[1];
              zip.file(`${fileNameBase}_certificate.png`, base64Data, { base64: true });
            } else {
              const pdfBlob = await svgToPdfBlob(svgEl, customizedTemplate.layout, fontUrl);
              zip.file(`${fileNameBase}_certificate.pdf`, pdfBlob);
            }
          }
        }
      }

      setBulkProgress({ current: allRowValues.length, total: allRowValues.length });
      const content = await zip.generateAsync({ type: 'blob' });
      setBulkSuccess(true);
      // Wait for success screen animation
      await new Promise(resolve => setTimeout(resolve, 1500));
      saveAs(content, `bulk_certificates_${format}.zip`);
    } catch (err) {
      alert('Bulk generation stopped: ' + (err as Error).message);
    } finally {
      setBulkRenderRows([]);
      setBulkIsProcessing(false);
      setBulkProgress(null);
      setBulkSuccess(false);
    }
  };

  // High-Speed Email Dispatch Engine (PDF Attachment)
  const handleBulkEmailDispatch = async () => {
    setEmailValidationError('');

    // 1. Validate Sending From (Sender Email)
    if (!resendSenderEmail || !resendSenderEmail.trim()) {
      setEmailValidationError('Please enter a Sender Email Address (Sending From).');
      return;
    }

    // 2. Validate Recipient Email (To) if in Single mode
    if (csvData.length === 0) {
      const singleEmail = formValues['recipientEmail']?.trim();
      if (!singleEmail) {
        setEmailValidationError('Please enter a Recipient Email address.');
        return;
      }
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(singleEmail)) {
        setEmailValidationError('Please enter a valid Recipient Email address (e.g. user@example.com).');
        return;
      }
    }

    // 3. Validate Email Subject Line
    if (!emailSubject || !emailSubject.trim()) {
      setEmailValidationError('Please enter an Email Subject Line.');
      return;
    }

    // 4. Validate Email Body Message
    if (!emailBody || !emailBody.trim()) {
      setEmailValidationError('Please enter an Email Body Message.');
      return;
    }

    const targetRows = csvData.length > 0 ? csvData.map((row) => {
      const obj: Record<string, string> = { ...formValues };
      Object.entries(mappings).forEach(([key, colIdx]) => {
        if (row[colIdx] !== undefined) {
          obj[key] = row[colIdx];
        }
      });
      return obj;
    }) : [formValues];

    setEmailIsSending(true);
    setEmailSuccess(false);
    
    const fontUrl = getDynamicFontsStylesheetUrl();
    const batchSize = 3;

    try {
      for (let i = 0; i < targetRows.length; i += batchSize) {
        const currentBatch = targetRows.slice(i, i + batchSize);
        setBulkRenderRows(currentBatch);
        
        await new Promise(resolve => setTimeout(resolve, 600));

        for (let j = 0; j < currentBatch.length; j++) {
          const rowVal = currentBatch[j];
          const recName = rowVal['recipientName'] || `Recipient ${i + j + 1}`;
          const recEmail = rowVal['recipientEmail'] || rowVal['email'] || formValues['recipientEmail'] || `${recName.toLowerCase().replace(/[\s_:-]+/g, '.')}@example.com`;
          
          // Grab SVG element from offscreen renderer or preview element
          const container = document.getElementById(`bulk-cert-container-${j}`);
          const svgEl = (container?.querySelector('svg') || previewSvgRef.current) as SVGSVGElement | null;

          let pdfBase64 = '';
          if (svgEl) {
            try {
              const pdfBlob = await svgToPdfBlob(svgEl, customizedTemplate.layout, fontUrl);
              const arrayBuffer = await pdfBlob.arrayBuffer();
              const uint8 = new Uint8Array(arrayBuffer);
              let binary = '';
              for (let b = 0; b < uint8.byteLength; b++) {
                binary += String.fromCharCode(uint8[b]);
              }
              pdfBase64 = btoa(binary);
            } catch (err) {
              console.error('PDF rendering failed', err);
            }
          }

          const filename = `${recName.toLowerCase().replace(/[\s_:-]+/g, '_')}_certificate.pdf`;

          const interpolatedSubject = emailSubject
            .replace(/\{\{recipientName\}\}/g, recName)
            .replace(/\{\{courseName\}\}/g, rowVal['courseName'] || '')
            .replace(/\{\{date\}\}/g, rowVal['date'] || '');

          const interpolatedBody = emailBody
            .replace(/\{\{recipientName\}\}/g, recName)
            .replace(/\{\{courseName\}\}/g, rowVal['courseName'] || '')
            .replace(/\{\{date\}\}/g, rowVal['date'] || '')
            .replace(/\{\{issuerName\}\}/g, rowVal['issuerName'] || '');

          const response = await fetch('/api/send-email', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              from: resendSenderEmail,
              to: recEmail,
              subject: interpolatedSubject,
              bodyText: interpolatedBody,
              pdfBase64,
              filename
            })
          });

          const data = await response.json();
          if (!response.ok) {
            throw new Error(data.error || 'Unable to dispatch email. Please try again.');
          }
        }
      }

      setEmailSuccess(true);
    } catch (err) {
      setEmailValidationError((err as Error).message);
    } finally {
      setBulkRenderRows([]);
      setEmailIsSending(false);
    }
  };

  // Drag and Drop Upload Processor
  const processCSVFile = (file: File) => {
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (text) {
        const rows = parseCSV(text);
        if (rows.length > 0) {
          const headers = rows[0];
          setCsvHeaders(headers);
          setCsvData(rows.slice(1).filter(r => r.length > 0 && r.some(cell => cell.trim() !== '')));
          setActivePreviewRow(0);

          // Smart auto-mapping with fuzzy matching
          const autoMap: Record<string, number> = {};
          const standardKeys = ['recipientName', 'recipientEmail', 'courseName', 'date', 'issuerName', 'issuerTitle', 'issuerName2', 'issuerTitle2'];
          standardKeys.forEach(key => {
            const cleanKey = key.toLowerCase();
            const matchIdx = headers.findIndex(h => {
              const cleanH = h.toLowerCase().replace(/[\s_:-]+/g, '');
              if (cleanKey === 'recipientemail' || cleanKey === 'email') {
                return cleanH.includes('email') || cleanH.includes('mail') || cleanH.includes('e-mail');
              }
              if (cleanKey === 'recipientname') {
                return cleanH.includes('recipient') || cleanH.includes('name') || cleanH.includes('student') || cleanH.includes('fullname');
              }
              if (cleanKey === 'coursename') {
                return cleanH.includes('course') || cleanH.includes('program') || cleanH.includes('class') || cleanH.includes('subject');
              }
              if (cleanKey === 'date') {
                return cleanH === 'date' || cleanH.includes('issued') || cleanH.includes('created');
              }
              if (cleanKey === 'issuername') {
                const isSecond = cleanH.includes('2') || cleanH.includes('second') || cleanH.includes('co') || cleanH.includes('partner');
                const isTitle = cleanH.includes('title') || cleanH.includes('role') || cleanH.includes('position');
                return !isSecond && !isTitle && (
                  cleanH.includes('issuer') || 
                  cleanH.includes('sign') || 
                  cleanH.includes('director') || 
                  cleanH.includes('teacher') || 
                  cleanH.includes('instructor') || 
                  cleanH.includes('authorizer')
                );
              }
              if (cleanKey === 'issuertitle') {
                const isSecond = cleanH.includes('2') || cleanH.includes('second') || cleanH.includes('co') || cleanH.includes('partner');
                const isTitle = cleanH.includes('title') || cleanH.includes('role') || cleanH.includes('position');
                return !isSecond && isTitle;
              }
              if (cleanKey === 'issuername2') {
                const isSecondSignatory = cleanH.includes('2') || cleanH.includes('second') || cleanH.includes('co') || cleanH.includes('partner');
                const isTitle = cleanH.includes('title') || cleanH.includes('role') || cleanH.includes('position');
                return isSecondSignatory && !isTitle && (
                  cleanH.includes('name') || 
                  cleanH.includes('sign') || 
                  cleanH.includes('issuer') || 
                  cleanH.includes('director') || 
                  cleanH.includes('teacher') || 
                  cleanH.includes('instructor')
                );
              }
              if (cleanKey === 'issuertitle2') {
                const isSecondSignatory = cleanH.includes('2') || cleanH.includes('second') || cleanH.includes('co') || cleanH.includes('partner');
                const isTitle = cleanH.includes('title') || cleanH.includes('role') || cleanH.includes('position');
                return isSecondSignatory && isTitle;
              }
              return cleanH.includes(cleanKey) || cleanKey.includes(cleanH);
            });
            autoMap[key] = matchIdx !== -1 ? matchIdx : 0;
          });
          setMappings(autoMap);
        }
      }
    };
    reader.readAsText(file);
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setIsDragActive(true);
    } else if (e.type === "dragleave") {
      setIsDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);

    const file = e.dataTransfer?.files?.[0];
    if (file && file.name.endsWith('.csv')) {
      processCSVFile(file);
    }
  };

  const downloadSampleCSV = () => {
    const csvContent = [
      ['Recipient Name', 'Recipient Email', 'Course Name', 'Issue Date', 'Signatory Name', 'Signatory Title'],
      ['Sarah Jenkins', 'sarah.jenkins@example.com', 'Advanced Web Applications Development', 'June 9, 2026', 'Dr. Michael Chen', 'Director of Education'],
      ['David Miller', 'david.miller@example.com', 'Cloud Architecture Masterclass', 'June 10, 2026', 'Dr. Michael Chen', 'Director of Education'],
      ['Emily Sophia', 'emily.sophia@example.com', 'Interactive Design Principles', 'June 11, 2026', 'Dr. Michael Chen', 'Director of Education'],
      ['Marcus Vance', 'marcus.vance@example.com', 'Cybersecurity Strategy', 'June 12, 2026', 'Dr. Michael Chen', 'Director of Education'],
    ].map(row => row.map(cell => `"${cell.replace(/"/g, '""')}"`).join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'Xertified_sample_recipients.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleElementClick = (elId: string) => {
    let inputId = '';
    if (elId === 'recipientName') {
      inputId = 'input-recipientName';
    } else if (elId === 'courseName') {
      inputId = 'input-courseName';
    } else if (elId === 'date') {
      inputId = 'input-date';
    } else if (elId === 'issuerName') {
      inputId = 'input-issuerName';
    } else if (elId === 'issuerTitle') {
      inputId = 'input-issuerTitle';
    } else if (elId === 'issuerName2') {
      inputId = 'input-issuerName2';
    } else if (elId === 'issuerTitle2') {
      inputId = 'input-issuerTitle2';
    } else {
      const role = getSemanticRole(elId);
      if (role) {
        inputId = `input-${role}`;
      }
    }

    if (inputId) {
      const el = document.getElementById(inputId);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        el.focus();
        el.classList.add('ring-4', 'ring-blue-500/50', 'border-blue-500');
        setTimeout(() => {
          el.classList.remove('ring-4', 'ring-blue-500/50', 'border-blue-500');
        }, 1500);
      }
    }
  };

  const resetColorsAndBorder = () => {
    if (activeTemplate) {
      setBgColor(activeTemplate.styles.backgroundColor);
      setBorderColor(activeTemplate.styles.borderColor);
      setAccentColor(activeTemplate.styles.accentColor || activeTemplate.primaryColor);
      setBorderStyle(activeTemplate.styles.borderStyle);
      setBorderWidth(activeTemplate.styles.borderWidth);
    }
  };

  const resetFontsAndSizes = () => {
    setFontOverrides({});
    setFontSizeOverrides({});
  };



  const filteredTemplates = PREBUILT_TEMPLATES.map((template, originalIndex) => ({
    template,
    originalIndex
  })).filter(({ template }) => {
    const matchesCategory = selectedCategory === 'All' || template.category.toLowerCase() === selectedCategory.toLowerCase();
    const matchesSearch = template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          template.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          template.category.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const customizedTemplate = getCustomizedTemplate();
  const activeValues = getActiveValues();

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans">
      {/* Dynamic Font Loader Link */}
      {(() => {
        const fontUrl = getDynamicFontsStylesheetUrl();
        return fontUrl ? (
          <link rel="stylesheet" href={fontUrl} />
        ) : null;
      })()}

      {/* â”€â”€ Header â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <header className="sticky top-0 z-50 w-full border-b border-slate-200 bg-white/90 backdrop-blur-md print:hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="p-1.5 rounded-xl bg-primary text-white shadow-sm shadow-primary/30 group-hover:scale-105 transition-transform">
              <Award className="w-4 h-4" />
            </div>
            <span className="font-bold text-lg tracking-tight text-slate-900">Xertified</span>
          </Link>
          <Link href="/" className="text-slate-500 hover:text-primary text-sm font-semibold flex items-center gap-1.5 transition-colors">
            <ArrowLeft className="w-4 h-4" /> Back
          </Link>
        </div>
      </header>

      {/* ── Main ── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-5 print:hidden">

        {/* Top Control Banner */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-primary/10 text-primary">
                <Award className="w-5 h-5 text-primary" />
              </div>
              <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">
                Certificate Studio &amp; Dispatch Engine
              </h1>
            </div>
            <p className="text-xs text-slate-500">Pick a template, import bulk recipient data via CSV, customize layout &amp; dispatch directly to inboxes.</p>
          </div>
        </div>

        {/* 1. Select Layout (Full Width) */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-3">
          <h2 className="text-[10px] font-black uppercase text-slate-400 tracking-widest flex items-center gap-1.5">
            <Grid className="w-3.5 h-3.5 text-primary" /> 1. Select Layout
          </h2>
          
          {/* Search and Category Filters */}
          <div className="space-y-3 pb-1">
            <div className="flex flex-wrap gap-1">
              {['All', 'Academic', 'Corporate', 'Award', 'General'].map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1 rounded-full text-[10px] font-bold transition-all ${
                    selectedCategory === cat
                      ? 'bg-slate-900 text-white shadow-sm'
                      : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          <div className="flex overflow-x-auto pb-3 gap-3 max-h-[320px] scrollbar-thin sm:grid sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 pr-1">
            {filteredTemplates.length > 0 ? (
              filteredTemplates.map(({ template: t, originalIndex: idx }) => {
                const isLandscape = t.layout === 'landscape';
                const nativeW = isLandscape ? 1120 : 800;
                const nativeH = isLandscape ? 800 : 1120;
                // Fit inside a 180×115 display box
                const thumbW = 180;
                const thumbH = 115;
                const scaleX = thumbW / nativeW;
                const scaleY = thumbH / nativeH;
                const thumbScale = Math.min(scaleX, scaleY);
                const scaledW = nativeW * thumbScale;
                const scaledH = nativeH * thumbScale;
                const isActive = activeTemplateIndex === idx;
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => handleTemplateSwitch(idx)}
                    title={t.name}
                    className={`relative group flex flex-col items-center rounded-xl border-2 overflow-hidden transition-all duration-200 focus:outline-none shrink-0 w-[180px] sm:w-auto ${
                      isActive
                        ? 'border-primary shadow-md shadow-primary/20 ring-2 ring-primary/30'
                        : 'border-slate-200 hover:border-primary/50 hover:shadow-sm'
                    }`}
                  >
                    {/* Mini SVG Preview */}
                    <div
                      className="w-full overflow-hidden bg-slate-100 flex items-center justify-center"
                      style={{ height: `${thumbH}px` }}
                    >
                      <div
                        style={{
                          width: `${scaledW}px`,
                          height: `${scaledH}px`,
                          transform: `scale(${thumbScale})`,
                          transformOrigin: 'top left',
                          pointerEvents: 'none',
                        }}
                      >
                        <CertificateRenderer
                          template={t}
                          values={{
                            recipientName: 'Jane Doe',
                            courseName: 'Excellence Award',
                            date: 'June 2026',
                            issuerName: 'Dr. Smith',
                            issuerTitle: 'Director',
                          }}
                          scale={1}
                        />
                      </div>
                    </div>

                    {/* Label */}
                    <div className={`w-full px-1.5 py-1.5 text-center transition-colors ${isActive ? 'bg-primary/5' : 'bg-white group-hover:bg-slate-50'}`}>
                      <span className={`text-[9px] font-bold block truncate leading-tight ${isActive ? 'text-primary' : 'text-slate-600'}`}>
                        {t.name}
                      </span>
                      <span className="text-[8px] text-slate-400 block mt-0.5">{t.category}</span>
                    </div>

                    {/* Active checkmark badge */}
                    {isActive && (
                      <div className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-primary flex items-center justify-center shadow">
                        <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
                          <path d="M1.5 4L3 5.5L6.5 2" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </div>
                    )}
                  </button>
                );
              })
            ) : (
              <div className="col-span-2 sm:col-span-3 md:col-span-4 lg:col-span-5 text-center py-4 text-xs text-slate-400">
                No templates found
              </div>
            )}
          </div>
        </div>

        {/* ── ROW 1: TWO-COLUMN CONTROL PANELS ── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
            <h2 className="text-[10px] font-black uppercase text-slate-400 tracking-widest flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-primary" /> 2. Certificate Data
            </h2>

            {/* Course */}
            <div className="space-y-1">
              <label className="text-[9px] font-bold text-slate-500 uppercase">Program / Course Title</label>
              <input type="text" id="input-courseName" value={formValues.courseName} onChange={(e) => handleInputChange('courseName', e.target.value)}
                className="w-full text-xs p-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary/30"
                placeholder="e.g. Advanced Web Development" />
            </div>

            {/* Date Picker */}
            <div className="space-y-1">
              <label className="text-[9px] font-bold text-slate-500 uppercase">DATE OF THE CERTIFICATE</label>
              <input type="date"
                id="input-date"
                value={(() => { try { const d = new Date(formValues.date); if (!isNaN(d.getTime())) return d.toISOString().split('T')[0]; } catch { /* noop */ } return ''; })()}
                onChange={(e) => {
                  const d = new Date(e.target.value + 'T12:00:00');
                  if (!isNaN(d.getTime())) handleInputChange('date', d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }));
                }}
                className="w-full text-xs p-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary/30 bg-white cursor-pointer" />
              {formValues.date && (
                <p className="text-[9px] text-slate-400 pl-1">Prints as: <span className="font-semibold text-slate-600">{formValues.date}</span></p>
              )}
            </div>

            {/* Signatory 1 */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[9px] font-bold text-slate-500 uppercase">{signatureCount === 2 ? 'Signatory 1 Name' : 'Signatory Name'}</label>
                <input type="text" id="input-issuerName" value={formValues.issuerName} onChange={(e) => handleInputChange('issuerName', e.target.value)}
                  className="w-full text-xs p-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary/30"
                  placeholder="Dr. Michael Chen" />
              </div>
              <div className="space-y-1">
                <label className="text-[9px] font-bold text-slate-500 uppercase">{signatureCount === 2 ? 'Signatory 1 Title' : 'Signatory Title'}</label>
                <input type="text" id="input-issuerTitle" value={formValues.issuerTitle} onChange={(e) => handleInputChange('issuerTitle', e.target.value)}
                  className="w-full text-xs p-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary/30"
                  placeholder="Director of Education" />
              </div>
            </div>

            {/* Signatory 2 (If enabled) */}
            {signatureCount === 2 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-100">
                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-slate-500 uppercase">Signatory 2 Name</label>
                  <input type="text" id="input-issuerName2" value={formValues.issuerName2 || ''} onChange={(e) => handleInputChange('issuerName2', e.target.value)}
                    className="w-full text-xs p-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary/30"
                    placeholder="Dr. Jane Smith" />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-slate-500 uppercase">Signatory 2 Title</label>
                  <input type="text" id="input-issuerTitle2" value={formValues.issuerTitle2 || ''} onChange={(e) => handleInputChange('issuerTitle2', e.target.value)}
                    className="w-full text-xs p-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary/30"
                    placeholder="Dean of Academics" />
                </div>
              </div>
            )}

            {/* Logo & Signature Assets Upload */}
            <div className="pt-3 border-t border-slate-100 space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Logos Configuration */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-slate-500 uppercase">Logos</span>
                    <select value={logoCount} onChange={(e) => setLogoCount(parseInt(e.target.value))}
                      className="text-[9px] p-1 border border-slate-200 rounded bg-slate-50 cursor-pointer focus:outline-none font-semibold">
                      <option value={1}>1 Logo</option>
                      <option value={2}>2 Logos</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <div className="space-y-1">
                      {logoCount === 2 && <span className="text-[8px] font-bold text-slate-400 uppercase block">Logo 1 (Left)</span>}
                      <div className="flex items-center gap-2">
                        <label className="px-2.5 py-1.5 border border-dashed border-slate-300 hover:bg-slate-50 rounded-lg cursor-pointer text-[10px] font-bold flex items-center gap-1 transition-colors">
                          <Upload className="w-3 h-3 text-slate-400" />
                          {customLogo ? 'Change' : 'Upload'}
                          <input type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" />
                        </label>
                        {customLogo && (
                          <>
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={customLogo} alt="logo 1" className="w-6 h-6 object-contain rounded border border-slate-200 bg-slate-50" />
                            <button onClick={() => setCustomLogo('')} className="text-[8px] font-bold text-red-500 hover:underline">Remove</button>
                          </>
                        )}
                      </div>
                    </div>
                    {logoCount === 2 && (
                      <div className="space-y-1 pt-1.5 border-t border-slate-100">
                        <span className="text-[8px] font-bold text-slate-400 uppercase block">Logo 2 (Right)</span>
                        <div className="flex items-center gap-2">
                          <label className="px-2.5 py-1.5 border border-dashed border-slate-300 hover:bg-slate-50 rounded-lg cursor-pointer text-[10px] font-bold flex items-center gap-1 transition-colors">
                            <Upload className="w-3 h-3 text-slate-400" />
                            {customLogo2 ? 'Change' : 'Upload'}
                            <input type="file" accept="image/*" onChange={async (e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                  const base64 = await readFileAsDataURL(file);
                                  setCustomLogo2(base64);
                                }
                              }} className="hidden" />
                          </label>
                          {customLogo2 && (
                            <>
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img src={customLogo2} alt="logo 2" className="w-6 h-6 object-contain rounded border border-slate-200 bg-slate-50" />
                              <button onClick={() => setCustomLogo2('')} className="text-[8px] font-bold text-red-500 hover:underline">Remove</button>
                            </>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Signatures Configuration */}
                <div className="space-y-2 border-t sm:border-t-0 pt-3 sm:pt-0 sm:border-l border-slate-100 sm:pl-4">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-slate-500 uppercase">Signatures</span>
                    <select value={signatureCount} onChange={(e) => setSignatureCount(parseInt(e.target.value))}
                      className="text-[9px] p-1 border border-slate-200 rounded bg-slate-50 cursor-pointer focus:outline-none font-semibold">
                      <option value={1}>1 Signature</option>
                      <option value={2}>2 Signatures</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <div className="space-y-1">
                      {signatureCount === 2 && <span className="text-[8px] font-bold text-slate-400 uppercase block">Signature 1 (Left)</span>}
                      <div className="flex items-center gap-2">
                        <label className="px-2.5 py-1.5 border border-dashed border-slate-300 hover:bg-slate-50 rounded-lg cursor-pointer text-[10px] font-bold flex items-center gap-1 transition-colors">
                          <Upload className="w-3 h-3 text-slate-400" />
                          {customSignature ? 'Change' : 'Upload'}
                          <input type="file" accept="image/*" onChange={handleSignatureUpload} className="hidden" />
                        </label>
                        {customSignature && (
                          <>
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={customSignature} alt="sig 1" className="h-5 max-w-[60px] object-contain rounded border border-slate-200 bg-slate-50 px-0.5" />
                            <button onClick={() => setCustomSignature('')} className="text-[8px] font-bold text-red-500 hover:underline">Remove</button>
                          </>
                        )}
                      </div>
                    </div>
                    {signatureCount === 2 && (
                      <div className="space-y-1 pt-1.5 border-t border-slate-100">
                        <span className="text-[8px] font-bold text-slate-400 uppercase block font-sans">Signature 2 (Right)</span>
                        <div className="flex items-center gap-2">
                          <label className="px-2.5 py-1.5 border border-dashed border-slate-300 hover:bg-slate-50 rounded-lg cursor-pointer text-[10px] font-bold flex items-center gap-1 transition-colors">
                            <Upload className="w-3 h-3 text-slate-400" />
                            {customSignature2 ? 'Change' : 'Upload'}
                            <input type="file" accept="image/*" onChange={async (e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                const rawBase64 = await readFileAsDataURL(file);
                                if (autoRemoveBg) {
                                  const transparentBase64 = await removeWhiteBackground(rawBase64);
                                  setCustomSignature2(transparentBase64);
                                } else {
                                  setCustomSignature2(rawBase64);
                                }
                              }
                            }} className="hidden" />
                          </label>
                          {customSignature2 && (
                            <>
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img src={customSignature2} alt="sig 2" className="h-5 max-w-[60px] object-contain rounded border border-slate-200 bg-slate-50 px-0.5" />
                              <button onClick={() => setCustomSignature2('')} className="text-[8px] font-bold text-red-500 hover:underline">Remove</button>
                            </>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Template Static Text Overrides */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-3">
            <h2 className="text-[10px] font-black uppercase text-slate-400 tracking-widest flex items-center gap-1.5">
              <Settings className="w-3.5 h-3.5 text-primary" /> 3. Template Text Overrides
            </h2>
            <p className="text-[9px] text-slate-400 -mt-1">Override the template&apos;s built-in static text (org name, title, body copy…)</p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[9px] font-bold text-slate-400 uppercase">Header / Org Name</label>
                <input type="text" id="input-header" value={getSemanticValue('header')} placeholder={getDefaultSemanticText('header')}
                  onChange={(e) => handleCustomTextChange('header', e.target.value)}
                  className="w-full text-xs p-2.5 border border-slate-200 bg-slate-50 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary/30" />
              </div>
              <div className="space-y-1">
                <label className="text-[9px] font-bold text-slate-400 uppercase">Certificate Title</label>
                <input type="text" id="input-title" value={getSemanticValue('title')} placeholder={getDefaultSemanticText('title')}
                  onChange={(e) => handleCustomTextChange('title', e.target.value)}
                  className="w-full text-xs p-2.5 border border-slate-200 bg-slate-50 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary/30" />
              </div>
              <div className="space-y-1">
                <label className="text-[9px] font-bold text-slate-400 uppercase">Presentation Line</label>
                <input type="text" id="input-presents" value={getSemanticValue('presents')} placeholder={getDefaultSemanticText('presents')}
                  onChange={(e) => handleCustomTextChange('presents', e.target.value)}
                  className="w-full text-xs p-2.5 border border-slate-200 bg-slate-50 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary/30" />
              </div>
              <div className="space-y-1">
                <label className="text-[9px] font-bold text-slate-400 uppercase">Date Label</label>
                <input type="date" id="input-dateLabel"
                  value={(() => { 
                    try { 
                      const val = getSemanticValue('dateLabel');
                      const d = new Date(val); 
                      if (!isNaN(d.getTime())) return d.toISOString().split('T')[0]; 
                    } catch { /* noop */ } 
                      return ''; 
                  })()}
                  onChange={(e) => {
                    const d = new Date(e.target.value + 'T12:00:00');
                    if (!isNaN(d.getTime())) {
                      handleCustomTextChange('dateLabel', d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }));
                    } else {
                      handleCustomTextChange('dateLabel', e.target.value);
                    }
                  }}
                  className="w-full text-xs p-2.5 border border-slate-200 bg-white rounded-lg focus:outline-none focus:ring-1 focus:ring-primary/30 cursor-pointer" />
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-[9px] font-bold text-slate-400 uppercase">Description / Body Paragraph</label>
              <textarea id="input-description" value={getSemanticValue('description')} placeholder={getDefaultSemanticText('description')}
                onChange={(e) => handleCustomTextChange('description', e.target.value)} rows={4}
                className="w-full text-xs p-2.5 border border-slate-200 bg-slate-50 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary/30 resize-none leading-relaxed" />
            </div>
          </div>
        </div>

        {/* â•â•â• ROW 2: GENERATION MODE + LIVE PREVIEW â•â• */}
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">

          {/* Tab bar */}
          <div className="flex items-stretch border-b border-slate-200 bg-slate-50">
            <div className="px-3 sm:px-5 py-3 hidden sm:flex items-center gap-2 border-r border-slate-200 shrink-0">
              <FileDown className="w-3.5 h-3.5 text-primary" />
              <span className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Generate</span>
            </div>
            <button onClick={() => setGenMode('single')}
              className={`flex-1 py-3 text-xs font-bold transition-colors border-b-2 ${genMode === 'single' ? 'border-primary text-primary bg-primary/5' : 'border-transparent text-slate-500 hover:text-slate-800'}`}>
              Single Certificate
            </button>
            <button onClick={() => setGenMode('bulk')}
              className={`flex-1 py-3 text-xs font-bold transition-colors border-b-2 ${genMode === 'bulk' ? 'border-primary text-primary bg-primary/5' : 'border-transparent text-slate-500 hover:text-slate-800'}`}>
              Bulk CSV Upload
            </button>
            {genMode === 'bulk' && csvData.length > 0 && (
              <div className="flex items-center gap-1 px-4 border-l border-slate-200 shrink-0">
<button onClick={() => setActivePreviewRow(prev => Math.max(0, prev - 1))} disabled={activePreviewRow === 0}
                  className="p-1 rounded hover:bg-slate-100 disabled:opacity-30 transition-colors">
                  <ChevronLeft className="w-3.5 h-3.5" />
                </button>
                <span className="text-[10px] font-bold text-slate-700 whitespace-nowrap">
                  <span className="font-mono text-primary">{activePreviewRow + 1}</span> / {csvData.length}
                </span>
                <button onClick={() => setActivePreviewRow(prev => Math.min(csvData.length - 1, prev + 1))} disabled={activePreviewRow === csvData.length - 1}
                  className="p-1 rounded hover:bg-slate-100 disabled:opacity-30 transition-colors">
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>

          {/* Mode controls row */}
          <div className="px-5 py-4 border-b border-slate-100 bg-slate-50/50">
            {genMode === 'single' && (
              <div className="flex items-end gap-4 flex-wrap">
                <div className="space-y-1 flex-1 min-w-[200px]">
                  <label className="text-[9px] font-bold text-slate-500 uppercase">Recipient Name</label>
                  <input type="text" id="input-recipientName" value={formValues.recipientName} onChange={(e) => handleInputChange('recipientName', e.target.value)}
                    className="w-full text-xs p-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary/30 bg-white"
                    placeholder="e.g. Sarah Jenkins" />
                </div>
                <div className="space-y-1 flex-1 min-w-[200px]">
                  <label className="text-[9px] font-bold text-slate-500 uppercase">Recipient Email Address</label>
                  <input type="email" id="input-recipientEmail" value={formValues.recipientEmail || ''} onChange={(e) => handleInputChange('recipientEmail', e.target.value)}
                    className="w-full text-xs p-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary/30 bg-white"
                    placeholder="e.g. sarah.jenkins@example.com" />
                </div>
              </div>
            )}

            {genMode === 'bulk' && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  
                  {/* Dashed Drag & Drop Zone */}
                  <div className="space-y-2">
                    <label className="text-[9px] font-bold text-slate-500 uppercase block">CSV Data Source</label>
                    <div
                      onDragEnter={handleDrag}
                      onDragOver={handleDrag}
                      onDragLeave={handleDrag}
                      onDrop={handleDrop}
                      className={`relative flex flex-col items-center justify-center border-2 border-dashed rounded-2xl p-5 transition-all duration-300 text-center cursor-pointer min-h-[120px] ${
                        isDragActive
                          ? 'border-primary bg-primary/10 scale-[1.02] shadow-md shadow-primary/10'
                          : 'border-slate-300 hover:border-primary/50 hover:bg-slate-50'
                      }`}
                    >
                      <input
                        type="file"
                        accept=".csv"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) processCSVFile(file);
                        }}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      />
                      <Upload className={`w-7 h-7 mb-2 transition-transform duration-300 ${isDragActive ? 'text-primary scale-110' : 'text-slate-400'}`} />
                      <div className="space-y-0.5">
                        <p className="text-xs font-bold text-slate-700">
                          {fileName ? `Selected: ${fileName}` : 'Drag & Drop CSV here or click to browse'}
                        </p>
                        <p className="text-[9px] text-slate-400">
                          Supports standard .csv spreadsheets
                        </p>
                      </div>
                    </div>
                    <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-[10px] space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="font-bold text-slate-700">Need a CSV template to get started?</span>
                        <button
                          type="button"
                          onClick={downloadSampleCSV}
                          className="px-2.5 py-1 bg-primary text-white font-bold rounded-lg hover:bg-primary-hover transition-colors flex items-center gap-1 shadow-sm cursor-pointer"
                        >
                          <FileDown className="w-3 h-3" /> Download Sample CSV
                        </button>
                      </div>
                      <div className="flex flex-wrap gap-1 text-[8px] font-mono text-slate-500">
                        <span className="bg-white border border-slate-200 px-1.5 py-0.5 rounded text-slate-700 font-semibold">Recipient Name</span>
                        <span className="bg-white border border-slate-200 px-1.5 py-0.5 rounded text-emerald-700 font-semibold">Recipient Email</span>
                        <span className="bg-white border border-slate-200 px-1.5 py-0.5 rounded text-slate-700 font-semibold">Course Name</span>
                        <span className="bg-white border border-slate-200 px-1.5 py-0.5 rounded text-slate-700 font-semibold">Issue Date</span>
                        <span className="bg-white border border-slate-200 px-1.5 py-0.5 rounded text-slate-700 font-semibold">Signatory Name</span>
                        <span className="bg-white border border-slate-200 px-1.5 py-0.5 rounded text-slate-700 font-semibold">Signatory Title</span>
                      </div>
                    </div>
                  </div>

                  {/* Columns mapping panel */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <label className="text-[9px] font-bold text-slate-500 uppercase block">Map Column Headers</label>
                      {csvData.length > 0 && (
                        <div className="text-[9px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                          {csvData.length} rows loaded
                        </div>
                      )}
                    </div>
                    {csvHeaders.length > 0 ? (
                      <div className="grid grid-cols-1 gap-2 bg-slate-50/50 border border-slate-200/60 rounded-xl p-3 max-h-[280px] overflow-y-auto pr-1">
                        {(() => {
                          const keys = ['recipientName', 'courseName', 'date', 'issuerName', 'issuerTitle'];
                          if (signatureCount === 2) {
                            keys.push('issuerName2', 'issuerTitle2');
                          }
                          return keys;
                        })().map((key) => {
                          const mappedIdx = mappings[key] !== undefined ? mappings[key] : 0;
                          const selectedHeader = csvHeaders[mappedIdx] || '';
                          const isAutoMapped = selectedHeader && (() => {
                            const k = key.toLowerCase();
                            const h = selectedHeader.toLowerCase().replace(/[\s_:-]+/g, '');
                            if (k === 'recipientname') return h.includes('recipient') || h.includes('name') || h.includes('student') || h.includes('fullname');
                            if (k === 'coursename') return h.includes('course') || h.includes('program') || h.includes('class') || h.includes('subject');
                            if (k === 'date') return h === 'date' || h.includes('issued') || h.includes('created');
                            return h.includes(k.replace('2', ''));
                          })();
                          
                          // Get live value of this mapping for active preview row
                          const liveVal = csvData[activePreviewRow]?.[mappedIdx] || '(empty)';

                          return (
                            <div key={key} className="bg-white border border-slate-200 rounded-xl p-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 shadow-sm text-left">
                              <div className="space-y-0.5">
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <span className="text-[10px] font-mono font-bold text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded">{`{{${key}}}`}</span>
                                  {isAutoMapped ? (
                                    <span className="text-[8px] font-extrabold text-emerald-600 bg-emerald-50 px-1 py-0.5 rounded border border-emerald-200">✓ Auto-Mapped</span>
                                  ) : (
                                    <span className="text-[8px] font-extrabold text-slate-500 bg-slate-100 px-1 py-0.5 rounded">Bound</span>
                                  )}
                                </div>
                                <div className="text-[9px] text-slate-400 truncate max-w-[200px]">
                                  Preview: <span className="font-semibold text-slate-650 italic">&quot;{liveVal}&quot;</span>
                                </div>
                              </div>
                              <select value={mappedIdx}
                                onChange={(e) => setMappings(prev => ({ ...prev, [key]: parseInt(e.target.value) }))}
                                className="text-[10px] p-1.5 border border-slate-250 bg-slate-50 hover:bg-slate-100 rounded-lg cursor-pointer focus:outline-none min-w-[120px] font-medium text-slate-700">
                                {csvHeaders.map((h, i) => <option key={i} value={i}>{h}</option>)}
                              </select>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="flex items-center justify-center border border-slate-200 bg-slate-50/50 rounded-xl p-6 text-center text-[10px] text-slate-400 italic">
                        Upload a CSV spreadsheet file to map data headers
                      </div>
                    )}
                  </div>
                </div>

                {/* Visual CSV Data Table */}
                {csvData.length > 0 && (
                  <div className="space-y-2 pt-2 border-t border-slate-100">
                    <div className="flex items-center justify-between">
                      <h3 className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Imported Records Preview</h3>
                      <span className="text-[10px] font-medium text-slate-400">Click any row to view in editor</span>
                    </div>
                    <div className="overflow-x-auto border border-slate-200 rounded-xl max-h-48 overflow-y-auto">
                      <table className="min-w-full divide-y divide-slate-200 text-left text-[11px]">
                        <thead className="bg-slate-50 sticky top-0 z-10">
                          <tr>
                            <th className="px-3 py-2 text-slate-500 font-bold">#</th>
                            {csvHeaders.map((header, idx) => (
                              <th key={idx} className="px-3 py-2 text-slate-500 font-bold">{header}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 bg-white">
                          {csvData.map((row, rowIdx) => (
                            <tr
                              key={rowIdx}
                              onClick={() => setActivePreviewRow(rowIdx)}
                              className={`cursor-pointer transition-colors ${
                                activePreviewRow === rowIdx
                                  ? 'bg-primary/10 font-medium text-primary'
                                  : 'hover:bg-slate-50 text-slate-600'
                              }`}
                            >
                              <td className="px-3 py-1.5 font-mono text-[10px] opacity-65">{rowIdx + 1}</td>
                              {row.map((cell, cellIdx) => (
                                <td key={cellIdx} className="px-3 py-1.5 truncate max-w-[160px]" title={cell}>
                                  {cell}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {/* Bulk ZIP export buttons inside CSV panel */}
                    <div className="flex flex-col sm:flex-row gap-2 justify-end pt-3 border-t border-slate-100">
                      <button 
                        type="button"
                        onClick={() => generateBulkZip('pdf')} 
                        className="w-full sm:w-auto py-2.5 px-4 bg-slate-900 hover:bg-black text-white text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-2 shadow-sm cursor-pointer"
                      >
                        <FileText className="w-3.5 h-3.5 text-blue-400" /> Export All ({csvData.length} PDF ZIP)
                      </button>
                      <button 
                        type="button"
                        onClick={() => generateBulkZip('png')} 
                        className="w-full sm:w-auto py-2.5 px-4 bg-primary hover:bg-primary-hover text-white text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-2 shadow-sm cursor-pointer"
                      >
                        <Download className="w-3.5 h-3.5" /> Export All ({csvData.length} PNG ZIP)
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* ── LIVE PREVIEW CANVAS ─────────────────── */}
          <div ref={previewContainerRef} className="bg-slate-100/80 border border-slate-200 rounded-2xl flex flex-col items-center justify-between min-h-[480px] relative overflow-hidden shadow-sm">
            
            {/* Top Toolbar Overlay on Certificate Canvas */}
            <div className="w-full px-5 py-3 flex flex-col sm:flex-row items-center justify-between gap-3 border-b border-slate-200/80 bg-white z-20">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                  Live Preview · {customizedTemplate.layout === 'landscape' ? '1120×800 Landscape' : '800×1120 Portrait'}
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowEmailModal(true)}
                  className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-lg shadow-sm transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <Mail className="w-3.5 h-3.5" />
                  <span>Email Certificates ({csvData.length > 0 ? `${csvData.length} Recipients` : 'Single'})</span>
                </button>



                <button
                  type="button"
                  onClick={() => setShowStudio(true)}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 border border-slate-200/80 cursor-pointer"
                >
                  <Sliders className="w-3.5 h-3.5 text-primary" />
                  <span>Customize</span>
                </button>
              </div>
            </div>

            <div className="flex-1 flex items-center justify-center py-6 w-full relative">
              <CertificateRenderer
                svgRef={previewSvgRef}
                template={customizedTemplate}
                values={activeValues}
                scale={scale}
                onElementClick={handleElementClick}
                className="rounded-xl shadow-xl border border-slate-200"
              />
            </div>
            
            {/* Floating Zoom Controls */}
            <div className="absolute bottom-4 right-4 flex items-center gap-1.5 bg-white/95 border border-slate-200 rounded-xl p-1.5 shadow-lg z-20 select-none text-xs font-semibold">
              <button
                type="button"
                onClick={() => { setZoomMode('manual'); setScale(prev => Math.max(prev - 0.05, 0.2)); }}
                className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors font-bold text-xs"
              >
                ー
              </button>
              <span className="text-[10px] font-mono text-slate-500 px-1 text-center min-w-[32px]">
                {Math.round(scale * 100)}%
              </span>
              <button
                type="button"
                onClick={() => { setZoomMode('manual'); setScale(prev => Math.min(prev + 0.05, 1.5)); }}
                className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors font-bold text-xs"
              >
                ＋
              </button>
              <div className="w-[1px] h-3.5 bg-slate-200 mx-1" />
              <button
                type="button"
                onClick={() => { setZoomMode('manual'); setScale(1.0); }}
                className={`px-2 py-1 text-[9px] font-bold rounded-lg transition-all ${
                  zoomMode === 'manual' && scale === 1.0 ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-500 hover:bg-slate-100'
                }`}
              >
                1:1
              </button>
              <button
                type="button"
                onClick={() => setZoomMode('auto')}
                className={`px-2 py-1 text-[9px] font-bold rounded-lg transition-all ${
                  zoomMode === 'auto' ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-500 hover:bg-slate-100'
                }`}
              >
                Fit
              </button>
            </div>
          </div>

        </div>
      </div>

      {/* Off-screen container for parallel batch rendering */}
      {bulkRenderRows.length > 0 && (
        <div style={{ position: 'absolute', left: '-9999px', top: '-9999px', pointerEvents: 'none' }} aria-hidden="true">
          {bulkRenderRows.map((rowVal, idx) => (
            <div key={idx} id={`bulk-cert-container-${idx}`}>
              <CertificateRenderer
                template={customizedTemplate}
                values={rowVal}
                scale={1}
              />
            </div>
          ))}
        </div>
      )}

      {/* Bulk compilation spinner overlay */}
      {bulkIsProcessing && bulkProgress && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-[9999] animate-in fade-in duration-200">
          <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-xl max-w-sm w-full mx-4 text-center space-y-5 transform transition-all animate-in zoom-in-95 duration-200">
            {bulkSuccess ? (
              <div className="space-y-4 py-4">
                <div className="w-16 h-16 bg-emerald-105 text-emerald-600 rounded-full flex items-center justify-center mx-auto animate-bounce shadow-md">
                  <span className="text-2xl font-bold text-emerald-600">✓</span>
                </div>
                <div className="space-y-1">
                  <h3 className="text-base font-extrabold text-slate-800">Success!</h3>
                  <p className="text-xs text-slate-500">ZIP archive compiled successfully.</p>
                </div>
                <p className="text-[10px] text-emerald-600 bg-emerald-50 border border-emerald-100 rounded-lg py-1 px-3 inline-block font-semibold">
                  Triggering download...
                </p>
              </div>
            ) : (
              <>
                {/* SVG Progress Circle */}
                {(() => {
                  const radius = 36;
                  const circumference = 2 * Math.PI * radius;
                  const percent = Math.round((bulkProgress.current / bulkProgress.total) * 100);
                  const strokeDashoffset = circumference - (percent / 100) * circumference;
                  return (
                    <div className="relative w-24 h-24 mx-auto flex items-center justify-center">
                      <svg className="w-full h-full transform -rotate-90">
                        <circle
                          cx="48"
                          cy="48"
                          r={radius}
                          className="stroke-slate-100"
                          strokeWidth="6"
                          fill="none"
                        />
                        <circle
                          cx="48"
                          cy="48"
                          r={radius}
                          className="stroke-primary transition-all duration-300 ease-out"
                          strokeWidth="6"
                          fill="none"
                          strokeDasharray={circumference}
                          strokeDashoffset={strokeDashoffset}
                          strokeLinecap="round"
                        />
                      </svg>
                      <div className="absolute text-sm font-extrabold text-slate-800 font-mono">
                        {percent}%
                      </div>
                    </div>
                  );
                })()}

                <div className="space-y-1.5">
                  <h3 className="text-sm font-extrabold text-slate-800">Compiling Batch Certificates</h3>
                  <p className="text-xs text-slate-500 font-medium">
                    Processed <span className="font-mono text-primary font-bold">{bulkProgress.current}</span> of <span className="font-mono font-bold text-slate-700">{bulkProgress.total}</span> records
                  </p>
                </div>

                <div className="bg-slate-50 border border-slate-100 rounded-xl p-3 text-left space-y-1.5 text-[10px] text-slate-500">
                  <div className="flex justify-between items-center">
                    <span className="font-semibold">Format:</span>
                    <span className="font-bold text-slate-700 uppercase">ZIP</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="font-semibold">Pipeline:</span>
                    <span className="font-bold text-slate-700">Parallel rendering (batch size 5)</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="font-semibold">Estimated status:</span>
                    <span className="font-bold text-slate-700 flex items-center gap-1">
                      <span className="inline-block w-1.5 h-1.5 rounded-full bg-indigo-500 animate-ping" />
                      Drawing canvas layouts
                    </span>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Customization Studio Side Drawer */}
      <div className={`fixed inset-y-0 right-0 w-full sm:max-w-lg md:max-w-xl bg-white border-l border-slate-200 shadow-2xl z-[150] transform transition-transform duration-300 flex flex-col print:hidden ${showStudio ? 'translate-x-0' : 'translate-x-full'}`}>
        {/* Drawer Header */}
        <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-2">
            <Sliders className="w-5 h-5 text-primary" />
            <div>
              <h3 className="text-sm font-bold text-slate-800">Customization Studio</h3>
              <p className="text-[10px] text-slate-400">Personalize your certificate template</p>
            </div>
          </div>
          <button 
            type="button" 
            onClick={() => setShowStudio(false)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Drawer Body - Scrollable content containing all 4 customization panels */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          
          {/* Design Colors & Border */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-[10px] font-black uppercase text-slate-400 tracking-widest flex items-center gap-1.5">
                <Sliders className="w-3.5 h-3.5 text-primary" /> 1. Colors &amp; Border
              </h2>
              <button
                type="button"
                onClick={resetColorsAndBorder}
                className="text-[9px] font-bold text-primary hover:underline cursor-pointer"
              >
                Use Default Settings
              </button>
            </div>
            <div className="grid grid-cols-3 gap-3">
              {([
                { label: 'Background', val: bgColor, set: setBgColor },
                { label: 'Border', val: borderColor, set: setBorderColor },
                { label: 'Accent / Text', val: accentColor, set: setAccentColor },
              ] as { label: string; val: string; set: React.Dispatch<React.SetStateAction<string>> }[]).map(({ label, val, set }) => (
                <div key={label} className="space-y-1.5">
                  <label className="text-[9px] font-bold text-slate-500 uppercase">{label}</label>
                  <div className="flex items-center gap-2">
                    <input type="color" value={val} onChange={(e) => set(e.target.value)}
                      className="w-7 h-7 rounded-md border border-slate-200 cursor-pointer p-0 shrink-0" />
                    <span className="text-[9px] font-mono text-slate-400 uppercase truncate">{val}</span>
                  </div>
                </div>
              ))}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3 border-t border-slate-100">
              <div className="space-y-1.5">
                <label className="text-[9px] font-bold text-slate-500 uppercase">Border Style</label>
                <select value={borderStyle} onChange={(e) => setBorderStyle(e.target.value as 'solid' | 'double' | 'fancy' | 'none')}
                  className="w-full text-xs p-2 border border-slate-200 rounded-lg cursor-pointer bg-slate-50 focus:outline-none">
                  <option value="solid">Solid</option>
                  <option value="double">Double</option>
                  <option value="fancy">Fancy Overlay</option>
                  <option value="none">None</option>
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-[9px] font-bold text-slate-500 uppercase">Width: {borderWidth}px</label>
                <input type="range" min="0" max="40" value={borderWidth} onChange={(e) => setBorderWidth(parseInt(e.target.value))}
                  className="w-full h-1 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-primary mt-3" />
              </div>
            </div>
          </div>

          {/* Component Toggles */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-3">
            <h2 className="text-[10px] font-black uppercase text-slate-400 tracking-widest flex items-center gap-1.5">
              <Eye className="w-3.5 h-3.5 text-primary" /> 2. Components
            </h2>

            {/* Seal */}
            <div className="space-y-2 pb-2 border-b border-slate-100">
              <div className="flex items-center justify-between">
                <button onClick={() => setShowBadge(!showBadge)} className="flex items-center gap-2 text-xs font-semibold text-slate-700">
                  {showBadge ? <CheckSquare className="w-4 h-4 text-primary" /> : <Square className="w-4 h-4 text-slate-300" />}
                  Seal / Badge
                </button>
                {showBadge && (
                  <select value={badgeType} onChange={(e) => { setBadgeType(e.target.value as 'gold_seal' | 'silver_star' | 'laurel_wreath' | 'shield' | 'custom'); if (e.target.value !== 'custom') setCustomSeal(''); }}
                    className="text-[10px] p-1.5 border border-slate-200 rounded-lg bg-slate-50 cursor-pointer focus:outline-none">
                    <option value="gold_seal">Gold Seal</option>
                    <option value="silver_star">Silver Star</option>
                    <option value="laurel_wreath">Laurel Wreath</option>
                    <option value="shield">Emblem Shield</option>
                    <option value="custom">Custom Upload</option>
                  </select>
                )}
              </div>
              {showBadge && badgeType === 'custom' && (
                <div className="pl-6 flex items-center gap-3">
                  <label className="px-3 py-1.5 border border-dashed border-primary/40 hover:bg-primary/5 rounded-lg cursor-pointer text-[10px] font-bold flex items-center gap-1.5 transition-colors text-primary">
                    <Upload className="w-3.5 h-3.5" />
                    {customSeal ? 'Change Seal' : 'Upload Seal'}
                    <input type="file" accept="image/*" onChange={handleSealUpload} className="hidden" />
                  </label>
                  {customSeal && (
                    <>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={customSeal} alt="seal" className="w-8 h-8 object-contain rounded border border-slate-200 bg-slate-50" />
                      <button onClick={() => { setCustomSeal(''); setBadgeType('laurel_wreath'); }} className="text-[9px] font-bold text-red-500 hover:underline">Remove</button>
                    </>
                  )}
                </div>
              )}
            </div>

            {/* QR Code */}
            <button onClick={() => setShowQrCode(!showQrCode)} className="flex items-center gap-2 text-xs font-semibold text-slate-700 w-full pb-2 border-b border-slate-100">
              {showQrCode ? <CheckSquare className="w-4 h-4 text-primary" /> : <Square className="w-4 h-4 text-slate-300" />}
              Verification QR Code
            </button>
          </div>



          {/* Fonts & Sizes Overrides */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4 font-sans">
            <div className="flex items-center justify-between">
              <h2 className="text-[10px] font-black uppercase text-slate-400 tracking-widest flex items-center gap-1.5">
                <Sliders className="w-3.5 h-3.5 text-primary" /> 3. Customize Fonts &amp; Sizes
              </h2>
              <button
                type="button"
                onClick={resetFontsAndSizes}
                className="text-[9px] font-bold text-primary hover:underline cursor-pointer"
              >
                Use Default Settings
              </button>
            </div>
            <p className="text-[9px] text-slate-400 -mt-1">Choose different calligraphic or clean fonts and adjust sizes for different parts of the certificate.</p>
            
            <div className="space-y-3 max-h-[350px] overflow-y-auto pr-1">
              {customizedTemplate.elements.filter(el => el.type === 'text').map((el) => {
                const txtEl = el as TextElement;
                const label = txtEl.id === 'recipientName' ? 'Recipient Name' :
                              txtEl.id === 'courseName' ? 'Course Title' :
                              txtEl.id === 'date' ? 'Date Value' :
                              txtEl.id.toLowerCase().includes('header') ? 'Header' :
                              txtEl.id.toLowerCase().includes('title') ? 'Certificate Title' :
                              txtEl.id.toLowerCase().includes('presents') ? 'Presentation Line' :
                              txtEl.id.toLowerCase().includes('desc') ? 'Description / Body' :
                              txtEl.id.toLowerCase().includes('issuername') || txtEl.id.toLowerCase().includes('issuer_name') ? 'Signatory Name' :
                              txtEl.id.toLowerCase().includes('issuertitle') || txtEl.id.toLowerCase().includes('issuer_title') ? 'Signatory Title' :
                              txtEl.id.toLowerCase().includes('date_line') || txtEl.id.toLowerCase().includes('date_label') ? 'Date Label' : txtEl.id;

                const currentFont = fontOverrides[el.id] || txtEl.style.fontFamily;
                const currentSize = fontSizeOverrides[el.id] || txtEl.style.fontSize;

                return (
                  <div key={el.id} className="p-3 bg-slate-50 rounded-xl border border-slate-200/60 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-700">{label}</span>
                      <span className="text-[9px] font-mono text-slate-400">{currentSize}px</span>
                    </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {/* Font Family selector */}
                      <div className="space-y-1 text-left w-full">
                        <label className="text-[9px] font-bold text-slate-400 uppercase">Font Family</label>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setOpenFontDropdownId(openFontDropdownId === el.id ? null : el.id);
                          }}
                          className="w-full text-xs p-2 border border-slate-200 rounded-lg bg-white focus:outline-none text-left flex justify-between items-center hover:bg-slate-50 transition-colors"
                          style={{ minHeight: '38px' }}
                        >
                          <span style={{ fontFamily: currentFont, paddingBottom: '4px', paddingTop: '4px', lineHeight: '1.6' }} className="text-sm block truncate pr-2">
                            {currentFont}
                          </span>
                          <span className="text-[8px] text-slate-400 shrink-0">▼</span>
                        </button>

                        {openFontDropdownId === el.id && (
                          <div className="mt-2 w-full bg-white border border-slate-250 rounded-xl p-3 space-y-3 text-left">
                            {/* Font Category Tabs */}
                            <div className="flex border-b border-slate-100 pb-1.5 gap-1">
                              {([
                                { id: 'script', label: '✍️ Script' },
                                { id: 'serif', label: '🏛️ Serif' },
                                { id: 'sans', label: '⚡ Clean' }
                              ] as const).map(tab => (
                                <button
                                  key={tab.id}
                                  type="button"
                                  onClick={(e) => { e.stopPropagation(); setActiveFontTab(tab.id); }}
                                  className={`flex-1 py-1 px-1.5 text-[9px] font-bold rounded-md transition-all ${
                                    activeFontTab === tab.id
                                      ? 'bg-slate-900 text-white shadow-sm'
                                      : 'text-slate-400 hover:bg-slate-50'
                                  }`}
                                >
                                  {tab.label}
                                </button>
                              ))}
                            </div>

                            {/* Font List */}
                            <div className="grid grid-cols-1 gap-1 max-h-[140px] overflow-y-auto pr-1">
                              {(() => {
                                const list = activeFontTab === 'script' ? SCRIPT_FONTS : activeFontTab === 'serif' ? SERIF_FONTS : SANS_FONTS;
                                return list.map(fontName => (
                                  <button
                                    key={fontName}
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setFontOverrides(prev => ({ ...prev, [el.id]: fontName }));
                                      setOpenFontDropdownId(null);
                                    }}
                                    className={`w-full text-left p-1.5 rounded-lg text-xs transition-colors flex items-center justify-between border ${
                                      currentFont === fontName
                                        ? 'bg-primary/10 border-primary/40 text-primary font-semibold'
                                        : 'hover:bg-slate-55 border-transparent text-slate-700'
                                    }`}
                                  >
                                    <span style={{ fontFamily: fontName, paddingBottom: '4px', paddingTop: '4px', lineHeight: '1.6' }} className="text-sm block truncate pr-2">
                                      {fontName}
                                    </span>
                                    {currentFont === fontName && <span className="text-[10px] text-primary shrink-0">✓</span>}
                                  </button>
                                ));
                              })()}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Font Size range */}
                      <div className="space-y-1">
                        <label className="text-[9px] font-bold text-slate-400 uppercase">Font Size</label>
                        <input type="range" min={Math.max(6, Math.round(txtEl.style.fontSize * 0.4))} max={Math.round(txtEl.style.fontSize * 2.5)}
                          value={currentSize}
                          onChange={(e) => setFontSizeOverrides(prev => ({ ...prev, [el.id]: parseInt(e.target.value) }))}
                          className="w-full h-1 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-primary mt-2" />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

        </div>
      </div>

      {/* Drawer Backdrop */}
      {showStudio && (
        <div 
          className="fixed inset-0 bg-slate-900/30 backdrop-blur-sm z-[140] transition-opacity duration-300 print:hidden"
          onClick={() => setShowStudio(false)}
        />
      )}

      {/* ── EMAIL CERTIFICATES DISPATCH MODAL OVERLAY ─────────────────── */}
      {showEmailModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-[9999] animate-in fade-in duration-200 p-4 print:hidden">
          <div className="bg-white border border-slate-200 rounded-2xl shadow-2xl max-w-xl w-full flex flex-col max-h-[90vh] overflow-hidden transform transition-all animate-in zoom-in-95 duration-200">
            
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-white">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-primary/10 text-primary">
                  <Mail className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-slate-900">
                    Email Certificates
                  </h3>
                  <p className="text-xs text-slate-400">
                    Dispatch vector PDF certificates directly to recipient inboxes
                  </p>
                </div>
              </div>
              <button 
                type="button"
                onClick={() => { setShowEmailModal(false); setEmailSuccess(false); setEmailValidationError(''); }}
                className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 overflow-y-auto space-y-4 flex-1 text-slate-800">
              
              {/* Validation Error Alert */}
              {emailValidationError && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-900 rounded-xl text-xs font-semibold flex items-center gap-2 animate-in fade-in duration-200">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{emailValidationError}</span>
                </div>
              )}

              {/* Success Notification */}
              {emailSuccess && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-xl text-xs font-semibold flex items-center gap-2 animate-in fade-in duration-200">
                  <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Certificate email(s) dispatched successfully!</span>
                </div>
              )}

              {/* Dynamic Sending From Email */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">Sending From (Sender Name &amp; Email)</label>
                <input 
                  type="text"
                  placeholder="e.g. Acme Academy <info@acmeacademy.org>"
                  value={resendSenderEmail}
                  onChange={(e) => { setResendSenderEmail(e.target.value); setEmailValidationError(''); }}
                  className="w-full text-xs p-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-primary font-medium"
                />
              </div>

              {/* Recipient Email (To) Field */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">Recipient Email (To)</label>
                {csvData.length > 0 ? (
                  <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between text-xs">
                    <span className="font-semibold text-emerald-900 flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-emerald-600" />
                      Auto-mapped from CSV &quot;Recipient Email&quot; column
                    </span>
                    <span className="font-mono font-bold bg-emerald-600 text-white px-2.5 py-0.5 rounded-full text-[10px]">
                      {csvData.length} Bulk Recipients
                    </span>
                  </div>
                ) : (
                  <input 
                    type="email"
                    placeholder="recipient@example.com"
                    value={formValues.recipientEmail || ''}
                    onChange={(e) => { handleInputChange('recipientEmail', e.target.value); setEmailValidationError(''); }}
                    className="w-full text-xs p-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-primary font-medium"
                  />
                )}
              </div>

              {/* Subject & Message Template */}
              <div className="space-y-3 pt-1">
                <div className="space-y-1">
                  <div className="flex justify-between items-center">
                    <label className="text-xs font-bold text-slate-700">Email Subject Line</label>
                    <span className="text-[10px] text-slate-400 font-mono">Tags: {"{{courseName}}"}</span>
                  </div>
                  <input 
                    type="text" 
                    value={emailSubject}
                    onChange={(e) => { setEmailSubject(e.target.value); setEmailValidationError(''); }}
                    className="w-full text-xs p-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-primary font-medium"
                  />
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between items-center">
                    <label className="text-xs font-bold text-slate-700">Email Body Message</label>
                    <span className="text-[10px] text-slate-400 font-mono">Tags: {"{{recipientName}}, {{courseName}}, {{date}}, {{issuerName}}"}</span>
                  </div>
                  <textarea 
                    rows={4}
                    value={emailBody}
                    onChange={(e) => { setEmailBody(e.target.value); setEmailValidationError(''); }}
                    className="w-full text-xs p-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-primary font-sans leading-relaxed"
                  />
                </div>
              </div>

              {/* Vector PDF Attachment Banner with Click-to-Preview Toggle */}
              <div className="space-y-2">
                <div className="p-3 bg-blue-50/80 border border-blue-200 rounded-xl flex items-center justify-between text-xs text-blue-900">
                  <div className="flex items-center gap-2 font-semibold">
                    <FileText className="w-4 h-4 text-blue-600" />
                    <span>High-resolution Vector Certificate PDF (.pdf)</span>
                  </div>
                  <button 
                    type="button"
                    onClick={() => setShowModalPreview(!showModalPreview)}
                    className="px-2.5 py-1 text-[10px] font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors flex items-center gap-1 cursor-pointer shadow-sm"
                  >
                    <Eye className="w-3 h-3" />
                    <span>{showModalPreview ? 'Hide Preview' : 'Preview Certificate'}</span>
                  </button>
                </div>

                {/* Collapsible Certificate Preview Drawer */}
                {showModalPreview && (
                  <div className="bg-slate-100/90 border border-slate-200 rounded-xl p-3 flex flex-col items-center justify-center overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                    <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-2 flex items-center justify-between w-full px-1">
                      <span>Live PDF Certificate Attachment Preview</span>
                      <span className="font-mono text-slate-400">{customizedTemplate.layout === 'landscape' ? '1120×800' : '800×1120'}</span>
                    </div>
                    <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-1 max-h-[220px] overflow-hidden flex items-center justify-center">
                      <div className="transform scale-[0.22] origin-center shrink-0">
                        <CertificateRenderer
                          template={customizedTemplate}
                          values={activeValues}
                          scale={1}
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>

            </div>

            {/* Modal Footer Bar */}
            <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
              <button 
                type="button"
                onClick={() => { setShowEmailModal(false); setEmailSuccess(false); setEmailValidationError(''); }}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-900 transition-colors cursor-pointer"
              >
                Cancel
              </button>

              <button 
                type="button"
                onClick={handleBulkEmailDispatch}
                disabled={emailIsSending}
                className="px-6 py-2.5 bg-primary hover:bg-primary-hover text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {emailIsSending ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Sending Emails...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    <span>Send PDF Certificates ({csvData.length > 0 ? csvData.length : 1})</span>
                  </>
                )}
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="border-t border-slate-200 py-6 text-center text-xs text-slate-400 bg-white print:hidden mt-2">
        <p>&copy; {new Date().getFullYear()} Xertified. Secure browser-sandbox rendering.</p>
      </footer>

    </div>
  );
}
// Fallback empty template structure
export const DEFAULT_BLANK_TEMPLATE: CertificateTemplate = {
  id: '',
  name: 'Custom Layout',
  description: 'Custom certificate layout.',
  category: 'General',
  primaryColor: '#4169e1',
  secondaryColor: '#ffffff',
  accentColor: '#4169e1',
  textColor: '#111827',
  fontFamily: 'Montserrat',
  layout: 'landscape',
  fields: ['recipientName', 'courseName', 'date', 'issuerName', 'issuerTitle'],
  styles: {
    backgroundColor: '#ffffff',
    backgroundType: 'color',
    borderColor: '#111827',
    borderWidth: 12,
    borderStyle: 'solid',
    accentColor: '#4169e1',
  },
  elements: []
};
