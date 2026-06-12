import React from 'react';
import { Award, Plus, FileSpreadsheet, Edit3, Trash2, Copy, Sparkles, Clock } from '@/components/Icons';
import { CertificateTemplate, TextElement, BadgeElement, ImageElement } from '@/lib/types';
import { BadgeSvg } from '@/components/templates/BadgeSvg';

interface DashboardProps {
  prebuiltTemplates: CertificateTemplate[];
  customTemplates: CertificateTemplate[];
  onCreateBlank: () => void;
  onSelectTemplate: (template: CertificateTemplate, mode: 'edit' | 'generate') => void;
  onDeleteCustomTemplate: (id: string) => void;
  onDuplicateTemplate: (template: CertificateTemplate) => void;
  stats: {
    templatesCount: number;
    batchesGenerated: number;
    certificatesCount: number;
  };
}

export const Dashboard: React.FC<DashboardProps> = ({
  prebuiltTemplates,
  customTemplates,
  onCreateBlank,
  onSelectTemplate,
  onDeleteCustomTemplate,
  onDuplicateTemplate,
  stats,
}) => {
  // Renders a mini-preview of a certificate template
  const MiniCertificatePreview: React.FC<{ template: CertificateTemplate }> = ({ template }) => {
    const scale = 0.22; // Small scale for grid thumbnail
    return (
      <div 
        className="relative overflow-hidden select-none border border-zinc-200 dark:border-zinc-800 rounded bg-white"
        style={{
          width: '100%',
          aspectRatio: '1.4',
        }}
      >
        <div
          className="absolute origin-top-left"
          style={{
            width: '1120px',
            height: '800px',
            transform: `scale(${scale})`,
            backgroundColor: template.styles.backgroundColor,
            borderColor: template.styles.borderColor,
            borderWidth: `${template.styles.borderWidth}px`,
            borderStyle: template.styles.borderStyle === 'none' ? 'none' : 
                         template.styles.borderStyle === 'fancy' ? 'solid' : template.styles.borderStyle,
          }}
        >
          {/* Ornate fancy border simulation */}
          {template.styles.borderStyle === 'fancy' && (
            <div 
              className="absolute inset-2 border-2 border-double" 
              style={{ borderColor: template.styles.accentColor }} 
            />
          )}

          {template.elements.map((el) => {
            if (!el.visible) return null;

            if (el.type === 'text') {
              const txtEl = el as TextElement;
              return (
                <div
                  key={el.id}
                  className="absolute pointer-events-none whitespace-pre-wrap overflow-hidden flex flex-col justify-center"
                  style={{
                    left: `${el.x - el.width / 2}px`,
                    top: `${el.y - el.height / 2}px`,
                    width: `${el.width}px`,
                    height: `${el.height}px`,
                    fontFamily: txtEl.style.fontFamily,
                    fontSize: `${txtEl.style.fontSize}px`,
                    fontWeight: txtEl.style.fontWeight,
                    fontStyle: txtEl.style.fontStyle,
                    color: txtEl.style.color,
                    textAlign: txtEl.style.align,
                    letterSpacing: `${txtEl.style.letterSpacing}px`,
                    textTransform: txtEl.style.uppercase ? 'uppercase' : 'none',
                    lineHeight: '1.2',
                  }}
                >
                  {txtEl.text.replace(/\{\{.*?\}\}/g, 'Text')}
                </div>
              );
            }

            if (el.type === 'badge') {
              const badgeEl = el as BadgeElement;
              return (
                <div
                  key={el.id}
                  className="absolute pointer-events-none transform -translate-x-1/2 -translate-y-1/2"
                  style={{
                    left: `${el.x}px`,
                    top: `${el.y}px`,
                    width: `${el.width}px`,
                    height: `${el.height}px`,
                  }}
                >
                  <BadgeSvg
                    badgeType={badgeEl.badgeType}
                    color={badgeEl.color}
                    width={el.width}
                    height={el.height}
                  />
                </div>
              );
            }

            if (el.type === 'image' || el.type === 'signature') {
              const imgEl = el as ImageElement;
              return (
                <div
                  key={el.id}
                  className="absolute pointer-events-none border border-dashed border-zinc-300 dark:border-zinc-700 flex items-center justify-center transform -translate-x-1/2 -translate-y-1/2 bg-zinc-50"
                  style={{
                    left: `${el.x}px`,
                    top: `${el.y}px`,
                    width: `${el.width}px`,
                    height: `${el.height}px`,
                  }}
                >
                  {imgEl.src ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img src={imgEl.src} alt={el.type} className="max-w-full max-h-full object-contain" />
                  ) : (
                    <span className="text-[10px] text-zinc-400 font-sans">{el.type}</span>
                  )}
                </div>
              );
            }

            return null;
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="flex-1 w-full max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8 space-y-10">
      {/* Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-primary text-white p-8 sm:p-12 shadow-md">
        
        <div className="relative z-10 max-w-2xl space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-white text-xs font-semibold backdrop-blur-sm">
            <Sparkles className="w-3.5 h-3.5" />
            Empowering Verification & Credentials
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight">Xertify Certificate Builder</h1>
          <p className="text-lg text-slate-100 leading-relaxed">
            Design professional custom certificate templates, add secure fields, upload authorized signatures, and bulk generate high-resolution credentials from spreadsheet imports.
          </p>
          <div className="pt-2 flex flex-wrap gap-4">
            <button
              onClick={onCreateBlank}
              className="px-6 py-3 rounded-lg bg-white text-primary font-semibold hover:bg-slate-50 transition-all flex items-center gap-2 shadow-md hover:-translate-y-0.5 active:translate-y-0"
            >
              <Plus className="w-5 h-5" />
              Create Custom Design
            </button>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm flex items-center gap-5">
          <div className="p-3.5 rounded-lg bg-primary/10 text-primary">
            <Award className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500">Total Templates</p>
            <p className="text-2xl font-bold text-slate-900">{stats.templatesCount}</p>
          </div>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm flex items-center gap-5">
          <div className="p-3.5 rounded-lg bg-primary/10 text-primary">
            <FileSpreadsheet className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500">Batches Run</p>
            <p className="text-2xl font-bold text-slate-900">{stats.batchesGenerated}</p>
          </div>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm flex items-center gap-5">
          <div className="p-3.5 rounded-lg bg-amber-50 text-amber-600">
            <Sparkles className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500">Certificates Issued</p>
            <p className="text-2xl font-bold text-slate-900">{stats.certificatesCount}</p>
          </div>
        </div>
      </div>

      {/* Custom templates section */}
      {customTemplates.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Clock className="w-5 h-5 text-primary" />
            Your Custom Templates ({customTemplates.length})
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {customTemplates.map((template) => (
              <div
                key={template.id}
                className="group bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all flex flex-col"
              >
                <div className="p-3 bg-slate-50 border-b border-slate-150 flex items-center justify-between">
                  <span className="font-semibold text-sm text-slate-700 truncate">
                    {template.name}
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => onDuplicateTemplate(template)}
                      title="Duplicate Template"
                      className="p-1 rounded text-slate-405 hover:text-primary hover:bg-primary/10 transition-colors"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => onDeleteCustomTemplate(template.id)}
                      title="Delete Custom Template"
                      className="p-1 rounded text-slate-405 hover:text-red-650 hover:bg-red-50 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
                <div className="p-4 flex-1 flex flex-col justify-between gap-4">
                  <MiniCertificatePreview template={template} />
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => onSelectTemplate(template, 'edit')}
                      className="px-3 py-1.5 rounded text-xs font-semibold border border-slate-200 hover:bg-slate-50 text-slate-700 transition-colors flex items-center justify-center gap-1"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      Customize
                    </button>
                    <button
                      onClick={() => onSelectTemplate(template, 'generate')}
                      className="px-3 py-1.5 rounded text-xs font-semibold bg-primary hover:bg-primary-hover text-white transition-colors flex items-center justify-center gap-1"
                    >
                      <FileSpreadsheet className="w-3.5 h-3.5" />
                      Bulk Issue
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Prebuilt gallery */}
      <div className="space-y-4">
        <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
          <Award className="w-5 h-5 text-primary" />
          Prebuilt Certificate Templates
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {prebuiltTemplates.map((template) => (
            <div
              key={template.id}
              className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all flex flex-col"
            >
              <div className="p-3 bg-slate-50 border-b border-slate-150 flex items-center justify-between">
                <span className="font-semibold text-sm text-slate-700 truncate">
                  {template.name}
                </span>
                <button
                  onClick={() => onDuplicateTemplate(template)}
                  title="Duplicate to Custom"
                  className="p-1 rounded text-slate-405 hover:text-primary hover:bg-primary/10 transition-colors"
                >
                  <Copy className="w-3.5 h-3.5" />
                </button>
              </div>
              <div className="p-4 flex-1 flex flex-col justify-between gap-4">
                <MiniCertificatePreview template={template} />
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => onSelectTemplate(template, 'edit')}
                    className="px-3 py-1.5 rounded text-xs font-semibold border border-slate-200 hover:bg-slate-50 text-slate-750 transition-colors flex items-center justify-center gap-1"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    Customize
                  </button>
                  <button
                    onClick={() => onSelectTemplate(template, 'generate')}
                    className="px-3 py-1.5 rounded text-xs font-semibold bg-primary hover:bg-primary-hover text-white transition-colors flex items-center justify-center gap-1"
                  >
                    <FileSpreadsheet className="w-3.5 h-3.5" />
                    Bulk Issue
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
