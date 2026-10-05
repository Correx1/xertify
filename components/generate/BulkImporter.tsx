/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useRef, useEffect } from 'react';
import { 
  ArrowLeft, FileSpreadsheet, Upload, Check, ChevronLeft, 
  ChevronRight, Loader2, Download, RefreshCw, FileText, Award, HelpCircle
} from '@/components/Icons';
import { CertificateTemplate, TextElement, ImageElement, BadgeElement } from '@/lib/types';
import { BadgeSvg } from '@/components/templates/BadgeSvg';
import { QrCodeSvg } from '@/components/templates/QrCodeSvg';
import { parseCSV } from '@/lib/csv';
import { svgToPngUrl, downloadFile } from '@/lib/export';

interface BulkImporterProps {
  template: CertificateTemplate;
  onBack: () => void;
  onBulkGenerated: (count: number) => void;
}

export const BulkImporter: React.FC<BulkImporterProps> = ({
  template,
  onBack,
  onBulkGenerated,
}) => {
  // Spreadsheet state
  const [csvData, setCsvData] = useState<string[][]>([]);
  const [csvHeaders, setCsvHeaders] = useState<string[]>([]);
  const [fileName, setFileName] = useState<string>('');
  
  // Mapping state: { [templateVariableKey]: csvHeaderIndex }
  const [mappings, setMappings] = useState<{ [key: string]: number }>({});
  
  // Interactive state
  const [activePreviewRow, setActivePreviewRow] = useState<number>(0);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [generationProgress, setGenerationProgress] = useState<number>(0);
  const [isPrintReady, setIsPrintReady] = useState<boolean>(false);
  const [printData, setPrintData] = useState<{ [key: string]: string }[]>([]);

  // Ref to the live preview SVG for exporting
  const previewSvgRef = useRef<SVGSVGElement>(null);

  // Extract all dynamic variable elements from the template
  const variableElements = template.elements.filter(
    el => el.type === 'text' && (el as TextElement).isVariable
  ) as TextElement[];

  // Handle CSV file upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
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

            // Auto-map columns based on header names matching variable keys
            const initialMappings: { [key: string]: number } = {};
            variableElements.forEach(el => {
              const key = el.variableKey || el.id;
              const cleanKey = key.toLowerCase().replace(/[\s_:-]+/g, '');
              const matchIndex = headers.findIndex(header => {
                const cleanHeader = header.toLowerCase().replace(/[\s_:-]+/g, '');
                return cleanHeader.includes(cleanKey) || cleanKey.includes(cleanHeader);
              });
              initialMappings[key] = matchIndex !== -1 ? matchIndex : 0;
            });
            setMappings(initialMappings);
          }
        }
      };
      reader.readAsText(file);
    }
  };

  const handleMappingChange = (variableKey: string, headerIndex: number) => {
    setMappings(prev => ({
      ...prev,
      [variableKey]: headerIndex
    }));
  };

  // Helper to replace text variable placeholders with CSV cell values
  const getMappedText = (el: TextElement, rowIndex: number): string => {
    let text = el.text;
    if (!csvData[rowIndex]) return text;

    const key = el.variableKey || el.id;
    const mappedHeaderIdx = mappings[key];
    
    if (mappedHeaderIdx !== undefined && csvData[rowIndex][mappedHeaderIdx] !== undefined) {
      const cellValue = csvData[rowIndex][mappedHeaderIdx];
      // Replace the entire placeholder template variable with the cell value
      // E.g. "{{recipient_name}}" becomes "John Doe"
      if (el.isVariable) {
        return cellValue;
      }
    }
    
    // Fallback: search and replace all curly brackets placeholders manually
    variableElements.forEach(vEl => {
      const vKey = vEl.variableKey || vEl.id;
      const hIdx = mappings[vKey];
      if (hIdx !== undefined && csvData[rowIndex][hIdx] !== undefined) {
        const val = csvData[rowIndex][hIdx];
        const placeholderRegex = new RegExp(`\\{\\{\\s*${vKey}\\s*\\}\\}`, 'gi');
        text = text.replace(placeholderRegex, val);
      }
    });

    return text;
  };

  // Export current certificate preview to high-res PNG
  const handleExportSingle = async () => {
    if (!previewSvgRef.current) return;
    
    try {
      const recipientName = csvData[activePreviewRow] 
        ? csvData[activePreviewRow][mappings['recipient_name'] || 0] 
        : 'preview';
        
      const pngUrl = await svgToPngUrl(previewSvgRef.current);
      downloadFile(pngUrl, `${recipientName.replace(/[\s_]+/g, '_')}_certificate.png`);
    } catch (err) {
      alert('Error rendering certificate: ' + (err as Error).message);
    }
  };

  // Loop sequential download of all PNGs
  const handleExportAllPng = async () => {
    if (csvData.length === 0) return;
    
    setIsGenerating(true);
    setGenerationProgress(0);
    
    // Help warning note for users on multiple downloads
    const confirmProceed = window.confirm(
      `This will sequentially download ${csvData.length} PNG certificates in your browser. \n\nPlease ensure your browser allows "Multiple Downloads" when prompted!`
    );
    
    if (!confirmProceed) {
      setIsGenerating(false);
      return;
    }

    try {
      for (let i = 0; i < csvData.length; i++) {
        setGenerationProgress(i + 1);
        setActivePreviewRow(i);
        
        // Let React render the DOM update first
        await new Promise(resolve => setTimeout(resolve, 350));
        
        if (previewSvgRef.current) {
          const recipientName = csvData[i][mappings['recipient_name'] || 0] || `row_${i+1}`;
          const pngUrl = await svgToPngUrl(previewSvgRef.current);
          downloadFile(pngUrl, `${recipientName.replace(/[\s_]+/g, '_')}_certificate.png`);
        }
      }
      
      onBulkGenerated(csvData.length);
      alert('Successfully downloaded all certificates!');
    } catch (err) {
      alert('Export halted: ' + (err as Error).message);
    } finally {
      setIsGenerating(false);
    }
  };

  // Prepares the print list and triggers browser window.print()
  const handlePrintAll = () => {
    if (csvData.length === 0) return;

    // Convert CSV rows to structured key-value arrays based on mappings
    const structuredPrintData = csvData.map(row => {
      const dataObj: { [key: string]: string } = {};
      
      // Inject standard variables
      variableElements.forEach(el => {
        const key = el.variableKey || el.id;
        const mappedIdx = mappings[key];
        dataObj[el.id] = row[mappedIdx] !== undefined ? row[mappedIdx] : el.text;
      });

      return dataObj;
    });

    setPrintData(structuredPrintData);
    setIsPrintReady(true);
  };

  // Once print data is loaded in the DOM, trigger printing immediately
  useEffect(() => {
    if (isPrintReady && printData.length > 0) {
      // Small timeout to let DOM render the print wrapper
      const timer = setTimeout(() => {
        window.print();
        setIsPrintReady(false);
        setPrintData([]);
        onBulkGenerated(csvData.length);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [isPrintReady, printData, onBulkGenerated, csvData.length]);

  // Main UI elements scale calculations
  const [scale, setScale] = useState(0.55);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleResize = () => {
      if (containerRef.current) {
        const w = containerRef.current.clientWidth;
        setScale(Math.min((w - 32) / 1120, 0.7));
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [csvData]);

  return (
    <div className="flex-1 w-full max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8 space-y-8 print:hidden">
      {/* Hidden Multi-Page print template container */}
      {isPrintReady && printData.length > 0 && (
        <div id="print-wrapper" className="hidden fixed inset-0 z-[9999] bg-white print:block">
          {printData.map((dataRow, idx) => (
            <div
              key={idx}
              className="print-page w-[1120px] h-[800px] relative overflow-hidden bg-white origin-top-left"
              style={{
                pageBreakAfter: 'always',
                backgroundColor: template.styles.backgroundColor,
                borderColor: template.styles.borderColor,
                borderWidth: `${template.styles.borderWidth}px`,
                borderStyle: template.styles.borderStyle === 'none' ? 'none' : 
                             template.styles.borderStyle === 'fancy' ? 'solid' : template.styles.borderStyle,
              }}
            >
              {template.styles.borderStyle === 'fancy' && (
                <div 
                  className="absolute inset-3 border-4 border-double rounded" 
                  style={{ borderColor: template.styles.accentColor }} 
                />
              )}
              {template.elements.map((el) => {
                if (!el.visible) return null;
                
                if (el.type === 'text') {
                  const txtEl = el as TextElement;
                  const textVal = dataRow[el.id] || txtEl.text;
                  return (
                    <div
                      key={el.id}
                      className="absolute flex flex-col justify-center leading-[1.2] whitespace-pre-wrap overflow-hidden"
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
                      }}
                    >
                      {textVal}
                    </div>
                  );
                }

                if (el.type === 'badge') {
                  const badgeEl = el as BadgeElement;
                  return (
                    <div
                      key={el.id}
                      className="absolute transform -translate-x-1/2 -translate-y-1/2"
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

                if (el.type === 'qrcode') {
                  return (
                    <div
                      key={el.id}
                      className="absolute bg-white p-1 rounded border border-zinc-200 transform -translate-x-1/2 -translate-y-1/2"
                      style={{
                        left: `${el.x}px`,
                        top: `${el.y}px`,
                        width: `${el.width}px`,
                        height: `${el.height}px`,
                      }}
                    >
                      <QrCodeSvg
                        value={(el as any).value || (el as any).src}
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
                      className="absolute flex flex-col items-center justify-center transform -translate-x-1/2 -translate-y-1/2 bg-transparent"
                      style={{
                        left: `${el.x}px`,
                        top: `${el.y}px`,
                        width: `${el.width}px`,
                        height: `${el.height}px`,
                      }}
                    >
                      {imgEl.src && (
                        /* eslint-disable-next-line @next/next/no-img-element */
                        <img src={imgEl.src} alt={el.type} className="max-w-full max-h-full object-contain" />
                      )}
                      {el.type === 'signature' && imgEl.label && (
                        <div className="absolute top-[calc(100%+4px)] left-0 w-full text-center text-[11px] font-sans text-zinc-500 font-medium">
                          {imgEl.label}
                        </div>
                      )}
                    </div>
                  );
                }
                return null;
              })}
            </div>
          ))}
        </div>
      )}

      {/* Header Back navigation */}
      <div className="flex items-center gap-3">
        <button 
          onClick={onBack}
          className="p-2 rounded-lg border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-zinc-600 dark:text-zinc-400" />
        </button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-white">Bulk Certificate Issuance</h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">Map fields, upload records, and generate batch credentials.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* LEFT COLUMN: SOURCE & MAPPING SETTINGS */}
        <div className="lg:col-span-1 space-y-6">
          
          {/* Section 1: File Upload */}
          <div className="bg-white dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800 rounded-xl p-5 space-y-4">
            <h2 className="text-sm font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider flex items-center gap-2">
              <FileSpreadsheet className="w-4 h-4 text-blue-500" />
              1. Import Recipient Data
            </h2>
            
            <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-900/40 rounded-lg cursor-pointer transition-colors relative overflow-hidden bg-zinc-50/20">
              <div className="flex flex-col items-center justify-center p-4 text-center">
                <Upload className="w-6 h-6 mb-2 text-zinc-400" />
                <p className="text-xs font-semibold text-zinc-650 dark:text-zinc-200">
                  {fileName ? `File: ${fileName}` : 'Choose CSV Spreadsheet'}
                </p>
                <p className="text-[10px] text-zinc-400 mt-1">Comma Separated Values (.csv)</p>
              </div>
              <input 
                type="file" 
                accept=".csv" 
                onChange={handleFileUpload} 
                className="hidden" 
              />
            </label>

            {csvData.length > 0 && (
              <div className="flex items-center gap-2 text-xs font-semibold text-emerald-600 dark:text-emerald-450 bg-emerald-50/30 dark:bg-emerald-950/20 p-2.5 rounded-lg border border-emerald-200/50">
                <Check className="w-4 h-4" />
                Successfully loaded {csvData.length} records!
              </div>
            )}
            
            <div className="p-3 bg-zinc-50 dark:bg-zinc-800/40 rounded-lg border border-zinc-150 dark:border-zinc-800 text-[10px] text-zinc-400 leading-relaxed flex gap-2">
              <HelpCircle className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-zinc-650 dark:text-zinc-350">Tip for Excel:</span> Save Excel sheets as <span className="font-semibold text-zinc-650 dark:text-zinc-350">CSV UTF-8 (Comma delimited) (.csv)</span> in Microsoft Excel (File → Save As) before uploading.
              </div>
            </div>
          </div>

          {/* Section 2: Variable Mapper */}
          {csvHeaders.length > 0 && (
            <div className="bg-white dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800 rounded-xl p-5 space-y-4">
              <h2 className="text-sm font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider flex items-center gap-2">
                <RefreshCw className="w-4 h-4 text-indigo-500" />
                2. Map Certificate Variables
              </h2>
              <p className="text-[10px] text-zinc-400">Match the dynamic fields from your certificate template with the columns from your sheet:</p>
              
              <div className="space-y-3">
                {variableElements.map((el) => {
                  const key = el.variableKey || el.id;
                  return (
                    <div key={el.id} className="space-y-1">
                      <div className="flex justify-between text-[10px] font-bold text-zinc-600 dark:text-zinc-300">
                        <span className="capitalize font-mono">{"{{"}{key}{"}}"}</span>
                        <span className="text-[9px] text-zinc-450 uppercase font-sans">mapped to</span>
                      </div>
                      <select
                        value={mappings[key] !== undefined ? mappings[key] : 0}
                        onChange={(e) => handleMappingChange(key, parseInt(e.target.value))}
                        className="w-full text-xs p-2 border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 rounded-md focus:outline-none dark:text-white cursor-pointer"
                      >
                        {csvHeaders.map((header, idx) => (
                          <option key={idx} value={idx}>{header}</option>
                        ))}
                      </select>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Section 3: Generator Engine Controls */}
          {csvData.length > 0 && (
            <div className="bg-white dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800 rounded-xl p-5 space-y-3">
              <h2 className="text-sm font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider flex items-center gap-2">
                <Download className="w-4 h-4 text-emerald-500" />
                3. Download Options
              </h2>
              
              {isGenerating ? (
                <div className="space-y-2.5 py-2">
                  <div className="flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400 font-semibold">
                    <span className="flex items-center gap-1.5">
                      <Loader2 className="w-3.5 h-3.5" />
                      Downloading batches...
                    </span>
                    <span className="font-mono">{generationProgress} / {csvData.length}</span>
                  </div>
                  <div className="w-full bg-zinc-250 dark:bg-zinc-800 h-2 rounded-full overflow-hidden">
                    <div 
                      className="bg-indigo-600 h-full rounded-full transition-all duration-300"
                      style={{ width: `${(generationProgress / csvData.length) * 100}%` }}
                    />
                  </div>
                </div>
              ) : (
                <div className="space-y-2 pt-2">
                  {/* Save as Combined PDF */}
                  <button
                    onClick={handlePrintAll}
                    className="w-full py-2.5 bg-zinc-900 hover:bg-black dark:bg-white dark:hover:bg-zinc-50 text-white dark:text-black font-semibold rounded-lg text-xs transition-all flex items-center justify-center gap-1.5 shadow-sm"
                  >
                    <FileText className="w-4 h-4" />
                    Print / Save All as PDF
                  </button>
                  
                  {/* Save as individual PNGs */}
                  <button
                    onClick={handleExportAllPng}
                    className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg text-xs transition-all flex items-center justify-center gap-1.5 shadow-sm"
                  >
                    <Download className="w-4 h-4" />
                    Download All as PNGs
                  </button>
                  
                  <p className="text-[9px] text-zinc-400 text-center leading-relaxed">
                    &quot;Print / Save PDF&quot; lets you export a single combined multi-page document natively using your browser (e.g. Save as PDF) in vector-perfect detail!
                  </p>
                </div>
              )}
            </div>
          )}

        </div>

        {/* RIGHT COLUMN: LIVE WORKSPACE PREVIEW ROW BY ROW */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800 rounded-xl p-5 flex flex-col justify-between min-h-[480px]">
            <div>
              {/* Toolbar preview pagination */}
              <div className="flex justify-between items-center pb-4 border-b border-zinc-200 dark:border-zinc-800 mb-6">
                <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-650 dark:text-zinc-300 flex items-center gap-2">
                  <Award className="w-4 h-4 text-indigo-500" />
                  Realtime Batch Render Preview
                </h3>
                
                {csvData.length > 0 && (
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setActivePreviewRow(prev => Math.max(0, prev - 1))}
                      disabled={activePreviewRow === 0}
                      className="p-1 rounded border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-900 disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <span className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
                      Row <span className="font-mono">{activePreviewRow + 1}</span> of <span className="font-mono">{csvData.length}</span>
                    </span>
                    <button
                      onClick={() => setActivePreviewRow(prev => Math.min(csvData.length - 1, prev + 1))}
                      disabled={activePreviewRow === csvData.length - 1}
                      className="p-1 rounded border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-900 disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>

              {/* Mapped Recipient Detail Card */}
              {csvData.length > 0 && (
                <div className="p-3 bg-zinc-50 dark:bg-zinc-900 border border-zinc-150 dark:border-zinc-800 rounded-lg text-xs space-y-1.5 mb-6">
                  <div className="flex justify-between">
                    <span className="font-semibold text-zinc-450">Active Row Index:</span>
                    <span className="font-bold text-zinc-700 dark:text-zinc-300 font-mono">{activePreviewRow + 1}</span>
                  </div>
                  {variableElements.map(el => {
                    const key = el.variableKey || el.id;
                    const val = getMappedText(el, activePreviewRow);
                    return (
                      <div key={el.id} className="flex justify-between truncate">
                        <span className="font-semibold text-zinc-450 capitalize truncate mr-2">{key.replace(/_/g, ' ')}:</span>
                        <span className="font-bold text-indigo-600 dark:text-indigo-400 truncate">{val}</span>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Canvas viewport container */}
              <div 
                ref={containerRef}
                className="w-full overflow-hidden flex items-center justify-center p-4 bg-zinc-100 dark:bg-[#121214] rounded-lg border border-zinc-200 dark:border-zinc-800"
              >
                {/* SVG Live Certificate Canvas */}
                <svg
                  ref={previewSvgRef}
                  id="certificate-svg-canvas"
                  width="1120"
                  height="800"
                  viewBox="0 0 1120 800"
                  className="bg-white shadow-lg transition-transform"
                  style={{
                    transform: `scale(${scale})`,
                    transformOrigin: 'center center',
                    borderStyle: template.styles.borderStyle === 'none' ? 'none' : 
                                 template.styles.borderStyle === 'fancy' ? 'solid' : template.styles.borderStyle,
                    borderWidth: `${template.styles.borderWidth}px`,
                    borderColor: template.styles.borderColor,
                    backgroundColor: template.styles.backgroundColor,
                    overflow: 'hidden',
                  }}
                >
                  {/* Ornate border overlay */}
                  {template.styles.borderStyle === 'fancy' && (
                    <rect 
                      x="14" 
                      y="14" 
                      width="1092" 
                      height="772" 
                      fill="none" 
                      stroke={template.styles.accentColor} 
                      strokeWidth="4" 
                      strokeDasharray="16 8"
                    />
                  )}

                  {/* Render Elements */}
                  {template.elements.map((el) => {
                    if (!el.visible) return null;

                    // 1. Text node
                    if (el.type === 'text') {
                      const txtEl = el as TextElement;
                      const displayedText = csvData.length > 0 
                        ? getMappedText(txtEl, activePreviewRow) 
                        : txtEl.text;
                        
                      // Since SVG text doesn't auto-wrap well, we split text by newline manually 
                      // and render tspans dynamically
                      const lines = displayedText.split('\n');
                      const startY = el.y - ((lines.length - 1) * txtEl.style.fontSize * 1.25) / 2;

                      return (
                        <text
                          key={el.id}
                          x={el.x}
                          y={startY}
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
                          style={{ textTransform: txtEl.style.uppercase ? 'uppercase' : 'none' }}
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

                    // 2. Badge Emblem node
                    if (el.type === 'badge') {
                      const badgeEl = el as BadgeElement;
                      // Offset x and y by 50 to center svg correctly since BadgeSvg is viewBox 0 0 100 100
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

                    // 4. QR Code node
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
                            value={(el as any).value || (el as any).src}
                            width={100}
                            height={100}
                          />
                        </svg>
                      );
                    }

                    // 3. Image / Signature node
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
              </div>
            </div>

            {/* Single certificate export utilities */}
            {csvData.length > 0 && (
              <div className="flex gap-3 justify-end pt-4 border-t border-zinc-200 dark:border-zinc-800 mt-6">
                <button
                  onClick={handleExportSingle}
                  className="px-4 py-2 border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-950 rounded-lg text-xs font-semibold text-zinc-700 dark:text-zinc-300 transition-colors flex items-center gap-1.5"
                >
                  <Download className="w-3.5 h-3.5" />
                  Download PNG (Active)
                </button>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};
