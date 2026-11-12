/**
 * Image processing utilities for mobile camera & file uploads
 * Includes rotate, compression, resizing, and sample sheet generator.
 */

export interface ProcessedImageResult {
  base64: string;
  mimeType: string;
  width: number;
  height: number;
  sizeKb: number;
}

export async function compressAndResizeImage(
  source: File | string,
  maxWidth = 1400,
  quality = 0.82
): Promise<ProcessedImageResult> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';

    const handleLoad = () => {
      let targetW = img.width;
      let targetH = img.height;

      if (targetW > maxWidth) {
        targetH = Math.round((targetH * maxWidth) / targetW);
        targetW = maxWidth;
      }

      const canvas = document.createElement('canvas');
      canvas.width = targetW;
      canvas.height = targetH;
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        reject(new Error('Canvas context could not be created'));
        return;
      }

      // Slightly increase contrast & sharpness for OCR readability
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(img, 0, 0, targetW, targetH);

      const mimeType = 'image/jpeg';
      const base64 = canvas.toDataURL(mimeType, quality);
      const sizeKb = Math.round((base64.length * 3) / 4 / 1024);

      resolve({
        base64,
        mimeType,
        width: targetW,
        height: targetH,
        sizeKb,
      });
    };

    img.onerror = (err) => reject(err);

    if (typeof source === 'string') {
      img.src = source;
    } else {
      const reader = new FileReader();
      reader.onload = (e) => {
        img.src = e.target?.result as string;
      };
      reader.onerror = (err) => reject(err);
      reader.readAsDataURL(source);
    }
  });
}

export async function rotateImage(
  base64: string,
  degrees: 90 | 180 | 270
): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Canvas error'));
        return;
      }

      if (degrees === 90 || degrees === 270) {
        canvas.width = img.height;
        canvas.height = img.width;
      } else {
        canvas.width = img.width;
        canvas.height = img.height;
      }

      ctx.translate(canvas.width / 2, canvas.height / 2);
      ctx.rotate((degrees * Math.PI) / 180);
      ctx.drawImage(img, -img.width / 2, -img.height / 2);

      resolve(canvas.toDataURL('image/jpeg', 0.85));
    };
    img.onerror = reject;
    img.src = base64;
  });
}

/**
 * Creates a high-fidelity synthetic student answer sheet for demo, testing or camera simulation
 */
export function generateSampleAnswerSheetImage(studentName = 'Budi Santoso', examTitle = 'Penilaian Matematika'): string {
  const canvas = document.createElement('canvas');
  canvas.width = 1000;
  canvas.height = 1400;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  // Paper background with subtle texture
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Grid / margin line
  ctx.strokeStyle = '#e2e8f0';
  ctx.lineWidth = 2;
  ctx.strokeRect(40, 40, canvas.width - 80, canvas.height - 80);

  // Header Box
  ctx.fillStyle = '#f8fafc';
  ctx.fillRect(50, 50, canvas.width - 100, 160);
  ctx.strokeRect(50, 50, canvas.width - 100, 160);

  // Header Text
  ctx.fillStyle = '#0f172a';
  ctx.font = 'bold 28px sans-serif';
  ctx.fillText('LEMBAR JAWABAN SISWA (LJS)', 70, 95);

  ctx.font = '18px sans-serif';
  ctx.fillStyle = '#334155';
  ctx.fillText(`Ujian: ${examTitle}`, 70, 130);
  ctx.fillText(`Nama Siswa: ${studentName}`, 70, 160);
  ctx.fillText(`NIS / Kelas: 2026/0491 | X MIPA 1`, 70, 190);

  ctx.fillText(`Tanggal: 2026-03-10`, 680, 130);
  ctx.fillText(`Paraf Siswa: [ ✓ Terisi ]`, 680, 160);

  // Section 1: Pilihan Ganda (OMR bubbles simulation)
  ctx.font = 'bold 22px sans-serif';
  ctx.fillStyle = '#1e293b';
  ctx.fillText('A. PILIHAN GANDA', 70, 260);

  const answers = ['B', 'D', 'A', 'C', 'B'];
  const options = ['A', 'B', 'C', 'D', 'E'];

  answers.forEach((ans, index) => {
    const y = 300 + index * 55;
    ctx.font = 'bold 18px monospace';
    ctx.fillStyle = '#475569';
    ctx.fillText(`${index + 1}.`, 80, y + 6);

    options.forEach((opt, optIdx) => {
      const x = 140 + optIdx * 65;
      const isSelected = ans === opt;

      ctx.beginPath();
      ctx.arc(x, y, 16, 0, 2 * Math.PI);
      if (isSelected) {
        ctx.fillStyle = '#2563eb';
        ctx.fill();
        ctx.fillStyle = '#ffffff';
      } else {
        ctx.strokeStyle = '#94a3b8';
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.fillStyle = '#64748b';
      }
      ctx.font = 'bold 14px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(opt, x, y + 5);
      ctx.textAlign = 'left';
    });
  });

  // Section 2: Esai / Uraian (Handwritten style simulation)
  ctx.font = 'bold 22px sans-serif';
  ctx.fillStyle = '#1e293b';
  ctx.fillText('B. SOAL URAIAN / ESAI', 70, 620);

  // Question 6
  ctx.font = 'bold 18px sans-serif';
  ctx.fillStyle = '#334155';
  ctx.fillText('No 6. Hitung sisi c segitiga sembarang (aturan kosinus):', 70, 660);

  // Ruled lines for answer
  for (let l = 0; l < 4; l++) {
    const ly = 700 + l * 45;
    ctx.strokeStyle = '#cbd5e1';
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(80, ly);
    ctx.lineTo(920, ly);
    ctx.stroke();
    ctx.setLineDash([]);
  }

  // Simulated handwriting (blue ink)
  ctx.font = 'italic 20px "Segoe Print", "Comic Sans MS", cursive, sans-serif';
  ctx.fillStyle = '#1d4ed8';
  ctx.fillText('Diketahui a = 8 cm, b = 10 cm, sudut C = 60°', 90, 695);
  ctx.fillText('c² = a² + b² - 2ab · cos 60°', 90, 740);
  ctx.fillText('c² = 64 + 100 - 2(8)(10)(0.5) = 164 - 80 = 84 => c = √84 ≈ 9.16 cm', 90, 785);
  ctx.fillText('Jadi panjang sisi c adalah 9.16 cm', 90, 830);

  // Question 7
  ctx.font = 'bold 18px sans-serif';
  ctx.fillStyle = '#334155';
  ctx.fillText('No 7. Aplikasi pemodelan tinggi tiang bendera:', 70, 910);

  for (let l = 0; l < 4; l++) {
    const ly = 950 + l * 45;
    ctx.strokeStyle = '#cbd5e1';
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(80, ly);
    ctx.lineTo(920, ly);
    ctx.stroke();
    ctx.setLineDash([]);
  }

  ctx.font = 'italic 20px "Segoe Print", "Comic Sans MS", cursive, sans-serif';
  ctx.fillStyle = '#1d4ed8';
  ctx.fillText('Jarak pengamat ke tiang = 20 m, sudut elevasi = 45°', 90, 945);
  ctx.fillText('tan 45° = y / 20 => y = 20 × 1 = 20 m', 90, 990);
  ctx.fillText('Tinggi tiang total = y + tinggi mata (1.6 m) = 21.6 meter', 90, 1035);
  ctx.fillText('Hasil akhir: Tinggi tiang bendera = 21.6 m.', 90, 1080);

  // Barcode / QR simulator at bottom
  ctx.fillStyle = '#0f172a';
  for (let b = 0; b < 45; b++) {
    const bw = (b % 3 === 0) ? 6 : (b % 2 === 0 ? 3 : 2);
    ctx.fillRect(80 + b * 10, 1260, bw, 45);
  }
  ctx.font = '12px monospace';
  ctx.fillText('LEM-JAWAB-2026-X1-A0491', 80, 1325);

  return canvas.toDataURL('image/jpeg', 0.85);
}
