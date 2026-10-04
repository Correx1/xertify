'use client';

import React from 'react';
import Link from 'next/link';
import { 
  Award, 
  UploadCloud, 
  FileSpreadsheet, 
  FileDown, 
  ArrowRight,
  MonitorPlay,
  ShieldCheck,
  Zap,
  Palette,
  CheckCircle2,
  Sparkles
} from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#060b19] text-slate-100 font-sans antialiased selection:bg-blue-600 selection:text-white">
      
      {/* Header Bar */}
      <header className="sticky top-0 z-50 bg-[#060b19]/90 backdrop-blur-md border-b border-slate-800/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="p-2 rounded-lg bg-blue-600 text-white shadow-sm group-hover:bg-blue-500 transition-colors">
              <Award className="w-5 h-5" />
            </div>
            <span className="font-bold text-lg tracking-tight text-white">
              Xertified
            </span>
          </Link>

          <nav className="flex items-center gap-4 sm:gap-6">
            <Link 
              href="/generate" 
              className="text-sm font-medium text-slate-300 hover:text-white transition-colors hidden sm:block"
            >
              Templates
            </Link>
            <Link 
              href="/generate" 
              className="px-4.5 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-medium text-sm shadow-sm transition-all flex items-center gap-2 group"
            >
              Open Workspace
              <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero Section with Full-Width End-to-End Background */}
      <section className="relative w-full overflow-hidden border-b border-slate-800/80 bg-[#060b19]">
        
        {/* Full-Width Soft Ambient Glow Highlights */}
        <div className="absolute top-1/2 right-0 -translate-y-1/2 w-[700px] h-[500px] bg-gradient-to-l from-blue-600/20 via-indigo-600/10 to-transparent blur-3xl pointer-events-none z-0" />
        <div className="absolute top-10 left-0 w-[400px] h-[400px] bg-blue-500/10 rounded-full blur-3xl pointer-events-none z-0" />

        {/* Content Container */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-24 lg:pt-32 lg:pb-32 relative z-10">
          <div className="max-w-3xl text-left space-y-6">
            
            <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black tracking-tight text-white leading-[1.08]">
              Generate & Issue <br />
              <span className="text-blue-400 font-extrabold">1,000+ Certificates in Minutes.</span>
            </h1>

            <p className="text-base sm:text-xl text-slate-300 max-w-2xl leading-relaxed">
              Upload CSV spreadsheets, choose designer templates, map recipient names visually, and export print-ready vector PDFs or PNG archives.
            </p>

            <div className="pt-2">
              <Link 
                href="/generate" 
                className="inline-flex items-center gap-2.5 px-8 py-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-base shadow-lg shadow-blue-600/25 transition-all group"
              >
                Launch Studio Workspace
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>

            <div className="pt-2 text-xs font-mono text-slate-400 flex items-center gap-2 select-none">
              <span className="font-semibold text-slate-300">.pdf vector export</span>
              <span>·</span>
              <span className="font-semibold text-slate-300">.csv bulk mapping</span>
              <span>·</span>
              <span className="font-semibold text-slate-300">100% in-browser</span>
            </div>

          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 border-t border-slate-800/80 relative overflow-hidden bg-[#060b19]">
        {/* Subtle grid background */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b15_1px,transparent_1px),linear-gradient(to_bottom,#1e293b15_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 space-y-16">
          
          {/* Section Main Headline */}
          <div className="max-w-4xl space-y-3">
            <div className="text-xs font-mono uppercase tracking-widest text-slate-400 font-semibold">
              CORE FOUNDATION
            </div>
            <h2 className="text-4xl sm:text-6xl font-black tracking-tight text-white leading-none">
              Everything you need to issue credentials.
            </h2>
            <p className="text-3xl sm:text-5xl font-extrabold tracking-tight text-slate-500 leading-none">
              Standard on every single certificate plan.
            </p>
          </div>

          {/* 2 Columns: 3 items on left, 3 items on right */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10 lg:gap-16">
            
            {/* Left Column (3 Features) */}
            <div className="space-y-8">
              
              {/* Feature 1 */}
              <div className="border-l-2 border-blue-500 pl-6 space-y-2">
                <h3 className="text-lg font-bold text-white">
                  Designer Templates
                </h3>
                <p className="text-slate-400 text-sm leading-relaxed">
                  Academic, corporate, award, minimalist, and tech layouts preconfigured with professional font combinations.
                </p>
              </div>

              {/* Feature 2 */}
              <div className="border-l-2 border-slate-800 hover:border-blue-500 pl-6 space-y-2 transition-colors">
                <h3 className="text-lg font-bold text-white">
                  Spreadsheet Auto-Mapping
                </h3>
                <p className="text-slate-400 text-sm leading-relaxed">
                  Upload CSV files and map columns like Recipient Name, Course Title, Issue Date, and Signatures instantly.
                </p>
              </div>

              {/* Feature 3 */}
              <div className="border-l-2 border-slate-800 hover:border-blue-500 pl-6 space-y-2 transition-colors">
                <h3 className="text-lg font-bold text-white">
                  Scannable Verification QR
                </h3>
                <p className="text-slate-400 text-sm leading-relaxed">
                  Embed custom scannable QR code elements onto credentials to enable online validation and certificate lookups.
                </p>
              </div>

            </div>

            {/* Right Column (3 Features) */}
            <div className="space-y-8">
              
              {/* Feature 4 */}
              <div className="border-l-2 border-slate-800 hover:border-blue-500 pl-6 space-y-2 transition-colors">
                <h3 className="text-lg font-bold text-white">
                  Logos & Signatures Upload
                </h3>
                <p className="text-slate-400 text-sm leading-relaxed">
                  Upload institution logos, seal badges, and authorized signatures with optional background removal.
                </p>
              </div>

              {/* Feature 5 */}
              <div className="border-l-2 border-slate-800 hover:border-blue-500 pl-6 space-y-2 transition-colors">
                <h3 className="text-lg font-bold text-white">
                  Bulk ZIP Export
                </h3>
                <p className="text-slate-400 text-sm leading-relaxed">
                  Export hundreds of certificates packaged neatly in a single `.zip` file formatted as high-res PNG or PDF.
                </p>
              </div>

              {/* Feature 6 */}
              <div className="border-l-2 border-slate-800 hover:border-blue-500 pl-6 space-y-2 transition-colors">
                <h3 className="text-lg font-bold text-white">
                  High-DPI Print Support
                </h3>
                <p className="text-slate-400 text-sm leading-relaxed">
                  Optimized vector layouts built to print cleanly with crisp text and vector borders at any scale.
                </p>
              </div>

            </div>

          </div>

          {/* CTA Action Button */}
          <div className="pt-8 flex justify-center">
            <Link 
              href="/generate"
              className="inline-flex items-center gap-2.5 px-8 py-3.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl shadow-lg shadow-blue-600/20 transition-all group"
            >
              Open Workspace
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>

        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 py-10 text-center text-xs text-slate-500 bg-[#040711]">
        <p>&copy; {new Date().getFullYear()} Xertified. Developed by <a href="https://chukwuraphael.vercel.app/" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline font-medium">Chukwu Raphael</a></p>
      </footer>

    </div>
  );
}
