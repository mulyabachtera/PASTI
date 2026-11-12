/**
 * Generator Pratinjau Ringan PDF untuk Web SIM PASTI.
 * Mengubah halaman-halaman scan beresolusi berat (misal 14MB) menjadi berkas PDF web berukuran ~1 - 1.5MB
 * menggunakan Canvas HTML5 dan spesifikasi standar PDF 1.4 /DCTDecode (JPEG) tanpa dependensi native.
 */

// Dynamic client loader for local PDF.js to bypass Turbopack / SSR canvas dependency
export async function getPdfJsLib(): Promise<any> {
  if (typeof window === "undefined") return null;
  if ((window as any).pdfjsLib) {
    (window as any).pdfjsLib.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.js";
    return (window as any).pdfjsLib;
  }

  return new Promise((resolve, reject) => {
    const existing = document.querySelector('script[src="/pdf.min.js"]') as HTMLScriptElement | null;
    if (existing) {
      if ((window as any).pdfjsLib) {
        (window as any).pdfjsLib.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.js";
        return resolve((window as any).pdfjsLib);
      }
      existing.addEventListener("load", () => {
        const lib = (window as any).pdfjsLib;
        if (lib) lib.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.js";
        resolve(lib);
      });
      existing.addEventListener("error", reject);
      return;
    }

    const script = document.createElement("script");
    script.src = "/pdf.min.js";
    script.async = true;
    script.onload = () => {
      const lib = (window as any).pdfjsLib;
      if (lib) {
        lib.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.js";
      }
      resolve(lib);
    };
    script.onerror = () => reject(new Error("Gagal menginisialisasi modul pembaca PDF"));
    document.head.appendChild(script);
  });
}

// Helper untuk menyusun buffer JPEG menjadi berkas PDF standar biner murni
export function buildPdfFromJpegs(
  jpegBuffers: Uint8Array[],
  pageDimensions: { width: number; height: number; imgWidth: number; imgHeight: number }[]
): Uint8Array {
  const objects: (string | Uint8Array)[] = [];
  const offsets: number[] = [];
  const numPages = jpegBuffers.length;

  // Obj 1: Catalog
  objects.push('1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n');

  // Obj 2: Pages Root
  const kids: string[] = [];
  for (let i = 0; i < numPages; i++) {
    kids.push(`${3 + i * 3} 0 R`);
  }
  objects.push(`2 0 obj\n<< /Type /Pages /Kids [${kids.join(' ')}] /Count ${numPages} >>\nendobj\n`);

  // Tiap Halaman: Page Obj, Content Stream, dan Image XObject
  for (let i = 0; i < numPages; i++) {
    const pageObj = 3 + i * 3;
    const contentObj = pageObj + 1;
    const imageObj = pageObj + 2;
    const dim = pageDimensions[i] || { width: 595, height: 842, imgWidth: 1200, imgHeight: 1700 };

    // Page Object
    objects.push(
      `${pageObj} 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${dim.width} ${dim.height}] /Contents ${contentObj} 0 R /Resources << /XObject << /Im0 ${imageObj} 0 R >> >> >>\nendobj\n`
    );

    // Content Stream
    const content = `q ${dim.width} 0 0 ${dim.height} 0 0 cm /Im0 Do Q`;
    objects.push(`${contentObj} 0 obj\n<< /Length ${content.length} >>\nstream\n${content}\nendstream\nendobj\n`);

    // Image XObject with /Filter /DCTDecode
    const imgHeader = `${imageObj} 0 obj\n<< /Type /XObject /Subtype /Image /Width ${dim.imgWidth} /Height ${dim.imgHeight} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${jpegBuffers[i].length} >>\nstream\n`;
    const imgFooter = '\nendstream\nendobj\n';

    const headerBytes = new TextEncoder().encode(imgHeader);
    const footerBytes = new TextEncoder().encode(imgFooter);
    const fullImgBytes = new Uint8Array(headerBytes.length + jpegBuffers[i].length + footerBytes.length);
    fullImgBytes.set(headerBytes, 0);
    fullImgBytes.set(jpegBuffers[i], headerBytes.length);
    fullImgBytes.set(footerBytes, headerBytes.length + jpegBuffers[i].length);

    objects.push(fullImgBytes);
  }

  // Gabungkan seluruh bagian menjadi PDF
  const parts: Uint8Array[] = [];
  const headerBytes = new TextEncoder().encode('%PDF-1.4\n');
  parts.push(headerBytes);
  let currentOffset = headerBytes.length;

  for (let i = 0; i < objects.length; i++) {
    offsets.push(currentOffset);
    const obj = typeof objects[i] === 'string' 
      ? new TextEncoder().encode(objects[i] as string) 
      : (objects[i] as Uint8Array);
    parts.push(obj);
    currentOffset += obj.length;
  }

  let xrefStr = `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  for (let i = 0; i < offsets.length; i++) {
    xrefStr += `${String(offsets[i]).padStart(10, '0')} 00000 n \n`;
  }
  const trailerStr = `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${currentOffset}\n%%EOF\n`;

  parts.push(new TextEncoder().encode(xrefStr));
  parts.push(new TextEncoder().encode(trailerStr));

  const totalLength = parts.reduce((acc, p) => acc + p.length, 0);
  const result = new Uint8Array(totalLength);
  let pos = 0;
  for (const part of parts) {
    result.set(part, pos);
    pos += part.length;
  }

  return result;
}

/**
 * Membuat versi pratinjau ringan dari berkas PDF di sisi browser client.
 * Membaca halaman, me-render pada resolusi web (lebar maks 1200px), dan mengompres ke JPEG.
 */
export async function generatePdfWebPreview(file: File): Promise<Blob | null> {
  if (typeof window === 'undefined') return null;

  try {
    const pdfjsLib = await getPdfJsLib();
    if (!pdfjsLib) return null;

    const arrayBuffer = await file.arrayBuffer();
    const loadingTask = pdfjsLib.getDocument({ data: new Uint8Array(arrayBuffer) });
    const pdf = await loadingTask.promise;
    const numPages = pdf.numPages;

    const jpegBuffers: Uint8Array[] = [];
    const dimensions: { width: number; height: number; imgWidth: number; imgHeight: number }[] = [];

    const offscreenCanvas = document.createElement('canvas');
    const ctx = offscreenCanvas.getContext('2d');
    if (!ctx) return null;

    for (let p = 1; p <= numPages; p++) {
      const page = await pdf.getPage(p);
      const baseViewport = page.getViewport({ scale: 1.0 });
      // Skala optimal web: target lebar ~1200px (150 DPI)
      const targetScale = Math.min(2.0, Math.max(1.0, 1200 / baseViewport.width));
      const viewport = page.getViewport({ scale: targetScale });

      offscreenCanvas.width = Math.floor(viewport.width);
      offscreenCanvas.height = Math.floor(viewport.height);

      ctx.clearRect(0, 0, offscreenCanvas.width, offscreenCanvas.height);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, offscreenCanvas.width, offscreenCanvas.height);

      await page.render({
        canvasContext: ctx,
        viewport: viewport,
      }).promise;

      // Kompres ke JPEG dengan kualitas 0.78
      const blob = await new Promise<Blob | null>((resolve) => {
        offscreenCanvas.toBlob(resolve, 'image/jpeg', 0.78);
      });

      if (blob) {
        const buf = await blob.arrayBuffer();
        jpegBuffers.push(new Uint8Array(buf));
        dimensions.push({
          width: Math.floor(baseViewport.width),
          height: Math.floor(baseViewport.height),
          imgWidth: offscreenCanvas.width,
          imgHeight: offscreenCanvas.height,
        });
      }
    }

    if (jpegBuffers.length === 0) return null;

    const previewPdfBytes = buildPdfFromJpegs(jpegBuffers, dimensions);
    return new Blob([previewPdfBytes.buffer as ArrayBuffer], { type: 'application/pdf' });
  } catch (err) {
    console.warn('Gagal membuat pratinjau web otomatis:', err);
    return null;
  }
}
