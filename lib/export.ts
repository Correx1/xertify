import { jsPDF } from 'jspdf';

/**
 * Zero-dependency helper to export an SVG DOM element to a high-resolution PNG image data URL.
 */
export async function svgToPngUrl(
  svgElement: SVGSVGElement,
  width = 2240, // 2x scale for 1120px width (high print resolution)
  height = 1600, // 2x scale for 800px height
  fontUrl = 'https://fonts.googleapis.com/css2?family=Alex+Brush&family=Allura&family=Cinzel:wght@500;700&family=Great+Vibes&family=Inter:wght@400;600&family=Italianno&family=Montserrat:wght@400;600;800&family=Parisienne&family=Pinyon+Script&family=Playball&family=Playfair+Display:ital,wght@0,500;0,700;1,400&family=Sacramento&family=Space+Mono&family=Tangerine&display=swap'
): Promise<string> {
  return new Promise((resolve, reject) => {
    try {
      // 1. Clone the SVG element so we don't mutate the live DOM
      const clonedSvg = svgElement.cloneNode(true) as SVGSVGElement;
      
      // Reset any scale transform applied for rendering preview in the browser
      clonedSvg.style.transform = 'none';
      clonedSvg.style.transformOrigin = 'unset';
      clonedSvg.style.removeProperty('transform');
      clonedSvg.style.removeProperty('transform-origin');
      
      // Ensure standard namespaces and dimensions are set on the SVG root
      clonedSvg.setAttribute('width', `${width}px`);
      clonedSvg.setAttribute('height', `${height}px`);
      
      const originalViewBox = svgElement.getAttribute('viewBox');
      if (originalViewBox) {
        clonedSvg.setAttribute('viewBox', originalViewBox);
      } else {
        clonedSvg.setAttribute('viewBox', '0 0 1120 800');
      }
      
      // 2. Embed Google Fonts styling block inside the SVG.
      // This is crucial because Canvas rendering of SVG elements ignores parent styles and external links.
      const fontStyles = `
        @import url('${fontUrl}');
        
        /* Ensure fonts are loaded and applied correctly in SVG text elements */
        text, tspan {
          font-smooth: always;
          -webkit-font-smoothing: antialiased;
        }
      `;
      
      const styleElement = document.createElementNS('http://www.w3.org/2000/svg', 'style');
      styleElement.textContent = fontStyles;
      clonedSvg.insertBefore(styleElement, clonedSvg.firstChild);

      // 3. Convert SVG DOM to XML string
      const serializer = new XMLSerializer();
      const svgString = serializer.serializeToString(clonedSvg);
      
      // Create a blob from the SVG XML
      const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
      const URL = window.URL || window.webkitURL || window;
      const blobURL = URL.createObjectURL(svgBlob);
      
      // 4. Load XML blob into an Image object
      const img = new Image();
      img.crossOrigin = 'anonymous'; // Avoid tainted canvas
      
      img.onload = () => {
        // Draw onto a canvas scaled to target resolution
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        
        const ctx = canvas.getContext('2d');
        if (ctx) {
          // Clear with transparent/white background
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0, 0, width, height);
          
          // Draw the SVG image
          ctx.drawImage(img, 0, 0, width, height);
          
          try {
            const pngUrl = canvas.toDataURL('image/png');
            URL.revokeObjectURL(blobURL);
            resolve(pngUrl);
          } catch {
            URL.revokeObjectURL(blobURL);
            reject(new Error('Canvas tainted. Cannot export images from external sources.'));
          }
        } else {
          URL.revokeObjectURL(blobURL);
          reject(new Error('Failed to create Canvas 2D context'));
        }
      };
      
      img.onerror = () => {
        URL.revokeObjectURL(blobURL);
        reject(new Error('Failed to parse SVG. Ensure no invalid symbols or unclosed tags are present.'));
      };
      
      img.src = blobURL;
    } catch (error) {
      reject(error);
    }
  });
}

/**
 * Triggers a direct browser file download for a data URL
 */
export function downloadFile(dataUrl: string, fileName: string) {
  const link = document.createElement('a');
  link.download = fileName;
  link.href = dataUrl;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Exports an SVG element to a PDF and triggers download
 */
export async function exportAsPDF(
  svgElement: SVGSVGElement,
  fileName: string,
  layout: 'portrait' | 'landscape' = 'landscape',
  fontUrl?: string
): Promise<void> {
  const isLandscape = layout === 'landscape';
  const width = isLandscape ? 1120 : 800;
  const height = isLandscape ? 800 : 1120;

  // Convert to high-resolution PNG (2x scale)
  const imgData = await svgToPngUrl(svgElement, width * 2, height * 2, fontUrl);

  const pdf = new jsPDF({
    orientation: isLandscape ? 'landscape' : 'portrait',
    unit: 'px',
    format: [width, height]
  });

  pdf.addImage(imgData, 'PNG', 0, 0, width, height);
  pdf.save(fileName);
}

/**
 * Converts an SVG element to a PDF Blob for ZIP compilation
 */
export async function svgToPdfBlob(
  svgElement: SVGSVGElement,
  layout: 'portrait' | 'landscape' = 'landscape',
  fontUrl?: string
): Promise<Blob> {
  const isLandscape = layout === 'landscape';
  const width = isLandscape ? 1120 : 800;
  const height = isLandscape ? 800 : 1120;

  // Convert to high-resolution PNG (2x scale)
  const imgData = await svgToPngUrl(svgElement, width * 2, height * 2, fontUrl);

  const pdf = new jsPDF({
    orientation: isLandscape ? 'landscape' : 'portrait',
    unit: 'px',
    format: [width, height]
  });

  pdf.addImage(imgData, 'PNG', 0, 0, width, height);
  return pdf.output('blob');
}
