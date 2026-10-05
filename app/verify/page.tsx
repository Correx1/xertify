'use client';

import React, { useMemo, useState, useRef, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { parseVerificationData } from '@/lib/verification';
import { PREBUILT_TEMPLATES } from '@/lib/templates';
import { CertificateRenderer } from '@/components/templates/CertificateRenderer';
import { TextElement, BadgeElement } from '@/lib/types';
import { svgToPdfBlob, svgToPngUrl } from '@/lib/export';
import { saveAs } from 'file-saver';
import { 
  CheckCircle2, 
  ShieldCheck, 
  Award, 
  Download, 
  FileText, 
  ArrowLeft, 
  ExternalLink,
  AlertTriangle,
  Calendar,
  User,
  BookOpen,
  Lock
} from 'lucide-react';

function VerificationContent() {
  const searchParams = useSearchParams();
  const dataParam = searchParams.get('v') || searchParams.get('data');

  const [downloading, setDownloading] = useState<'pdf' | 'png' | null>(null);

  const svgRef = useRef<SVGSVGElement | null>(null);

  const certData = useMemo(() => {
    return parseVerificationData(dataParam || '', searchParams);
  }, [dataParam, searchParams]);

  // Construct full template object for renderer
  const getRenderableTemplate = () => {
    if (!certData) return null;

    const baseTemplate = PREBUILT_TEMPLATES.find(t => t.id === certData.templateId) || PREBUILT_TEMPLATES[0];
    
    // Map text elements with recipient values
    const customizedElements = baseTemplate.elements.map(el => {
      if (el.type === 'text') {
        const txtEl = el as TextElement;
        let textVal = txtEl.text;

        if (txtEl.id === 'recipientName') textVal = certData.recipientName;
        else if (txtEl.id === 'courseName') textVal = certData.courseName;
        else if (txtEl.id === 'date') textVal = certData.date;
        else if (txtEl.id === 'issuerName') textVal = certData.issuerName;
        else if (txtEl.id === 'issuerTitle') textVal = certData.issuerTitle || txtEl.text;
        else if (txtEl.id === 'issuerName2') textVal = certData.issuerName2 || txtEl.text;
        else if (txtEl.id === 'issuerTitle2') textVal = certData.issuerTitle2 || txtEl.text;

        return {
          ...txtEl,
          text: textVal
        };
      }

      if (el.type === 'badge' && certData.badgeType) {
        return {
          ...el,
          badgeType: certData.badgeType,
          visible: certData.showBadge !== false
        } as BadgeElement;
      }

      return el;
    });

    return {
      ...baseTemplate,
      styles: {
        ...baseTemplate.styles,
        backgroundColor: certData.bgColor || baseTemplate.styles.backgroundColor,
        borderColor: certData.borderColor || baseTemplate.styles.borderColor,
        accentColor: certData.accentColor || baseTemplate.styles.accentColor,
        borderStyle: certData.borderStyle || baseTemplate.styles.borderStyle,
        borderWidth: certData.borderWidth !== undefined ? certData.borderWidth : baseTemplate.styles.borderWidth,
      },
      elements: customizedElements
    };
  };

  const handleDownloadPDF = async () => {
    if (!svgRef.current || !certData) return;
    setDownloading('pdf');
    try {
      const template = getRenderableTemplate();
      const layout = template?.layout || 'landscape';
      const pdfBlob = await svgToPdfBlob(svgRef.current, layout);
      saveAs(pdfBlob, `${certData.recipientName.toLowerCase().replace(/[\s_:-]+/g, '_')}_verified_certificate.pdf`);
    } catch (err) {
      console.error('PDF export failed:', err);
    } finally {
      setDownloading(null);
    }
  };

  const handleDownloadPNG = async () => {
    if (!svgRef.current || !certData) return;
    setDownloading('png');
    try {
      const template = getRenderableTemplate();
      const isLandscape = template?.layout === 'landscape';
      const w = isLandscape ? 2240 : 1600;
      const h = isLandscape ? 1600 : 2240;
      const pngUrl = await svgToPngUrl(svgRef.current, w, h);
      saveAs(pngUrl, `${certData.recipientName.toLowerCase().replace(/[\s_:-]+/g, '_')}_verified_certificate.png`);
    } catch (err) {
      console.error('PNG export failed:', err);
    } finally {
      setDownloading(null);
    }
  };

  const templateToRender = getRenderableTemplate();

  if (!certData || !templateToRender) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6">
        <div className="bg-white border border-slate-200 rounded-3xl p-8 max-w-md w-full shadow-xl text-center space-y-4">
          <div className="w-14 h-14 bg-red-50 text-red-500 rounded-2xl flex items-center justify-center mx-auto border border-red-100">
            <AlertTriangle className="w-7 h-7" />
          </div>
          <div className="space-y-1">
            <h1 className="text-lg font-bold text-slate-900">Verification Link Unverified</h1>
            <p className="text-xs text-slate-500">No valid certificate verification data found in this link.</p>
          </div>
          <div className="pt-2">
            <Link
              href="/"
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-slate-900 hover:bg-black text-white text-xs font-bold rounded-xl transition-colors shadow-sm"
            >
              <ArrowLeft className="w-4 h-4" /> Go to Xertified Generator
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100/70 text-slate-900 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-slate-200/80 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="p-2 rounded-xl bg-primary text-white group-hover:scale-105 transition-transform">
              <Award className="w-5 h-5" />
            </div>
            <span className="font-black text-base tracking-tight text-slate-900">
              Xertified <span className="text-primary text-xs font-bold uppercase tracking-wider bg-primary/10 px-2 py-0.5 rounded-full ml-1">Verify</span>
            </span>
          </Link>

          <Link 
            href="/generate" 
            className="text-xs font-bold text-slate-600 hover:text-primary transition-colors flex items-center gap-1.5"
          >
            Create Certificates <ExternalLink className="w-3.5 h-3.5" />
          </Link>
        </div>
      </header>

      {/* Main Body */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-6 flex-1 w-full">
        
        {/* Verification Status Banner */}
        <div className="bg-white border border-emerald-200/80 rounded-3xl p-6 sm:p-8 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-2xl pointer-events-none" />
          
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="flex items-start gap-4">
              <div className="p-3.5 rounded-2xl bg-emerald-500 text-white shadow-lg shadow-emerald-500/20 shrink-0">
                <ShieldCheck className="w-8 h-8" />
              </div>
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-black uppercase tracking-widest flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Authentic &amp; Valid
                  </span>
                  <span className="text-[10px] font-mono text-slate-400">ID: {certData.id}</span>
                </div>
                <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
                  Officially Verified Digital Credential
                </h1>
                <p className="text-xs text-slate-500">
                  Issued by <span className="font-bold text-slate-800">{certData.issuerName}</span> via Xertified Sandbox Engine
                </p>
              </div>
            </div>

            {/* Quick Export Actions */}
            <div className="flex flex-wrap items-center gap-2 w-full md:w-auto shrink-0">
              <button
                type="button"
                onClick={handleDownloadPDF}
                disabled={downloading !== null}
                className="flex-1 md:flex-initial px-4 py-2.5 bg-slate-900 hover:bg-black text-white text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-2 shadow-sm cursor-pointer disabled:opacity-50"
              >
                <FileText className="w-4 h-4 text-blue-400" />
                <span>{downloading === 'pdf' ? 'Preparing PDF...' : 'Download PDF'}</span>
              </button>
              <button
                type="button"
                onClick={handleDownloadPNG}
                disabled={downloading !== null}
                className="flex-1 md:flex-initial px-4 py-2.5 bg-primary hover:bg-primary-hover text-white text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-2 shadow-sm cursor-pointer disabled:opacity-50"
              >
                <Download className="w-4 h-4" />
                <span>{downloading === 'png' ? 'Preparing PNG...' : 'Download PNG'}</span>
              </button>
            </div>
          </div>

          {/* Credential Details Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-6 mt-6 border-t border-slate-100">
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                <User className="w-3 h-3 text-primary" /> Recipient Name
              </span>
              <p className="text-xs font-bold text-slate-800 truncate">{certData.recipientName}</p>
            </div>

            <div className="space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                <BookOpen className="w-3 h-3 text-primary" /> Course / Award
              </span>
              <p className="text-xs font-bold text-slate-800 truncate">{certData.courseName}</p>
            </div>

            <div className="space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                <Award className="w-3 h-3 text-primary" /> Issuing Entity
              </span>
              <p className="text-xs font-bold text-slate-800 truncate">{certData.issuerName}</p>
            </div>

            <div className="space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                <Calendar className="w-3 h-3 text-primary" /> Issue Date
              </span>
              <p className="text-xs font-bold text-slate-800 truncate">{certData.date}</p>
            </div>
          </div>
        </div>

        {/* Live Certificate Display Canvas */}
        <div className="bg-white border border-slate-200 rounded-3xl p-4 sm:p-8 shadow-sm flex flex-col items-center justify-center min-h-[500px]">
          <div className="w-full flex items-center justify-between pb-4 mb-4 border-b border-slate-100">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5 text-emerald-600" /> Tamper-Evident Certificate Render
            </span>
            <span className="text-[10px] font-mono text-slate-400">Layout: {templateToRender.layout}</span>
          </div>

          <div className="w-full overflow-x-auto flex justify-center py-2">
            <CertificateRenderer
              svgRef={svgRef}
              template={templateToRender}
            />
          </div>
        </div>

      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 py-6 text-center text-xs text-slate-400 bg-white print:hidden mt-6">
        <p>&copy; {new Date().getFullYear()} Xertified. Created by Chukwu Raphael</p>
      </footer>
    </div>
  );
}

export default function VerificationPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <VerificationContent />
    </Suspense>
  );
}
