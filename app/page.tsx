'use client';

import React from 'react';
import Link from 'next/link';
import { 
  Award, 
  UploadCloud, 
  FileSpreadsheet, 
  FileDown, 
  ArrowRight,
  MonitorPlay
} from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans transition-colors duration-200">
      
      {/* Dark Gradient Hero Section */}
      <section className="relative pt-32 pb-28 bg-[#0b081e] overflow-hidden border-b border-slate-950">
        {/* Logo at the top left */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 absolute top-8 left-0 right-0 z-20">
          <Link href="/" className="flex items-center gap-2.5 group w-fit">
            <div className="p-2 rounded-xl bg-primary text-white shadow-md shadow-primary/20 group-hover:scale-105 transition-transform">
              <Award className="w-5 h-5" />
            </div>
            <span className="font-bold text-xl tracking-tight text-white">
              CertifyPro
            </span>
          </Link>
        </div>
        {/* Radial glows matching reference image */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-purple-650/15 blur-[120px] rounded-full pointer-events-none" />
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[80%] h-[120px] bg-primary/10 blur-[80px] rounded-full pointer-events-none" />
        
        {/* Subtle grid mockup using CSS background pattern */}
        <div 
          className="absolute inset-0 opacity-[0.05] pointer-events-none"
          style={{
            backgroundImage: `
              linear-gradient(to right, #ffffff 1px, transparent 1px),
              linear-gradient(to bottom, #ffffff 1px, transparent 1px)
            `,
            backgroundSize: '40px 40px',
            maskImage: 'radial-gradient(ellipse at center, black 40%, transparent 80%)',
            WebkitMaskImage: 'radial-gradient(ellipse at center, black 40%, transparent 80%)'
          }}
        />

        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-8 relative z-10">
          
          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-tight text-white">
            Create Beautiful Certificates <br/>
            <span className="bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">in Minutes</span>
          </h1>

          <p className="text-lg sm:text-xl text-slate-400 leading-relaxed max-w-2xl mx-auto">
            Bulk generate high-resolution certificates from Excel or CSV files, customize designer templates, and export instantly in print-perfect PDF or PNG format.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-4">
            <Link 
              href="/generate" 
              className="px-8 py-3.5 bg-primary hover:bg-primary-hover text-white font-bold rounded-lg shadow-lg shadow-primary/20 transition-all flex items-center justify-center gap-2 group w-full sm:w-auto"
            >
              Browse Templates
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link 
              href="/generate" 
              className="px-8 py-3.5 border border-slate-800 bg-white/5 hover:bg-white/10 text-white font-bold rounded-lg transition-all flex items-center justify-center gap-2 w-full sm:w-auto"
            >
              <FileSpreadsheet className="w-4.5 h-4.5 text-blue-400" />
              Bulk Generate CSV
            </Link>
          </div>

        </div>
      </section>

      {/* How it Works Section */}
      <section className="py-20 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto space-y-3 mb-16">
            <h2 className="text-xs font-bold text-primary uppercase tracking-widest">Simplifying Generation</h2>
            <p className="text-3xl font-bold tracking-tight text-slate-900">How CertifyPro Works</p>
            <p className="text-slate-500 text-sm">Create high-quality credentials in three simple steps, without write-ups or payment forms.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            
            {/* Step 1 */}
            <div className="bg-white border border-slate-200 p-8 rounded-xl space-y-4 shadow-sm hover:shadow-md transition-shadow relative">
              <div className="absolute top-6 right-6 font-mono text-5xl font-extrabold text-slate-100 select-none">01</div>
              <div className="w-10 h-10 rounded-lg bg-indigo-50 text-primary flex items-center justify-center">
                <MonitorPlay className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">Choose a Template</h3>
              <p className="text-slate-500 text-sm leading-relaxed">
                Select from our designer prebuilt layouts matching corporate, academic, and award themes, or create a layout from scratch.
              </p>
            </div>

            {/* Step 2 */}
            <div className="bg-white border border-slate-200 p-8 rounded-xl space-y-4 shadow-sm hover:shadow-md transition-shadow relative">
              <div className="absolute top-6 right-6 font-mono text-5xl font-extrabold text-slate-100 select-none">02</div>
              <div className="w-10 h-10 rounded-lg bg-indigo-50 text-primary flex items-center justify-center">
                <UploadCloud className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">Import Recipient Data</h3>
              <p className="text-slate-500 text-sm leading-relaxed">
                Upload your CSV file, or input manually. Use our visual field mapper to bind variables directly with columns in your spreadsheet.
              </p>
            </div>

            {/* Step 3 */}
            <div className="bg-white border border-slate-200 p-8 rounded-xl space-y-4 shadow-sm hover:shadow-md transition-shadow relative">
              <div className="absolute top-6 right-6 font-mono text-5xl font-extrabold text-slate-100 select-none">03</div>
              <div className="w-10 h-10 rounded-lg bg-indigo-50 text-primary flex items-center justify-center">
                <FileDown className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">Download & Share</h3>
              <p className="text-slate-500 text-sm leading-relaxed">
                Generate high-resolution vector PDFs or PNGs. Choose to download individual records or bulk compile everything into a zip.
              </p>
            </div>

          </div>
        </div>
      </section>

      {/* Footer Call-to-action */}
      <section className="py-20 border-t border-slate-200 bg-white">
        <div className="max-w-4xl mx-auto px-4 text-center space-y-6">
          <h3 className="text-3xl font-extrabold tracking-tight text-slate-900">Ready to bulk issue certificates?</h3>
          <p className="text-slate-500 text-sm max-w-xl mx-auto">
            Get started by picking one of our prebuilt layouts or start formatting your CSV. No signups required.
          </p>
          <div className="flex justify-center">
            <Link 
              href="/generate"
              className="px-8 py-3.5 bg-primary hover:bg-primary-hover text-white font-bold rounded-lg shadow-lg shadow-primary/20 active:scale-95 transition-all"
            >
              Open Generation Workspace
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-200 py-8 text-center text-xs text-slate-400 bg-slate-50">
        <p>&copy; {new Date().getFullYear()} CertifyPro. Built for modern credentials automation.</p>
      </footer>
      
    </div>
  );
}
