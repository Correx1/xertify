import React, { useState, useRef, useEffect } from 'react';
import { 
  ArrowLeft, Palette, Type, ImageIcon, Award, Trash2, 
  Copy, Layers, Move, Settings, Upload, HelpCircle, 
  AlignLeft, AlignCenter, AlignRight, Bold, Italic, Type as FontIcon,
  Sliders, Play, Plus
} from '@/components/Icons';
import { CertificateTemplate, CanvasElement, TextElement, ImageElement, BadgeElement, QrCodeElement } from '@/lib/types';
import { BadgeSvg } from '@/components/templates/BadgeSvg';
import { QrCodeSvg } from '@/components/templates/QrCodeSvg';
import { GOOGLE_FONTS } from '@/lib/templates';

interface EditorProps {
  initialTemplate: CertificateTemplate;
  onBack: () => void;
  onSaveTemplate: (template: CertificateTemplate) => void;
  onNavigateToBulk: (template: CertificateTemplate) => void;
  csvHeaders: string[]; // To select variables from CSV mapping
}

export const Editor: React.FC<EditorProps> = ({
  initialTemplate,
  onBack,
  onSaveTemplate,
  onNavigateToBulk,
  csvHeaders = [],
}) => {
  const [template, setTemplate] = useState<CertificateTemplate>(initialTemplate);
  const [selectedElementId, setSelectedElementId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'canvas' | 'add' | 'layers'>('canvas');
  
  // Drag and drop state
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ pointerX: 0, pointerY: 0, elX: 0, elY: 0 });
  
  // Resize state
  const [isResizing, setIsResizing] = useState(false);
  const [resizeStart, setResizeStart] = useState({ pointerX: 0, pointerY: 0, width: 0, height: 0 });

  // Canvas scaling relative to container
  const canvasContainerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0.7);

  // Snapping and Zoom States
  const [snapLines, setSnapLines] = useState<{ x: number | null; y: number | null }>({ x: null, y: null });
  const [zoomMode, setZoomMode] = useState<'auto' | 'manual'>('auto');

  // Auto-fit canvas to container size
  useEffect(() => {
    if (zoomMode !== 'auto') return;
    const handleResize = () => {
      if (canvasContainerRef.current) {
        const containerWidth = canvasContainerRef.current.clientWidth;
        const containerHeight = canvasContainerRef.current.clientHeight;
        
        // Target: 1120x800 canvas
        const scaleX = (containerWidth - 48) / 1120;
        const scaleY = (containerHeight - 48) / 800;
        
        // Take the smaller scale to fit both width and height, capped at 1
        setScale(Math.min(scaleX, scaleY, 1.2));
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    
    // Add small delay to account for layout shifts
    const timer = setTimeout(handleResize, 150);
    
    return () => {
      window.removeEventListener('resize', handleResize);
      clearTimeout(timer);
    };
  }, [zoomMode]);

  const selectedElement = template.elements.find(el => el.id === selectedElementId);

  // Update a single element in the template
  const updateElement = (id: string, updates: Partial<CanvasElement>) => {
    setTemplate(prev => ({
      ...prev,
      elements: prev.elements.map(el => {
        if (el.id === id) {
          return { ...el, ...updates } as CanvasElement;
        }
        return el;
      })
    }));
  };

  // Add a new element to the canvas
  const addElement = (type: 'text' | 'image' | 'signature' | 'badge' | 'qrcode') => {
    const id = `${type}_${Date.now()}`;
    let newElement: CanvasElement;

    if (type === 'text') {
      newElement = {
        id,
        type: 'text',
        x: 560,
        y: 400,
        width: 400,
        height: 60,
        visible: true,
        text: 'New Text Box',
        style: {
          fontSize: 20,
          fontWeight: 'normal',
          fontStyle: 'normal',
          fontFamily: 'Inter',
          color: '#111827',
          align: 'center',
          uppercase: false,
          letterSpacing: 0,
        },
        isVariable: false,
      };
    } else if (type === 'badge') {
      newElement = {
        id,
        type: 'badge',
        x: 560,
        y: 600,
        width: 90,
        height: 90,
        visible: true,
        badgeType: 'gold_seal',
        color: template.styles.accentColor || '#d97706',
      };
    } else if (type === 'signature') {
      newElement = {
        id,
        type: 'signature',
        x: 800,
        y: 600,
        width: 180,
        height: 60,
        visible: true,
        src: '', // Empty base64
        label: 'Authorized Signatory',
      };
    } else if (type === 'qrcode') {
      newElement = {
        id,
        type: 'qrcode',
        x: 950,
        y: 600,
        width: 80,
        height: 80,
        visible: true,
      } as QrCodeElement;
    } else {
      newElement = {
        id,
        type: 'image',
        x: 200,
        y: 200,
        width: 120,
        height: 120,
        visible: true,
        src: '', // Empty base64
      };
    }

    setTemplate(prev => ({
      ...prev,
      elements: [...prev.elements, newElement]
    }));
    setSelectedElementId(id);
  };

  // Duplicate the selected element
  const duplicateElement = (el: CanvasElement) => {
    const newId = `${el.type}_${Date.now()}`;
    const newEl = {
      ...el,
      id: newId,
      x: el.x + 30, // Offset slightly
      y: el.y + 30,
    };
    setTemplate(prev => ({
      ...prev,
      elements: [...prev.elements, newEl]
    }));
    setSelectedElementId(newId);
  };

  // Delete an element
  const deleteElement = (id: string) => {
    setTemplate(prev => ({
      ...prev,
      elements: prev.elements.filter(el => el.id !== id)
    }));
    if (selectedElementId === id) {
      setSelectedElementId(null);
    }
  };

  // Handle Drag Pointer Down
  const handlePointerDown = (e: React.PointerEvent, el: CanvasElement) => {
    if (isResizing) return;
    
    e.stopPropagation();
    setSelectedElementId(el.id);
    setIsDragging(true);
    
    // Set dragging anchor values
    setDragStart({
      pointerX: e.clientX,
      pointerY: e.clientY,
      elX: el.x,
      elY: el.y
    });

    e.currentTarget.setPointerCapture(e.pointerId);
  };

  // Handle Drag Pointer Move
  const handlePointerMove = (e: React.PointerEvent, el: CanvasElement) => {
    if (!isDragging || selectedElementId !== el.id) return;
    
    e.stopPropagation();
    
    const deltaX = e.clientX - dragStart.pointerX;
    const deltaY = e.clientY - dragStart.pointerY;
    
    // Convert screen pointer movements back to scaled canvas coordinates
    const scaledDeltaX = Math.round(deltaX / scale);
    const scaledDeltaY = Math.round(deltaY / scale);
    
    let newX = dragStart.elX + scaledDeltaX;
    let newY = dragStart.elY + scaledDeltaY;
    
    // Snapping Logic
    let snappedX: number | null = null;
    let snappedY: number | null = null;
    const snapThreshold = 8; // Snap range in pixels
    
    // Snap to horizontal center of canvas (1120 / 2 = 560)
    if (Math.abs(newX - 560) < snapThreshold) {
      newX = 560;
      snappedX = 560;
    }
    // Snap to vertical center of canvas (800 / 2 = 400)
    if (Math.abs(newY - 400) < snapThreshold) {
      newY = 400;
      snappedY = 400;
    }
    
    // Snap to other elements' coordinates
    template.elements.forEach((otherEl) => {
      if (otherEl.id === el.id || !otherEl.visible) return;
      
      // Snap X alignment
      if (snappedX === null && Math.abs(newX - otherEl.x) < snapThreshold) {
        newX = otherEl.x;
        snappedX = otherEl.x;
      }
      // Snap Y alignment
      if (snappedY === null && Math.abs(newY - otherEl.y) < snapThreshold) {
        newY = otherEl.y;
        snappedY = otherEl.y;
      }
    });
    
    setSnapLines({ x: snappedX, y: snappedY });
    
    // Keep centers within bounds (1120x800)
    newX = Math.max(20, Math.min(1100, newX));
    newY = Math.max(20, Math.min(780, newY));
    
    updateElement(el.id, { x: newX, y: newY });
  };

  // Handle Drag Pointer Up
  const handlePointerUp = (e: React.PointerEvent) => {
    setIsDragging(false);
    setSnapLines({ x: null, y: null });
    e.currentTarget.releasePointerCapture(e.pointerId);
  };

  // Handle Resize Pointer Down
  const handleResizeDown = (e: React.PointerEvent, el: CanvasElement) => {
    e.stopPropagation();
    setIsResizing(true);
    setSelectedElementId(el.id);
    
    setResizeStart({
      pointerX: e.clientX,
      pointerY: e.clientY,
      width: el.width,
      height: el.height
    });

    e.currentTarget.setPointerCapture(e.pointerId);
  };

  // Handle Resize Pointer Move
  const handleResizeMove = (e: React.PointerEvent, el: CanvasElement) => {
    if (!isResizing || selectedElementId !== el.id) return;
    
    e.stopPropagation();
    
    const deltaX = e.clientX - resizeStart.pointerX;
    const deltaY = e.clientY - resizeStart.pointerY;
    
    const scaledDeltaX = Math.round(deltaX / scale);
    const scaledDeltaY = Math.round(deltaY / scale);
    
    // For symmetric resize: user drags bottom-right corner, we update width/height
    const newWidth = Math.max(30, resizeStart.width + scaledDeltaX * 2);
    const newHeight = Math.max(15, resizeStart.height + scaledDeltaY * 2);
    
    updateElement(el.id, { width: newWidth, height: newHeight });
  };

  // Handle Resize Pointer Up
  const handleResizeUp = (e: React.PointerEvent) => {
    setIsResizing(false);
    e.currentTarget.releasePointerCapture(e.pointerId);
  };

  // File to Base64 helper
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, elId: string) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          updateElement(elId, { src: event.target.result as string });
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // Layer Arrangement: Bring to Front / Send to Back
  const arrangeLayer = (action: 'front' | 'back', elId: string) => {
    setTemplate(prev => {
      const elIndex = prev.elements.findIndex(el => el.id === elId);
      if (elIndex === -1) return prev;
      
      const elementsCopy = [...prev.elements];
      const targetElement = elementsCopy[elIndex];
      elementsCopy.splice(elIndex, 1);
      
      if (action === 'front') {
        elementsCopy.push(targetElement); // Appended last = renders last = top layer
      } else {
        elementsCopy.unshift(targetElement); // Appended first = renders first = bottom layer
      }
      
      return { ...prev, elements: elementsCopy };
    });
  };

  return (
    <div className="flex-1 flex flex-col md:flex-row h-[calc(100vh-64px)] w-full overflow-hidden bg-zinc-50 dark:bg-[#09090b]">
      {/* Editor Sidebar Left */}
      <div className="w-full md:w-80 border-r border-zinc-200 dark:border-zinc-800 flex flex-col bg-white dark:bg-zinc-950 shrink-0">
        {/* Back header */}
        <div className="p-4 border-b border-zinc-200 dark:border-zinc-800 flex items-center gap-3">
          <button 
            onClick={onBack}
            className="p-1.5 rounded-lg border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 text-zinc-600 dark:text-zinc-400" />
          </button>
          <div>
            <h2 className="text-sm font-semibold text-zinc-900 dark:text-white truncate max-w-[150px]">
              {template.name}
            </h2>
            <p className="text-[10px] text-zinc-400 font-medium">Design & Layout Editor</p>
          </div>
        </div>

        {/* Tab Selection */}
        <div className="flex border-b border-zinc-200 dark:border-zinc-800 p-2 gap-1 bg-zinc-50/50 dark:bg-zinc-900/10">
          <button
            onClick={() => setActiveTab('canvas')}
            className={`flex-1 py-1.5 rounded-md text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors ${
              activeTab === 'canvas' 
                ? 'bg-white dark:bg-zinc-900 shadow-sm border border-zinc-200/60 dark:border-zinc-850 text-indigo-600 dark:text-indigo-400' 
                : 'text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 hover:bg-zinc-100/55 dark:hover:bg-zinc-900/30'
            }`}
          >
            <Palette className="w-3.5 h-3.5" />
            Style
          </button>
          <button
            onClick={() => setActiveTab('add')}
            className={`flex-1 py-1.5 rounded-md text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors ${
              activeTab === 'add' 
                ? 'bg-white dark:bg-zinc-900 shadow-sm border border-zinc-200/60 dark:border-zinc-850 text-indigo-600 dark:text-indigo-400' 
                : 'text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 hover:bg-zinc-100/55 dark:hover:bg-zinc-900/30'
            }`}
          >
            <Plus className="w-3.5 h-3.5" />
            Add
          </button>
          <button
            onClick={() => setActiveTab('layers')}
            className={`flex-1 py-1.5 rounded-md text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors ${
              activeTab === 'layers' 
                ? 'bg-white dark:bg-zinc-900 shadow-sm border border-zinc-200/60 dark:border-zinc-850 text-indigo-600 dark:text-indigo-400' 
                : 'text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 hover:bg-zinc-100/55 dark:hover:bg-zinc-900/30'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            Layers
          </button>
        </div>

        {/* Tab Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-5">
          {/* TAB 1: CANVAS GLOBAL STYLE */}
          {activeTab === 'canvas' && (
            <div className="space-y-4">
              {/* Template Name Input */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Template Name</label>
                <input
                  type="text"
                  value={template.name}
                  onChange={(e) => setTemplate(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full text-sm px-3 py-2 border border-zinc-200 dark:border-zinc-800 rounded-lg bg-zinc-50 dark:bg-zinc-900 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:text-white"
                />
              </div>

              {/* Background Color */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Background Color</label>
                <div className="flex gap-2 items-center">
                  <input
                    type="color"
                    value={template.styles.backgroundColor}
                    onChange={(e) => setTemplate(prev => ({
                      ...prev,
                      styles: { ...prev.styles, backgroundColor: e.target.value }
                    }))}
                    className="w-8 h-8 rounded border border-zinc-200 dark:border-zinc-800 cursor-pointer overflow-hidden p-0 bg-transparent"
                  />
                  <input
                    type="text"
                    value={template.styles.backgroundColor}
                    onChange={(e) => setTemplate(prev => ({
                      ...prev,
                      styles: { ...prev.styles, backgroundColor: e.target.value }
                    }))}
                    className="flex-1 text-xs px-2.5 py-1.5 border border-zinc-200 dark:border-zinc-800 rounded bg-zinc-50 dark:bg-zinc-900 uppercase font-mono dark:text-white"
                  />
                </div>
              </div>

              {/* Border Color */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Border Color</label>
                <div className="flex gap-2 items-center">
                  <input
                    type="color"
                    value={template.styles.borderColor}
                    onChange={(e) => setTemplate(prev => ({
                      ...prev,
                      styles: { ...prev.styles, borderColor: e.target.value }
                    }))}
                    className="w-8 h-8 rounded border border-zinc-200 dark:border-zinc-800 cursor-pointer overflow-hidden p-0 bg-transparent"
                  />
                  <input
                    type="text"
                    value={template.styles.borderColor}
                    onChange={(e) => setTemplate(prev => ({
                      ...prev,
                      styles: { ...prev.styles, borderColor: e.target.value }
                    }))}
                    className="flex-1 text-xs px-2.5 py-1.5 border border-zinc-200 dark:border-zinc-800 rounded bg-zinc-50 dark:bg-zinc-900 uppercase font-mono dark:text-white"
                  />
                </div>
              </div>

              {/* Border Width */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                  <span>Border Width</span>
                  <span className="font-mono">{template.styles.borderWidth}px</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="40"
                  value={template.styles.borderWidth}
                  onChange={(e) => setTemplate(prev => ({
                    ...prev,
                    styles: { ...prev.styles, borderWidth: parseInt(e.target.value) }
                  }))}
                  className="w-full h-1 bg-zinc-200 dark:bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                />
              </div>

              {/* Border Style */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Border Style</label>
                <select
                  value={template.styles.borderStyle}
                  onChange={(e) => setTemplate(prev => ({
                    ...prev,
                    styles: { ...prev.styles, borderStyle: e.target.value as 'solid' | 'double' | 'fancy' | 'none' }
                  }))}
                  className="w-full text-xs p-2 border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:text-white"
                >
                  <option value="solid">Solid Frame</option>
                  <option value="double">Double Frame</option>
                  <option value="fancy">Ornate / Ribbon</option>
                  <option value="none">No Border</option>
                </select>
              </div>

              {/* Accent Theme Color */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Accent Emblem Color</label>
                <div className="flex gap-2 items-center">
                  <input
                    type="color"
                    value={template.styles.accentColor}
                    onChange={(e) => setTemplate(prev => ({
                      ...prev,
                      styles: { ...prev.styles, accentColor: e.target.value }
                    }))}
                    className="w-8 h-8 rounded border border-zinc-200 dark:border-zinc-800 cursor-pointer overflow-hidden p-0 bg-transparent"
                  />
                  <input
                    type="text"
                    value={template.styles.accentColor}
                    onChange={(e) => setTemplate(prev => ({
                      ...prev,
                      styles: { ...prev.styles, accentColor: e.target.value }
                    }))}
                    className="flex-1 text-xs px-2.5 py-1.5 border border-zinc-200 dark:border-zinc-800 rounded bg-zinc-50 dark:bg-zinc-900 uppercase font-mono dark:text-white"
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: ADD ELEMENTS */}
          {activeTab === 'add' && (
            <div className="space-y-3">
              <p className="text-xs text-zinc-400 font-medium">Click to inject new custom elements into the center of the certificate:</p>
              
              <button
                onClick={() => addElement('text')}
                className="w-full py-2.5 px-3 rounded-lg border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-colors flex items-center gap-3 text-left"
              >
                <div className="p-2 rounded bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400">
                  <Type className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-semibold text-zinc-850 dark:text-zinc-200">Text Element</div>
                  <div className="text-[9px] text-zinc-400">For titles, fields, descriptions</div>
                </div>
              </button>

              <button
                onClick={() => addElement('badge')}
                className="w-full py-2.5 px-3 rounded-lg border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-colors flex items-center gap-3 text-left"
              >
                <div className="p-2 rounded bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400">
                  <Award className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-semibold text-zinc-850 dark:text-zinc-200">Emblem Seal</div>
                  <div className="text-[9px] text-zinc-400">Gold seal, star, laurel trophy</div>
                </div>
              </button>

              <button
                onClick={() => addElement('signature')}
                className="w-full py-2.5 px-3 rounded-lg border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-colors flex items-center gap-3 text-left"
              >
                <div className="p-2 rounded bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400">
                  <FontIcon className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-semibold text-zinc-850 dark:text-zinc-200">Signature Block</div>
                  <div className="text-[9px] text-zinc-400">Upload signature graphic</div>
                </div>
              </button>

              <button
                onClick={() => addElement('image')}
                className="w-full py-2.5 px-3 rounded-lg border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-colors flex items-center gap-3 text-left"
              >
                <div className="p-2 rounded bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400">
                  <ImageIcon className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-semibold text-zinc-850 dark:text-zinc-200">Logo or Image</div>
                  <div className="text-[9px] text-zinc-400">Upload school or corp logo</div>
                </div>
              </button>

              <button
                onClick={() => addElement('qrcode')}
                className="w-full py-2.5 px-3 rounded-lg border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-colors flex items-center gap-3 text-left"
              >
                <div className="p-2 rounded bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400">
                  <Award className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-semibold text-zinc-850 dark:text-zinc-200">Verification QR Code</div>
                  <div className="text-[9px] text-zinc-400">Add secure verification QR scan</div>
                </div>
              </button>
            </div>
          )}

          {/* TAB 3: LAYERS / ELEMENTS LIST */}
          {activeTab === 'layers' && (
            <div className="space-y-2">
              {template.elements.length === 0 ? (
                <p className="text-xs text-zinc-400 text-center py-4">No elements on canvas</p>
              ) : (
                template.elements.map((el) => (
                  <div 
                    key={el.id}
                    onClick={() => setSelectedElementId(el.id)}
                    className={`p-2.5 rounded-lg border text-xs flex items-center justify-between cursor-pointer transition-colors ${
                      selectedElementId === el.id
                        ? 'border-indigo-500 bg-indigo-50/30 dark:bg-indigo-900/10'
                        : 'border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-900/40'
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate">
                      <Move className="w-3 h-3 text-zinc-400 shrink-0" />
                      <span className="font-semibold text-zinc-800 dark:text-zinc-300 capitalize text-[10px] bg-zinc-100 dark:bg-zinc-800 px-1 py-0.5 rounded">
                        {el.type}
                      </span>
                      <span className="text-zinc-650 dark:text-zinc-400 truncate">
                        {el.type === 'text' 
                          ? (el as TextElement).text.substring(0, 15) || 'Empty text' 
                          : el.type === 'badge' 
                          ? (el as BadgeElement).badgeType 
                          : el.type === 'qrcode'
                          ? 'QR Code'
                          : 'Uploaded graphic'}
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-1">
                      <button
                        onClick={(e) => { e.stopPropagation(); arrangeLayer('front', el.id); }}
                        title="Bring to Front"
                        className="p-1 rounded hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-400 hover:text-zinc-600"
                      >
                        ▲
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); arrangeLayer('back', el.id); }}
                        title="Send to Back"
                        className="p-1 rounded hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-400 hover:text-zinc-600"
                      >
                        ▼
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); deleteElement(el.id); }}
                        title="Delete Element"
                        className="p-1 rounded hover:bg-red-50 dark:hover:bg-red-900/20 text-zinc-400 hover:text-red-650"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {/* Footer save/execute actions */}
        <div className="p-4 border-t border-zinc-200 dark:border-zinc-800 flex flex-col gap-2 bg-zinc-50/40 dark:bg-zinc-950/20">
          <button
            onClick={() => onSaveTemplate(template)}
            className="w-full py-2 bg-zinc-900 hover:bg-black dark:bg-white dark:hover:bg-zinc-100 text-white dark:text-black font-semibold rounded-lg text-xs transition-all flex items-center justify-center gap-1.5 shadow-sm"
          >
            Save Template
          </button>
          <button
            onClick={() => onNavigateToBulk(template)}
            className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg text-xs transition-all flex items-center justify-center gap-1.5 shadow-md shadow-indigo-650/10"
          >
            <Play className="w-3.5 h-3.5" />
            Proceed to Bulk Issue
          </button>
        </div>
      </div>

      {/* Editor Center Workspace */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Canvas Toolbar Info */}
        <div className="px-6 py-3 border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 flex justify-between items-center text-xs text-zinc-500 dark:text-zinc-400">
          <div className="flex items-center gap-4">
            <span className="font-semibold text-zinc-800 dark:text-zinc-300">Workspace Resolution: <span className="font-mono">1120 x 800 (Letter Ratio)</span></span>
            <span className="text-zinc-300 dark:text-zinc-800">|</span>
            <span>Scale: <span className="font-mono">{Math.round(scale * 100)}%</span></span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[10px] text-zinc-400 font-medium">Click / Drag nodes to position</span>
          </div>
        </div>

        {/* Canvas Viewport */}
        <div 
          ref={canvasContainerRef}
          onClick={() => setSelectedElementId(null)}
          className="flex-1 overflow-auto p-6 flex items-start justify-center bg-zinc-100 dark:bg-[#121214] min-h-0 relative"
        >
          {/* Certificate Container Node */}
          <div
            id="certificate-canvas-container"
            className="relative select-none shadow-2xl rounded transition-shadow bg-white origin-top-left"
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
            {/* Snap Guideline Overlay Lines */}
            {snapLines.x !== null && (
              <div 
                className="absolute top-0 bottom-0 border-l border-dashed border-indigo-500 pointer-events-none z-50"
                style={{ left: `${snapLines.x}px` }}
              />
            )}
            {snapLines.y !== null && (
              <div 
                className="absolute left-0 right-0 border-t border-dashed border-indigo-500 pointer-events-none z-50"
                style={{ top: `${snapLines.y}px` }}
              />
            )}
            {/* Ornate fancy border decoration */}
            {template.styles.borderStyle === 'fancy' && (
              <div 
                className="absolute inset-3 border-4 border-double rounded" 
                style={{ borderColor: template.styles.accentColor }} 
              />
            )}

            {/* Elements renderer */}
            {template.elements.map((el) => {
              if (!el.visible) return null;
              const isSelected = selectedElementId === el.id;

              return (
                <div
                  key={el.id}
                  onPointerDown={(e) => handlePointerDown(e, el)}
                  onPointerMove={(e) => handlePointerMove(e, el)}
                  onPointerUp={handlePointerUp}
                  onClick={(e) => { e.stopPropagation(); setSelectedElementId(el.id); }}
                  className={`absolute touch-none cursor-move group flex flex-col justify-center ${
                    isSelected ? 'ring-2 ring-indigo-500' : 'hover:ring-1 hover:ring-zinc-350 dark:hover:ring-zinc-650'
                  }`}
                  style={{
                    left: `${el.x - el.width / 2}px`,
                    top: `${el.y - el.height / 2}px`,
                    width: `${el.width}px`,
                    height: `${el.height}px`,
                  }}
                >
                  {/* TEXT NODE */}
                  {el.type === 'text' && (
                    <div
                      className="w-full h-full whitespace-pre-wrap overflow-hidden leading-[1.2]"
                      style={{
                        fontFamily: (el as TextElement).style.fontFamily,
                        fontSize: `${(el as TextElement).style.fontSize}px`,
                        fontWeight: (el as TextElement).style.fontWeight,
                        fontStyle: (el as TextElement).style.fontStyle,
                        color: (el as TextElement).style.color,
                        textAlign: (el as TextElement).style.align,
                        letterSpacing: `${(el as TextElement).style.letterSpacing}px`,
                        textTransform: (el as TextElement).style.uppercase ? 'uppercase' : 'none',
                      }}
                    >
                      {(el as TextElement).text}
                    </div>
                  )}

                  {/* BADGE NODE */}
                  {el.type === 'badge' && (
                    <div className="w-full h-full flex items-center justify-center">
                      <BadgeSvg
                        badgeType={(el as BadgeElement).badgeType}
                        color={(el as BadgeElement).color}
                        width={el.width}
                        height={el.height}
                      />
                    </div>
                  )}

                  {/* QR CODE NODE */}
                  {el.type === 'qrcode' && (
                    <div className="w-full h-full flex items-center justify-center bg-white p-1 rounded border border-zinc-200">
                      <QrCodeSvg
                        width={el.width}
                        height={el.height}
                      />
                    </div>
                  )}

                  {/* SIGNATURE / IMAGE NODE */}
                  {(el.type === 'image' || el.type === 'signature') && (
                    <div className="w-full h-full flex flex-col items-center justify-center relative bg-transparent">
                      {(el as ImageElement).src ? (
                        /* eslint-disable-next-line @next/next/no-img-element */
                        <img 
                          src={(el as ImageElement).src} 
                          alt={el.type} 
                          className="max-w-full max-h-full object-contain pointer-events-none" 
                        />
                      ) : (
                        <div className="w-full h-full border-2 border-dashed border-zinc-300 dark:border-zinc-700 flex flex-col items-center justify-center p-2 text-center text-zinc-400 bg-zinc-50 dark:bg-zinc-900/60 rounded">
                          <ImageIcon className="w-5 h-5 mb-1 text-zinc-400" />
                          <span className="text-[10px] font-sans font-medium capitalize">{el.type}</span>
                        </div>
                      )}
                      
                      {el.type === 'signature' && (el as ImageElement).label && (
                        <div className="absolute top-[calc(100%+4px)] left-0 w-full text-center text-[11px] font-sans text-zinc-500 font-medium">
                          {(el as ImageElement).label}
                        </div>
                      )}
                    </div>
                  )}

                  {/* SIZING HANDLE (Bottom-right corner) */}
                  {isSelected && (
                    <div
                      onPointerDown={(e) => handleResizeDown(e, el)}
                      onPointerMove={(e) => handleResizeMove(e, el)}
                      onPointerUp={handleResizeUp}
                      className="absolute right-[-4px] bottom-[-4px] w-3 h-3 bg-indigo-600 rounded-full cursor-se-resize shadow-md border-2 border-white pointer-events-auto"
                      title="Drag to resize element width & height"
                    />
                  )}
                </div>
              );
            })}
          </div>

          {/* Floating Zoom Controls Dock */}
          <div className="absolute bottom-6 right-6 flex items-center gap-1.5 bg-white/95 dark:bg-zinc-900/95 border border-zinc-200 dark:border-zinc-800 rounded-xl p-1.5 shadow-lg z-50 select-none text-xs font-semibold">
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); setZoomMode('manual'); setScale(prev => Math.max(prev - 0.05, 0.25)); }}
              className="p-1.5 text-zinc-500 hover:text-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors font-bold text-xs"
            >
              ー
            </button>
            <span className="text-[10px] font-mono text-zinc-500 px-1 text-center min-w-[32px]">
              {Math.round(scale * 100)}%
            </span>
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); setZoomMode('manual'); setScale(prev => Math.min(prev + 0.05, 1.8)); }}
              className="p-1.5 text-zinc-500 hover:text-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors font-bold text-xs"
            >
              ＋
            </button>
            <div className="w-[1px] h-3.5 bg-zinc-200 mx-1" />
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); setZoomMode('manual'); setScale(1.0); }}
              className={`px-2 py-1 text-[9px] font-bold rounded-lg transition-all ${
                zoomMode === 'manual' && scale === 1.0 ? 'bg-zinc-900 dark:bg-white text-white dark:text-black shadow-sm' : 'text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800'
              }`}
            >
              1:1
            </button>
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); setZoomMode('auto'); }}
              className={`px-2 py-1 text-[9px] font-bold rounded-lg transition-all ${
                zoomMode === 'auto' ? 'bg-zinc-900 dark:bg-white text-white dark:text-black shadow-sm' : 'text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800'
              }`}
            >
              Fit
            </button>
          </div>
        </div>
      </div>

      {/* Editor Sidebar Right: Inspector Panel */}
      <div className="w-full md:w-80 border-l border-zinc-200 dark:border-zinc-800 flex flex-col bg-white dark:bg-zinc-950 shrink-0">
        <div className="p-4 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50/40 dark:bg-zinc-900/10 flex items-center justify-between">
          <div className="flex items-center gap-2 text-zinc-700 dark:text-zinc-300">
            <Settings className="w-4 h-4 text-indigo-500" />
            <h3 className="text-xs font-bold uppercase tracking-wider">Properties Inspector</h3>
          </div>
          {selectedElement && (
            <button
              onClick={() => deleteElement(selectedElement.id)}
              className="p-1 rounded text-zinc-400 hover:text-red-650 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {!selectedElement ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-2 text-zinc-400">
              <HelpCircle className="w-8 h-8 text-zinc-300" />
              <div>
                <p className="text-xs font-semibold">No element selected</p>
                <p className="text-[10px] max-w-[170px] mt-1 text-zinc-400">Click any text block, seal, logo or signature on the canvas to edit its properties.</p>
              </div>
            </div>
          ) : (
            <div className="space-y-5">
              {/* Type and general info */}
              <div className="p-2.5 rounded-lg bg-zinc-50 dark:bg-zinc-900 flex items-center justify-between border border-zinc-150 dark:border-zinc-850">
                <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Node Category</span>
                <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400">
                  {selectedElement.type}
                </span>
              </div>

              {/* TEXT FIELD PROPERTIES */}
              {selectedElement.type === 'text' && (
                <div className="space-y-4">
                  {/* Text value */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Content Text</label>
                    <textarea
                      value={(selectedElement as TextElement).text}
                      onChange={(e) => updateElement(selectedElement.id, { text: e.target.value })}
                      className="w-full text-xs px-3 py-2 border border-zinc-200 dark:border-zinc-800 rounded-lg bg-zinc-50 dark:bg-zinc-900 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:text-white"
                      rows={3}
                    />
                  </div>

                  {/* Variable mapping checkbox */}
                  <div className="space-y-2 p-2.5 border border-zinc-150 dark:border-zinc-800 rounded-lg bg-zinc-50/40">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={(selectedElement as TextElement).isVariable}
                        onChange={(e) => updateElement(selectedElement.id, { 
                          isVariable: e.target.checked,
                          // If mapping is checked, assign first CSV header or empty placeholder
                          variableKey: e.target.checked ? (csvHeaders[0] || 'recipient_name') : undefined
                        })}
                        className="rounded border-zinc-300 text-indigo-600 focus:ring-indigo-500 w-3.5 h-3.5 cursor-pointer"
                      />
                      <span className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">Use Dynamic Data Field</span>
                    </label>
                    
                    {(selectedElement as TextElement).isVariable && (
                      <div className="mt-2 space-y-1">
                        <label className="text-[9px] font-bold text-zinc-400 uppercase">Map to Sheet Column</label>
                        <select
                          value={(selectedElement as TextElement).variableKey || ''}
                          onChange={(e) => updateElement(selectedElement.id, { variableKey: e.target.value })}
                          className="w-full text-[11px] p-1.5 border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 rounded focus:outline-none dark:text-white cursor-pointer"
                        >
                          {csvHeaders.length > 0 ? (
                            csvHeaders.map(h => (
                              <option key={h} value={h}>{h}</option>
                            ))
                          ) : (
                            <>
                              <option value="recipient_name">recipient_name</option>
                              <option value="course_title">course_title</option>
                              <option value="issue_date">issue_date</option>
                            </>
                          )}
                        </select>
                      </div>
                    )}
                  </div>

                  {/* Font Family selector */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Font Family</label>
                    <select
                      value={(selectedElement as TextElement).style.fontFamily}
                      onChange={(e) => {
                        const style = { ...(selectedElement as TextElement).style, fontFamily: e.target.value };
                        updateElement(selectedElement.id, { style });
                      }}
                      className="w-full text-xs p-2 border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 rounded-md focus:outline-none dark:text-white"
                    >
                      {GOOGLE_FONTS.map(font => (
                        <option key={font} value={font}>{font}</option>
                      ))}
                    </select>
                  </div>

                  {/* Font size */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-[10px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                      <span>Font Size</span>
                      <span className="font-mono">{(selectedElement as TextElement).style.fontSize}px</span>
                    </div>
                    <input
                      type="range"
                      min="8"
                      max="120"
                      value={(selectedElement as TextElement).style.fontSize}
                      onChange={(e) => {
                        const style = { ...(selectedElement as TextElement).style, fontSize: parseInt(e.target.value) };
                        updateElement(selectedElement.id, { style });
                      }}
                      className="w-full h-1 bg-zinc-200 dark:bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                    />
                  </div>

                  {/* Color Picker */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Text Color</label>
                    <div className="flex gap-2 items-center">
                      <input
                        type="color"
                        value={(selectedElement as TextElement).style.color}
                        onChange={(e) => {
                          const style = { ...(selectedElement as TextElement).style, color: e.target.value };
                          updateElement(selectedElement.id, { style });
                        }}
                        className="w-8 h-8 rounded border border-zinc-200 dark:border-zinc-800 cursor-pointer overflow-hidden p-0 bg-transparent"
                      />
                      <input
                        type="text"
                        value={(selectedElement as TextElement).style.color}
                        onChange={(e) => {
                          const style = { ...(selectedElement as TextElement).style, color: e.target.value };
                          updateElement(selectedElement.id, { style });
                        }}
                        className="flex-1 text-xs px-2.5 py-1.5 border border-zinc-200 dark:border-zinc-800 rounded bg-zinc-50 dark:bg-zinc-900 uppercase font-mono dark:text-white"
                      />
                    </div>
                  </div>

                  {/* Text alignments */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Align Text</label>
                    <div className="grid grid-cols-3 gap-1 bg-zinc-50 dark:bg-zinc-900 p-1 rounded-lg border border-zinc-200 dark:border-zinc-800">
                      {(['left', 'center', 'right'] as const).map((align) => {
                        const style = (selectedElement as TextElement).style;
                        const isActive = style.align === align;
                        return (
                          <button
                            key={align}
                            onClick={() => {
                              const newStyle = { ...style, align };
                              updateElement(selectedElement.id, { style: newStyle });
                            }}
                            className={`py-1 rounded-md text-zinc-650 dark:text-zinc-350 hover:bg-zinc-200/50 dark:hover:bg-zinc-800/40 flex items-center justify-center ${
                              isActive ? 'bg-white dark:bg-zinc-850 shadow text-indigo-600 dark:text-indigo-400 font-semibold' : ''
                            }`}
                          >
                            {align === 'left' && <AlignLeft className="w-3.5 h-3.5" />}
                            {align === 'center' && <AlignCenter className="w-3.5 h-3.5" />}
                            {align === 'right' && <AlignRight className="w-3.5 h-3.5" />}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Letter spacing */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-[10px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                      <span>Letter Spacing</span>
                      <span className="font-mono">{(selectedElement as TextElement).style.letterSpacing}px</span>
                    </div>
                    <input
                      type="range"
                      min="-2"
                      max="15"
                      step="0.5"
                      value={(selectedElement as TextElement).style.letterSpacing}
                      onChange={(e) => {
                        const style = { ...(selectedElement as TextElement).style, letterSpacing: parseFloat(e.target.value) };
                        updateElement(selectedElement.id, { style });
                      }}
                      className="w-full h-1 bg-zinc-200 dark:bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                    />
                  </div>

                  {/* Weight style toggles */}
                  <div className="grid grid-cols-3 gap-2 pt-1">
                    {/* Bold */}
                    <button
                      onClick={() => {
                        const style = (selectedElement as TextElement).style;
                        const newStyle = { ...style, fontWeight: (style.fontWeight === 'bold' ? 'normal' : 'bold') as 'normal' | 'bold' };
                        updateElement(selectedElement.id, { style: newStyle });
                      }}
                      className={`py-2 border rounded-lg text-xs font-semibold flex items-center justify-center gap-1 transition-colors ${
                        (selectedElement as TextElement).style.fontWeight === 'bold'
                          ? 'border-indigo-500 bg-indigo-50/40 text-indigo-600 dark:bg-indigo-900/10 dark:text-indigo-400'
                          : 'border-zinc-200 dark:border-zinc-800 text-zinc-500 dark:text-zinc-400'
                      }`}
                    >
                      <Bold className="w-3.5 h-3.5" />
                      Bold
                    </button>

                    {/* Italic */}
                    <button
                      onClick={() => {
                        const style = (selectedElement as TextElement).style;
                        const newStyle = { ...style, fontStyle: (style.fontStyle === 'italic' ? 'normal' : 'italic') as 'normal' | 'italic' };
                        updateElement(selectedElement.id, { style: newStyle });
                      }}
                      className={`py-2 border rounded-lg text-xs font-semibold flex items-center justify-center gap-1 transition-colors ${
                        (selectedElement as TextElement).style.fontStyle === 'italic'
                          ? 'border-indigo-500 bg-indigo-50/40 text-indigo-600 dark:bg-indigo-900/10 dark:text-indigo-400'
                          : 'border-zinc-200 dark:border-zinc-800 text-zinc-500 dark:text-zinc-400'
                      }`}
                    >
                      <Italic className="w-3.5 h-3.5" />
                      Italic
                    </button>

                    {/* Uppercase */}
                    <button
                      onClick={() => {
                        const style = (selectedElement as TextElement).style;
                        const newStyle = { ...style, uppercase: !style.uppercase };
                        updateElement(selectedElement.id, { style: newStyle });
                      }}
                      className={`py-2 border rounded-lg text-[10px] font-semibold flex items-center justify-center gap-0.5 transition-colors uppercase ${
                        (selectedElement as TextElement).style.uppercase
                          ? 'border-indigo-500 bg-indigo-50/40 text-indigo-600 dark:bg-indigo-900/10 dark:text-indigo-400'
                          : 'border-zinc-200 dark:border-zinc-800 text-zinc-500 dark:text-zinc-400'
                      }`}
                    >
                      AA
                    </button>
                  </div>
                </div>
              )}

              {/* EMBLEM BADGE PROPERTIES */}
              {selectedElement.type === 'badge' && (
                <div className="space-y-4">
                  {/* Badge Select */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Badge Design</label>
                    <select
                      value={(selectedElement as BadgeElement).badgeType}
                      onChange={(e) => updateElement(selectedElement.id, { badgeType: e.target.value as 'gold_seal' | 'silver_star' | 'laurel_wreath' | 'shield' })}
                      className="w-full text-xs p-2 border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 rounded-md focus:outline-none dark:text-white"
                    >
                      <option value="gold_seal">Classic Ribbon Seal</option>
                      <option value="silver_star">Excellence Star Badge</option>
                      <option value="laurel_wreath">Trophy Laurel Wreath</option>
                      <option value="shield">Validation Shield</option>
                    </select>
                  </div>

                  {/* Emblem Color */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Emblem Fill Color</label>
                    <div className="flex gap-2 items-center">
                      <input
                        type="color"
                        value={(selectedElement as BadgeElement).color}
                        onChange={(e) => updateElement(selectedElement.id, { color: e.target.value })}
                        className="w-8 h-8 rounded border border-zinc-200 dark:border-zinc-800 cursor-pointer overflow-hidden p-0 bg-transparent"
                      />
                      <input
                        type="text"
                        value={(selectedElement as BadgeElement).color}
                        onChange={(e) => updateElement(selectedElement.id, { color: e.target.value })}
                        className="flex-1 text-xs px-2.5 py-1.5 border border-zinc-200 dark:border-zinc-800 rounded bg-zinc-50 dark:bg-zinc-900 uppercase font-mono dark:text-white"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* SIGNATURE / IMAGE UPLOAD PROPERTIES */}
              {(selectedElement.type === 'image' || selectedElement.type === 'signature') && (
                <div className="space-y-4">
                  {/* File Upload Trigger */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                      Upload transparent PNG/SVG
                    </label>
                    <label className="flex flex-col items-center justify-center w-full h-24 border-2 border-dashed border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-900 rounded-lg cursor-pointer transition-colors relative overflow-hidden bg-zinc-50/20">
                      <div className="flex flex-col items-center justify-center p-3 text-center">
                        <Upload className="w-5 h-5 mb-1.5 text-zinc-400" />
                        <p className="text-[10px] font-semibold text-zinc-600 dark:text-zinc-300">Click to upload image</p>
                        <p className="text-[8px] text-zinc-400 mt-0.5">PNG, SVG, or JPEG file</p>
                      </div>
                      <input 
                        type="file" 
                        accept="image/*" 
                        onChange={(e) => handleFileUpload(e, selectedElement.id)} 
                        className="hidden" 
                      />
                    </label>
                  </div>

                  {/* Clear Image */}
                  {(selectedElement as ImageElement).src && (
                    <button
                      onClick={() => updateElement(selectedElement.id, { src: '' })}
                      className="w-full py-1.5 rounded border border-red-250 text-red-650 hover:bg-red-50 text-[10px] font-semibold transition-colors flex items-center justify-center gap-1"
                    >
                      Clear Uploaded File
                    </button>
                  )}

                  {/* Signature label specific */}
                  {selectedElement.type === 'signature' && (
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Signature Subtitle</label>
                      <input
                        type="text"
                        value={(selectedElement as ImageElement).label || ''}
                        onChange={(e) => updateElement(selectedElement.id, { label: e.target.value })}
                        className="w-full text-xs px-3 py-2 border border-zinc-200 dark:border-zinc-800 rounded-lg bg-zinc-50 dark:bg-zinc-900 focus:outline-none dark:text-white"
                        placeholder="e.g. Authorized Signatory"
                      />
                    </div>
                  )}
                </div>
              )}

              {/* BOUNDARY / EXACT POSITIONING SLIDERS */}
              <div className="pt-2 border-t border-zinc-200 dark:border-zinc-800 space-y-3.5">
                <div className="flex items-center gap-1.5 text-zinc-700 dark:text-zinc-350">
                  <Sliders className="w-3.5 h-3.5 text-indigo-500" />
                  <span className="text-[10px] font-bold uppercase tracking-wider">Canvas Positioning</span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-[10px]">
                  {/* X Position */}
                  <div className="space-y-1">
                    <span className="text-zinc-400 font-bold uppercase font-sans">Center X</span>
                    <input
                      type="number"
                      value={selectedElement.x}
                      onChange={(e) => updateElement(selectedElement.id, { x: parseInt(e.target.value) || 0 })}
                      className="w-full py-1 px-2 border border-zinc-200 dark:border-zinc-800 rounded bg-zinc-50 dark:bg-zinc-900 text-center font-mono dark:text-white"
                    />
                  </div>

                  {/* Y Position */}
                  <div className="space-y-1">
                    <span className="text-zinc-400 font-bold uppercase font-sans">Center Y</span>
                    <input
                      type="number"
                      value={selectedElement.y}
                      onChange={(e) => updateElement(selectedElement.id, { y: parseInt(e.target.value) || 0 })}
                      className="w-full py-1 px-2 border border-zinc-200 dark:border-zinc-800 rounded bg-zinc-50 dark:bg-zinc-900 text-center font-mono dark:text-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-[10px]">
                  {/* Width */}
                  <div className="space-y-1">
                    <span className="text-zinc-400 font-bold uppercase font-sans">Width</span>
                    <input
                      type="number"
                      value={selectedElement.width}
                      onChange={(e) => updateElement(selectedElement.id, { width: parseInt(e.target.value) || 30 })}
                      className="w-full py-1 px-2 border border-zinc-200 dark:border-zinc-800 rounded bg-zinc-50 dark:bg-zinc-900 text-center font-mono dark:text-white"
                    />
                  </div>

                  {/* Height */}
                  <div className="space-y-1">
                    <span className="text-zinc-400 font-bold uppercase font-sans">Height</span>
                    <input
                      type="number"
                      value={selectedElement.height}
                      onChange={(e) => updateElement(selectedElement.id, { height: parseInt(e.target.value) || 15 })}
                      className="w-full py-1 px-2 border border-zinc-200 dark:border-zinc-800 rounded bg-zinc-50 dark:bg-zinc-900 text-center font-mono dark:text-white"
                    />
                  </div>
                </div>

                {/* Layer arrange shortcut */}
                <div className="grid grid-cols-2 gap-2 pt-1">
                  <button
                    onClick={() => arrangeLayer('front', selectedElement.id)}
                    className="py-1.5 border border-zinc-200 dark:border-zinc-800 rounded text-[10px] font-semibold text-zinc-650 dark:text-zinc-350 hover:bg-zinc-50 dark:hover:bg-zinc-900 flex items-center justify-center gap-1.5"
                  >
                    Bring to Front
                  </button>
                  <button
                    onClick={() => arrangeLayer('back', selectedElement.id)}
                    className="py-1.5 border border-zinc-200 dark:border-zinc-800 rounded text-[10px] font-semibold text-zinc-650 dark:text-zinc-350 hover:bg-zinc-50 dark:hover:bg-zinc-900 flex items-center justify-center gap-1.5"
                  >
                    Send to Back
                  </button>
                </div>
                {/* Duplicate / Delete actions */}
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => duplicateElement(selectedElement)}
                    className="py-1.5 border border-zinc-200 dark:border-zinc-800 rounded text-[10px] font-semibold text-zinc-650 dark:text-zinc-350 hover:bg-zinc-50 dark:hover:bg-zinc-900 flex items-center justify-center gap-1.5 animate-all"
                  >
                    <Copy className="w-3.5 h-3.5 text-indigo-500" />
                    Duplicate
                  </button>
                  <button
                    onClick={() => deleteElement(selectedElement.id)}
                    className="py-1.5 border border-red-200 dark:border-red-900/20 text-red-650 hover:bg-red-50 dark:hover:bg-red-900/10 rounded text-[10px] font-semibold flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Delete
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
