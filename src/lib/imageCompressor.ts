/**
 * Utility untuk kompresi gambar di sisi browser (Client-side)
 * Menggunakan HTML5 Canvas native tanpa library eksternal.
 * Mengecilkan dimensi (max 1920px) dan mengompresi kualitas JPEG menjadi optimal (~200-400 KB).
 */
export async function compressImage(
  file: File, 
  maxWidth = 1920, 
  quality = 0.82
): Promise<File> {
  // Hanya proses jika file adalah gambar (jangan proses PDF)
  if (!file.type.startsWith('image/') || file.type === 'image/svg+xml') {
    return file;
  }

  // Jika file sudah kecil (< 350 KB), tidak perlu dikompres
  if (file.size < 350 * 1024) {
    return file;
  }

  return new Promise((resolve) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(objectUrl);

      let { width, height } = img;

      // Hitung aspek rasio jika resolusi lebih besar dari maxWidth
      if (width > maxWidth) {
        height = Math.round((height * maxWidth) / width);
        width = maxWidth;
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve(file);
        return;
      }

      // Gambar ulang ke canvas
      ctx.drawImage(img, 0, 0, width, height);

      // Ekspor ke JPEG terkompresi
      canvas.toBlob(
        (blob) => {
          if (!blob || blob.size >= file.size) {
            // Jika hasil kompresi tidak lebih kecil, pertahankan file asli
            resolve(file);
          } else {
            const outputName = file.name.replace(/\.[^.]+$/, '.jpeg');
            const compressedFile = new File([blob], outputName, {
              type: 'image/jpeg',
              lastModified: Date.now(),
            });
            resolve(compressedFile);
          }
        },
        'image/jpeg',
        quality
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      resolve(file);
    };

    img.src = objectUrl;
  });
}

