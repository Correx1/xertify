export interface CertificateVerificationData {
  id: string;
  recipientName: string;
  courseName: string;
  issuerName: string;
  issuerTitle?: string;
  issuerName2?: string;
  issuerTitle2?: string;
  date: string;
  templateId: string;
  bgColor?: string;
  borderColor?: string;
  accentColor?: string;
  borderStyle?: 'solid' | 'double' | 'fancy' | 'none';
  borderWidth?: number;
  badgeType?: 'gold_seal' | 'silver_star' | 'laurel_wreath' | 'shield' | 'custom';
  showBadge?: boolean;
  issueTimestamp?: number;
}

export function generateVerificationDataUrl(
  data: Partial<CertificateVerificationData>,
  origin?: string
): { url: string; certId: string } {
  const certId = data.id || `XERT-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;

  const baseOrigin = origin || (typeof window !== 'undefined' ? window.location.origin : 'https://xertified.app');

  // Ultra-short URL params so the QR code stays strictly low-density (Version 2/3 matrix with large bold squares)
  const params = new URLSearchParams();
  params.set('id', certId);
  if (data.recipientName) params.set('n', data.recipientName);
  if (data.courseName) params.set('c', data.courseName);
  if (data.issuerName) params.set('i', data.issuerName);
  if (data.date) params.set('d', data.date);
  if (data.templateId && data.templateId !== 'academic-classic') params.set('t', data.templateId);
  if (data.badgeType) params.set('st', data.badgeType);

  const url = `${baseOrigin}/verify?${params.toString()}`;

  return { url, certId };
}

export function parseVerificationData(encodedData: string, searchParams?: URLSearchParams): CertificateVerificationData | null {
  try {
    // If parsed directly from searchParams (ultra-short format)
    if (searchParams && (searchParams.has('id') || searchParams.has('n'))) {
      return {
        id: searchParams.get('id') || 'XERT-000000',
        recipientName: searchParams.get('n') || 'Recipient Name',
        courseName: searchParams.get('c') || 'Course Title',
        issuerName: searchParams.get('i') || 'Authorized Signatory',
        issuerTitle: searchParams.get('it') || '',
        date: searchParams.get('d') || new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }),
        templateId: searchParams.get('t') || 'academic-classic',
        badgeType: (searchParams.get('st') as CertificateVerificationData['badgeType']) || undefined,
        showBadge: true,
      };
    }

    if (!encodedData) return null;

    let decodedStr = '';
    const rawParam = decodeURIComponent(encodedData);

    if (typeof window !== 'undefined') {
      decodedStr = decodeURIComponent(escape(window.atob(rawParam)));
    } else {
      decodedStr = Buffer.from(rawParam, 'base64').toString('utf-8');
    }

    if (decodedStr.startsWith('{')) {
      const raw = JSON.parse(decodedStr);
      return {
        id: raw.id || 'XERT-000000',
        recipientName: raw.n || raw.recipientName || 'Recipient Name',
        courseName: raw.c || raw.courseName || 'Course Title',
        issuerName: raw.i || raw.issuerName || 'Authorized Signatory',
        issuerTitle: raw.it || raw.issuerTitle || '',
        issuerName2: raw.i2 || raw.issuerName2 || '',
        issuerTitle2: raw.it2 || raw.issuerTitle2 || '',
        date: raw.d || raw.date || '',
        templateId: raw.t || raw.templateId || 'academic-classic',
        bgColor: raw.bg || raw.bgColor,
        borderColor: raw.bd || raw.borderColor,
        accentColor: raw.ac || raw.accentColor,
        borderStyle: raw.bs || raw.borderStyle,
        badgeType: raw.st || raw.badgeType,
      };
    }

    const parts = decodedStr.split('|');
    if (parts.length < 3) return null;

    return {
      id: parts[0] || 'XERT-000000',
      recipientName: parts[1] || 'Recipient Name',
      courseName: parts[2] || 'Course Title',
      issuerName: parts[3] || 'Authorized Signatory',
      date: parts[4] || '',
      templateId: parts[5] || 'academic-classic',
      issuerTitle: parts[6] || '',
      issuerName2: parts[7] || '',
      issuerTitle2: parts[8] || '',
      bgColor: parts[9] || undefined,
      borderColor: parts[10] || undefined,
      accentColor: parts[11] || undefined,
      borderStyle: (parts[12] as CertificateVerificationData['borderStyle']) || undefined,
      badgeType: (parts[13] as CertificateVerificationData['badgeType']) || undefined,
    };
  } catch (err) {
    console.error('Failed to parse verification data:', err);
    return null;
  }
}
