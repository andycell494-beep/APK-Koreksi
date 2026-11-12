/**
 * Utility for Generating Immaculate, Official School Printable Reports
 * Complies with Kurikulum Merdeka standards and supports iframe-safe printing & HTML export
 */

import {
  ClassAnalyticsResult,
  ItemAnalysisDetail,
  StudentRankItem,
  GradedSubmission,
  anonymizeStudentData,
} from './gradingLogic';
import { TeacherProfile, StudentRosterItem, ExportFormat } from './storage';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';

export interface ReportPrintOptions {
  analytics: ClassAnalyticsResult;
  submissions: GradedSubmission[];
  selectedClass: string;
  kkmReference: number;
  subjectName: string;
  examTitle: string;
  teacherProfile: TeacherProfile;
  anonymizeEnabled: boolean;
}

export function generatePrintableReportHtml(opts: ReportPrintOptions): string {
  const {
    analytics,
    selectedClass,
    kkmReference,
    subjectName,
    examTitle,
    teacherProfile,
    anonymizeEnabled,
  } = opts;

  const currentDateFormatted = new Date().toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  const classLabel = selectedClass === 'all' ? 'Seluruh Kelas (Rombel Gabungan)' : selectedClass;

  // Generate Table of Psychometric Items
  const itemRowsHtml = analytics.itemDifficulty
    .map((item: ItemAnalysisDetail) => {
      const recBadgeColor =
        item.recommendation === 'Diterima Baik'
          ? '#15803d'
          : item.recommendation === 'Revisi Soal'
          ? '#b45309'
          : '#b91c1c';

      return `
      <tr>
        <td style="text-align: center; font-weight: 700; font-family: monospace;">#${item.questionNumber}</td>
        <td style="text-align: center;">${item.type === 'essay' ? 'Uraian / Esai' : 'Pilihan Ganda'}</td>
        <td style="text-align: center; font-family: monospace;">${item.correctCount}</td>
        <td style="text-align: center; font-family: monospace;">${item.incorrectCount}</td>
        <td style="text-align: center; font-family: monospace; font-weight: 600;">${item.correctRate}%</td>
        <td style="text-align: center;">${item.difficultyCategory}</td>
        <td style="text-align: center; font-family: monospace;">${item.discriminationIndex} (${item.discriminationCategory})</td>
        <td style="text-align: center; font-weight: 700; color: ${recBadgeColor};">${item.recommendation}</td>
      </tr>
    `;
    })
    .join('');

  // Generate Table of Students Ranking
  const studentRowsHtml = analytics.studentRankings
    .map((st: StudentRankItem) => {
      const displayName = anonymizeEnabled
        ? anonymizeStudentData(st.studentName, st.studentId).maskedName
        : st.studentName;
      const displayId = anonymizeEnabled
        ? anonymizeStudentData(st.studentName, st.studentId).maskedId
        : st.studentId;

      const statusColor = st.isPassed ? '#15803d' : '#b91c1c';
      const statusText = st.isPassed ? 'TUNTAS' : 'REMEDIAL';

      return `
      <tr>
        <td style="text-align: center; font-weight: 700; font-family: monospace;">${st.rank}</td>
        <td style="font-weight: 600; text-align: left;">${displayName}</td>
        <td style="text-align: center; font-family: monospace;">${displayId}</td>
        <td style="text-align: center;">${st.classRoom}</td>
        <td style="text-align: center; font-weight: 800; font-family: monospace;">${st.scorePercentage}</td>
        <td style="text-align: center; font-weight: 700;">${st.gradeLetter}</td>
        <td style="text-align: center; font-weight: 700; color: ${statusColor};">${statusText}</td>
        <td style="text-align: center; font-size: 8pt; color: #475569;">${
          st.verifiedByTeacher ? 'Terverifikasi Guru' : 'Perlu Tinjauan'
        }</td>
      </tr>
    `;
    })
    .join('');

  return `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <title>Laporan Analisis Nilai - ${subjectName} (${classLabel})</title>
  <style>
    @page {
      size: A4 portrait;
      margin: 12mm 15mm 15mm 15mm;
    }
    * {
      box-sizing: border-box;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif;
      font-size: 9.5pt;
      line-height: 1.4;
      color: #0f172a;
      background: #ffffff;
      margin: 0;
      padding: 15px;
    }
    @media screen {
      body {
        max-width: 210mm;
        margin: 20px auto;
        padding: 30px;
        background: #f8fafc;
      }
      .paper-container {
        background: #ffffff;
        padding: 30px 40px;
        border: 1px solid #cbd5e1;
        box-shadow: 0 10px 25px -5px rgba(0,0,0,0.1);
        border-radius: 4px;
      }
    }
    @media print {
      body {
        padding: 0 !important;
        margin: 0 !important;
        background: #ffffff !important;
      }
      .paper-container {
        border: none !important;
        box-shadow: none !important;
        padding: 0 !important;
      }
      .no-print {
        display: none !important;
      }
    }

    /* Kop Surat */
    .kop-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      border-bottom: 3px double #0f172a;
      padding-bottom: 8px;
      margin-bottom: 12px;
    }
    .kop-logo {
      width: 65px;
      height: 65px;
      flex-shrink: 0;
    }
    .kop-text {
      text-align: center;
      flex: 1;
      padding: 0 10px;
    }
    .kop-text h4 {
      margin: 0;
      font-size: 8.5pt;
      font-weight: 700;
      letter-spacing: 1px;
      text-transform: uppercase;
      color: #475569;
    }
    .kop-text h2 {
      margin: 1px 0;
      font-size: 11pt;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      color: #0f172a;
    }
    .kop-text h1 {
      margin: 2px 0;
      font-size: 13pt;
      font-weight: 900;
      text-transform: uppercase;
      color: #0f172a;
    }
    .kop-text p {
      margin: 2px 0 0;
      font-size: 8pt;
      color: #475569;
    }

    /* Judul Laporan */
    .doc-title-container {
      text-align: center;
      margin: 14px 0 12px;
    }
    .doc-title {
      font-size: 11.5pt;
      font-weight: 900;
      text-transform: uppercase;
      text-decoration: underline;
      margin: 0;
      letter-spacing: 0.5px;
    }
    .doc-subtitle {
      font-size: 8.5pt;
      color: #475569;
      margin: 3px 0 0;
      font-weight: 600;
    }

    /* Metadata Grid */
    .metadata-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 12px;
      background: #f8fafc;
      border: 1px solid #cbd5e1;
    }
    .metadata-table td {
      padding: 4px 8px;
      font-size: 8.5pt;
      border: 1px solid #e2e8f0;
    }
    .metadata-label {
      font-weight: 700;
      color: #475569;
      width: 18%;
    }
    .metadata-value {
      font-weight: 600;
      color: #0f172a;
      width: 32%;
    }

    /* Section Headings */
    .section-header {
      font-size: 9pt;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.3px;
      margin: 12px 0 6px;
      color: #0f172a;
      display: flex;
      align-items: center;
      gap: 6px;
    }

    /* Tables */
    table.data-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 12px;
    }
    table.data-table th,
    table.data-table td {
      border: 1px solid #334155;
      padding: 4.5px 7px;
      font-size: 8.5pt;
    }
    table.data-table th {
      background: #f1f5f9;
      color: #0f172a;
      font-weight: 700;
      text-align: center;
    }
    table.data-table tr:nth-child(even) td {
      background: #fafafa;
    }

    /* Stat Box Cards in Print */
    .stats-summary-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 6px;
      margin-bottom: 12px;
    }
    .stat-mini-card {
      border: 1px solid #cbd5e1;
      padding: 6px 8px;
      background: #f8fafc;
      border-radius: 4px;
      text-align: center;
    }
    .stat-mini-label {
      font-size: 7.5pt;
      color: #64748b;
      font-weight: 600;
      display: block;
      text-transform: uppercase;
    }
    .stat-mini-val {
      font-size: 13pt;
      font-weight: 900;
      color: #0f172a;
      font-family: monospace;
      margin-top: 2px;
      display: block;
    }
    .stat-mini-sub {
      font-size: 7pt;
      color: #64748b;
    }

    /* Policy Box */
    .tindak-lanjut-box {
      border: 1px solid #cbd5e1;
      background: #f8fafc;
      padding: 8px 12px;
      border-radius: 4px;
      margin: 10px 0 14px;
      font-size: 8.5pt;
    }
    .tindak-lanjut-box h5 {
      margin: 0 0 4px;
      font-size: 8.5pt;
      font-weight: 800;
      text-transform: uppercase;
      color: #1e293b;
    }
    .tindak-lanjut-box p {
      margin: 0;
      line-height: 1.5;
      color: #334155;
    }

    /* Signature Block */
    .signature-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      text-align: center;
      margin-top: 16px;
      padding-top: 12px;
      page-break-inside: avoid;
    }
    .signature-space {
      height: 55px;
    }
    .signature-name {
      font-weight: 800;
      text-decoration: underline;
      text-transform: uppercase;
      margin: 0;
      font-size: 9pt;
    }
    .signature-nip {
      margin: 2px 0 0;
      font-size: 8pt;
      font-family: monospace;
      color: #475569;
    }

    .badge-pill {
      display: inline-block;
      padding: 2px 6px;
      border-radius: 3px;
      font-size: 7.5pt;
      font-weight: 700;
    }

    /* Floating action toolbar for screen viewing */
    .screen-toolbar {
      position: sticky;
      top: 10px;
      z-index: 50;
      background: #1e1b4b;
      color: #ffffff;
      padding: 10px 16px;
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 20px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    }
    .screen-toolbar button {
      cursor: pointer;
      border: none;
      font-weight: 700;
      font-size: 12px;
      padding: 6px 14px;
      border-radius: 6px;
      display: inline-flex;
      align-items: center;
      gap: 6px;
      transition: all 0.2s;
    }
    .btn-print {
      background: #4f46e5;
      color: #ffffff;
    }
    .btn-print:hover {
      background: #4338ca;
    }
    .btn-download {
      background: #059669;
      color: #ffffff;
    }
    .btn-download:hover {
      background: #047857;
    }
  </style>
</head>
<body>
  <div class="no-print screen-toolbar">
    <div>
      <span style="font-size: 13px; font-weight: 800; display: block;">Laporan Siap Cetak (A4 Resmi)</span>
      <span style="font-size: 11px; color: #cbd5e1;">Dokumen resmi evaluasi belajar murid & arsip kurikulum</span>
    </div>
    <div style="display: flex; gap: 8px;">
      <button class="btn-print" onclick="window.print()">
        🖨️ Cetak / Simpan PDF
      </button>
      <button class="btn-download" onclick="window.close()">
        ✕ Tutup
      </button>
    </div>
  </div>

  <div class="paper-container">
    <!-- KOP SURAT RESMI -->
    <div class="kop-header">
      <!-- Lambang Pendidikan Tut Wuri Handayani (SVG Vector) -->
      <div class="kop-logo">
        <svg viewBox="0 0 100 100" width="65" height="65" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="50" cy="50" r="46" stroke="#0f172a" stroke-width="2.5" fill="#f8fafc" />
          <path d="M50 14 L55 26 L68 28 L58 37 L61 50 L50 43 L39 50 L42 37 L32 28 L45 26 Z" fill="#b45309" stroke="#0f172a" stroke-width="1.5" />
          <path d="M22 62 C30 52 42 50 50 56 C58 50 70 52 78 62 C74 74 62 82 50 82 C38 82 26 74 22 62 Z" fill="#1e3a8a" stroke="#0f172a" stroke-width="1.5" />
          <path d="M35 70 C42 66 50 68 50 68 C50 68 58 66 65 70" stroke="#f8fafc" stroke-width="2" stroke-linecap="round" />
          <circle cx="50" cy="38" r="4" fill="#fbbf24" stroke="#0f172a" stroke-width="1" />
        </svg>
      </div>

      <div class="kop-text">
        <h4>PEMERINTAH DAERAH PROVINSI / KABUPATEN</h4>
        <h2>DINAS PENDIDIKAN DAN KEBUDAYAAN</h2>
        <h1>${teacherProfile.schoolName || 'SMA NEGERI PRESTASI INDONESIA'}</h1>
        <p>Alamat: ${teacherProfile.schoolAddress || 'Jl. Pendidikan No. 45'} • Jenjang: ${teacherProfile.gradeLevel || 'SMA/MA'} • Akreditasi: A • NPSN: ${teacherProfile.schoolNpsn || '20328901'}</p>
      </div>

      <!-- Lambang Lambang Sekolah Mitra -->
      <div class="kop-logo" style="text-align: right;">
        <svg viewBox="0 0 100 100" width="65" height="65" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect x="10" y="10" width="80" height="80" rx="16" stroke="#0f172a" stroke-width="2.5" fill="#f8fafc" />
          <path d="M30 40 L50 25 L70 40 L70 70 L30 70 Z" fill="#047857" stroke="#0f172a" stroke-width="1.5" />
          <path d="M42 70 L42 52 L58 52 L58 70" fill="#f8fafc" stroke="#0f172a" stroke-width="1.5" />
          <circle cx="50" cy="38" r="5" fill="#f59e0b" />
        </svg>
      </div>
    </div>

    <!-- JUDUL DOKUMEN -->
    <div class="doc-title-container">
      <h3 class="doc-title">LAPORAN ANALISIS HASIL PENILAIAN & EVALUASI BELAJAR</h3>
      <p class="doc-subtitle">Nomor Dokumen: LAP-EVAL/${new Date().getFullYear()}/${selectedClass === 'all' ? 'ALL' : selectedClass} • Kurikulum Merdeka</p>
    </div>

    <!-- METADATA UJIAN & KELAS -->
    <table class="metadata-table">
      <tr>
        <td class="metadata-label">Mata Pelajaran</td>
        <td class="metadata-value">: ${subjectName}</td>
        <td class="metadata-label">Kelas / Rombel</td>
        <td class="metadata-value">: ${classLabel}</td>
      </tr>
      <tr>
        <td class="metadata-label">Nama Ujian</td>
        <td class="metadata-value">: ${examTitle}</td>
        <td class="metadata-label">Standar KKM / KKTP</td>
        <td class="metadata-value font-mono">: ${kkmReference}</td>
      </tr>
      <tr>
        <td class="metadata-label">Guru Pengampu</td>
        <td class="metadata-value">: ${teacherProfile.name}</td>
        <td class="metadata-label">Tanggal Pelaporan</td>
        <td class="metadata-value">: ${currentDateFormatted}</td>
      </tr>
      <tr>
        <td class="metadata-label">NIP Guru</td>
        <td class="metadata-value font-mono">: ${teacherProfile.nip}</td>
        <td class="metadata-label">Jumlah Peserta</td>
        <td class="metadata-value font-mono">: ${analytics.totalStudents} Siswa</td>
      </tr>
    </table>

    <!-- BAGIAN I: STATISTIK HASIL EVALUASI -->
    <div class="section-header">I. Ringkasan Parameter Statistik & Ketuntasan Belajar</div>
    
    <div class="stats-summary-grid">
      <div class="stat-mini-card">
        <span class="stat-mini-label">Rata-Rata (Mean)</span>
        <span class="stat-mini-val">${analytics.averageScore}</span>
        <span class="stat-mini-sub">Dari skala 100</span>
      </div>
      <div class="stat-mini-card">
        <span class="stat-mini-label">Median (Nilai Tengah)</span>
        <span class="stat-mini-val" style="color: #4f46e5;">${analytics.medianScore}</span>
        <span class="stat-mini-sub">Titik tengah</span>
      </div>
      <div class="stat-mini-card">
        <span class="stat-mini-label">Standar Deviasi</span>
        <span class="stat-mini-val" style="color: #7c3aed;">±${analytics.standardDeviation}</span>
        <span class="stat-mini-sub">Sebaran varian</span>
      </div>
      <div class="stat-mini-card">
        <span class="stat-mini-label">Ketuntasan KKM</span>
        <span class="stat-mini-val" style="color: #15803d;">${analytics.passRatePercentage}%</span>
        <span class="stat-mini-sub">${analytics.passedCount} Tuntas • ${analytics.failedCount} Remedial</span>
      </div>
    </div>

    <table class="data-table">
      <thead>
        <tr>
          <th>Total Peserta</th>
          <th>Tuntas KKM (&ge; ${kkmReference})</th>
          <th>Belum Tuntas (&lt; ${kkmReference})</th>
          <th>Nilai Tertinggi</th>
          <th>Nilai Terendah</th>
          <th>Rentang Skor (Range)</th>
        </tr>
      </thead>
      <tbody>
        <tr style="text-align: center; font-family: monospace;">
          <td>${analytics.totalStudents} Siswa</td>
          <td style="font-weight: 700; color: #15803d;">${analytics.passedCount} Siswa (${analytics.passRatePercentage}%)</td>
          <td style="font-weight: 700; color: #b91c1c;">${analytics.failedCount} Siswa (${100 - analytics.passRatePercentage}%)</td>
          <td style="font-weight: 700;">${analytics.highestScore}</td>
          <td style="font-weight: 700;">${analytics.lowestScore}</td>
          <td>${analytics.scoreRange} poin</td>
        </tr>
      </tbody>
    </table>

    <!-- DISTRIBUSI PREDIKAT -->
    <div style="margin-bottom: 10px;">
      <span style="font-size: 8pt; font-weight: 700; color: #475569; text-transform: uppercase;">Distribusi Predikat Capaian:</span>
      <table class="data-table" style="margin-top: 4px; margin-bottom: 10px;">
        <thead>
          <tr>
            <th>Predikat A (Sangat Baik: 90-100)</th>
            <th>Predikat B (Baik: 80-89)</th>
            <th>Predikat C (Cukup: 70-79)</th>
            <th>Predikat D (Kurang: 60-69)</th>
            <th>Predikat E (Sangat Kurang: &lt;60)</th>
          </tr>
        </thead>
        <tbody>
          <tr style="text-align: center; font-weight: 700; font-family: monospace;">
            <td>${analytics.gradeDistribution.A} Siswa (${analytics.totalStudents > 0 ? Math.round((analytics.gradeDistribution.A / analytics.totalStudents) * 100) : 0}%)</td>
            <td>${analytics.gradeDistribution.B} Siswa (${analytics.totalStudents > 0 ? Math.round((analytics.gradeDistribution.B / analytics.totalStudents) * 100) : 0}%)</td>
            <td>${analytics.gradeDistribution.C} Siswa (${analytics.totalStudents > 0 ? Math.round((analytics.gradeDistribution.C / analytics.totalStudents) * 100) : 0}%)</td>
            <td>${analytics.gradeDistribution.D} Siswa (${analytics.totalStudents > 0 ? Math.round((analytics.gradeDistribution.D / analytics.totalStudents) * 100) : 0}%)</td>
            <td>${analytics.gradeDistribution.E} Siswa (${analytics.totalStudents > 0 ? Math.round((analytics.gradeDistribution.E / analytics.totalStudents) * 100) : 0}%)</td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- BAGIAN II: ANALISIS KUALITAS BUTIR SOAL -->
    <div class="section-header">II. Analisis Kualitas Butir Soal (Psikometrik)</div>
    <table class="data-table">
      <thead>
        <tr>
          <th style="width: 32px;">No</th>
          <th>Tipe Soal</th>
          <th>Benar</th>
          <th>Salah</th>
          <th>Tingkat Kesukaran (P)</th>
          <th>Kategori P</th>
          <th>Daya Pembeda (D)</th>
          <th>Rekomendasi Bank Soal</th>
        </tr>
      </thead>
      <tbody>
        ${itemRowsHtml || '<tr><td colspan="8" style="text-align:center;">Tidak ada data butir soal</td></tr>'}
      </tbody>
    </table>

    <!-- BAGIAN III: DAFTAR NILAI & PERINGKAT SISWA -->
    <div class="section-header">III. Rekapitulasi Perolehan Nilai & Peringkat Siswa</div>
    <table class="data-table">
      <thead>
        <tr>
          <th style="width: 36px;">Rank</th>
          <th>Nama Lengkap Siswa</th>
          <th>NIS</th>
          <th>Kelas</th>
          <th>Nilai Akhir</th>
          <th>Predikat</th>
          <th>Status KKM</th>
          <th>Status Audit</th>
        </tr>
      </thead>
      <tbody>
        ${studentRowsHtml || '<tr><td colspan="8" style="text-align:center;">Tidak ada data siswa</td></tr>'}
      </tbody>
    </table>

    <!-- BAGIAN IV: KESIMPULAN & RENCANA TINDAK LANJUT -->
    <div class="section-header">IV. Kesimpulan & Rencana Tindak Lanjut Pedagogik</div>
    <div class="tindak-lanjut-box">
      <h5>A. Pelaksanaan Remedial</h5>
      <p>
        Siswa yang memperoleh nilai di bawah KKM (${kkmReference}) sebanyak <strong>${analytics.failedCount} orang</strong> akan diberikan bimbingan khusus pada indikator butir soal berdaya pembeda rendah, diikuti dengan tes remedial terjadwal.
      </p>
      <h5 style="margin-top: 6px;">B. Pelaksanaan Pengayaan</h5>
      <p>
        Siswa dengan capaian tuntas sebanyak <strong>${analytics.passedCount} orang</strong> diberikan penugasan pengayaan berbasis literasi dan studi kasus terapan untuk memperdalam capaian pembelajaran.
      </p>
    </div>

    <!-- LEMBAR PENGESAHAN DUA KOLOM -->
    <div class="signature-grid">
      <div>
        <p style="margin: 0;">Mengetahui,<br><strong>Kepala Sekolah</strong></p>
        <div class="signature-space"></div>
        <p class="signature-name">${teacherProfile.principalName || 'Drs. H. Mulyadi, M.Pd.'}</p>
        <p class="signature-nip">NIP. ${teacherProfile.principalNip || '19750820 199903 1 004'}</p>
        ${teacherProfile.principalRank ? `<p class="signature-nip" style="margin-top:2px;">${teacherProfile.principalRank}</p>` : ''}
      </div>

      <div>
        <p style="margin: 0;">
          Ditetapkan di ${teacherProfile.schoolCity || 'Kota Semarang'}<br>
          Pada tanggal: ${currentDateFormatted}<br>
          <strong>Guru Mata Pelajaran</strong>
        </p>
        <div class="signature-space"></div>
        <p class="signature-name">${teacherProfile.name || 'Guru Pengampu'}</p>
        <p class="signature-nip">NIP. ${teacherProfile.nip || '-'}</p>
      </div>
    </div>
  </div>

  <script>
    // Automatically trigger print dialog when opened in a dedicated window or browser tab
    window.addEventListener('DOMContentLoaded', function() {
      // Small timeout to allow styles and fonts to render smoothly
      setTimeout(function() {
        if (window.opener || window.location.search.includes('autoprint=1')) {
          try {
            window.print();
          } catch (e) {
            console.log('Auto-print deferred');
          }
        }
      }, 350);
    });
  </script>
</body>
</html>`;
}

/**
 * Downloads the complete standalone printable HTML document
 * Directly accessible to user to view/print outside of sandboxed iframes
 */
export function downloadPrintableHtml(opts: ReportPrintOptions): void {
  const htmlContent = generatePrintableReportHtml(opts);
  const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  const cleanSubject = opts.subjectName.replace(/[^a-zA-Z0-9]/g, '_');
  const cleanClass = opts.selectedClass.replace(/[^a-zA-Z0-9]/g, '_');
  const dateStr = new Date().toISOString().split('T')[0];

  a.href = url;
  a.download = `Laporan_Analisis_${cleanSubject}_${cleanClass}_${dateStr}.html`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

/**
 * Generates and downloads a real, crisp PDF document directly to user's device
 * Uses jsPDF and html2canvas without relying on browser print dialogs or window.print
 */
export async function exportReportToPdf(
  opts: ReportPrintOptions
): Promise<{ success: boolean; message: string }> {
  let iframe: HTMLIFrameElement | null = null;
  try {
    const htmlContent = generatePrintableReportHtml(opts);

    // Create an isolated iframe to completely shield from Tailwind v4's oklch variables
    iframe = document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.style.left = '-9999px';
    iframe.style.top = '0';
    iframe.style.width = '800px';
    iframe.style.height = '1200px';
    iframe.style.border = '0';
    iframe.style.zIndex = '-9999';
    iframe.setAttribute('aria-hidden', 'true');
    document.body.appendChild(iframe);

    const doc = iframe.contentWindow?.document;
    if (!doc) {
      throw new Error('Gagal menginisialisasi perender dokumen');
    }

    doc.open();
    doc.write(htmlContent);
    doc.close();

    // Allow browser time to layout the HTML and load SVG vectors
    await new Promise((resolve) => setTimeout(resolve, 300));

    const paperContainer = (doc.querySelector('.paper-container') as HTMLElement) || doc.body;

    const canvas = await html2canvas(paperContainer, {
      scale: 2, // Crisp 2x retina sharpness
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff',
      windowWidth: 800,
    });

    if (iframe && iframe.parentNode) {
      iframe.parentNode.removeChild(iframe);
      iframe = null;
    }

    const imgData = canvas.toDataURL('image/jpeg', 0.95);
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
      compress: true,
    });

    const pdfWidth = pdf.internal.pageSize.getWidth(); // 210mm
    const pdfHeight = pdf.internal.pageSize.getHeight(); // 297mm
    const imgWidth = pdfWidth;
    const imgHeight = (canvas.height * pdfWidth) / canvas.width;

    let heightLeft = imgHeight;
    let position = 0;

    // First page
    pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight, undefined, 'FAST');
    heightLeft -= pdfHeight;

    // Additional pages if needed
    while (heightLeft > 5) {
      position = heightLeft - imgHeight;
      pdf.addPage();
      pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight, undefined, 'FAST');
      heightLeft -= pdfHeight;
    }

    const cleanSubject = opts.subjectName.replace(/[^a-zA-Z0-9]/g, '_');
    const cleanClass = opts.selectedClass.replace(/[^a-zA-Z0-9]/g, '_');
    const dateStr = new Date().toISOString().split('T')[0];
    const filename = `Laporan_Analisis_${cleanSubject}_${cleanClass}_${dateStr}.pdf`;

    pdf.save(filename);

    return {
      success: true,
      message: `Berkas PDF "${filename}" berhasil diunduh ke perangkat Anda.`,
    };
  } catch (err: any) {
    if (iframe && iframe.parentNode) {
      iframe.parentNode.removeChild(iframe);
    }
    console.error('Error in exportReportToPdf:', err);
    return {
      success: false,
      message: 'Gagal membuat berkas PDF langsung. Silakan gunakan tombol Unduh File HTML.',
    };
  }
}

/**
 * Robust printing function:
 * 1. Attempts hidden iframe print (which prevents window distortion and isolates print CSS)
 * 2. Falls back to window.print()
 * 3. Returns a boolean indicating if direct browser print was dispatched
 */
export function executePrint(opts: ReportPrintOptions): { success: boolean; message: string } {
  const htmlContent = generatePrintableReportHtml(opts);

  try {
    // Strategy 1: Hidden iframe print
    const existingIframe = document.getElementById('smartgrade-print-frame');
    if (existingIframe) {
      existingIframe.remove();
    }

    const iframe = document.createElement('iframe');
    iframe.id = 'smartgrade-print-frame';
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = '0';
    iframe.style.zIndex = '-9999';
    iframe.setAttribute('aria-hidden', 'true');
    document.body.appendChild(iframe);

    const doc = iframe.contentWindow?.document;
    if (doc) {
      doc.open();
      doc.write(htmlContent);
      doc.close();

      setTimeout(() => {
        try {
          iframe.contentWindow?.focus();
          iframe.contentWindow?.print();
        } catch (iframeErr) {
          console.warn('Iframe print intercepted, attempting window.print fallback', iframeErr);
          try {
            window.print();
          } catch (winErr) {
            console.error('window.print also blocked', winErr);
          }
        }
      }, 250);

      // Clean up after 15 seconds
      setTimeout(() => {
        const f = document.getElementById('smartgrade-print-frame');
        if (f) f.remove();
      }, 15000);

      return {
        success: true,
        message: 'Membuka dialog cetak...',
      };
    }
  } catch (err) {
    console.error('Error during iframe printing', err);
  }

  // Strategy 2: Direct window.print()
  try {
    window.print();
    return {
      success: true,
      message: 'Membuka dialog cetak...',
    };
  } catch (err) {
    console.error('window.print failed', err);
    return {
      success: false,
      message: 'Pencetakan langsung dibatasi oleh peramban. Silakan gunakan tombol "Unduh Dokumen Cetak".',
    };
  }
}

/**
 * Generate Standalone HTML for an Individual Student Assessment Report
 */
export function generateStudentAssessmentReportHtml(
  submission: GradedSubmission,
  teacherProfile: TeacherProfile,
  anonymize: boolean
): string {
  const displayName = anonymize
    ? anonymizeStudentData(submission.studentName, submission.studentId).maskedName
    : submission.studentName;
  const displayId = anonymize
    ? anonymizeStudentData(submission.studentName, submission.studentId).maskedId
    : submission.studentId;

  const currentDateFormatted = new Date().toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  const statusColor = submission.isPassed ? '#15803d' : '#b91c1c';
  const statusText = submission.isPassed ? 'TUNTAS KKM' : 'REMEDIAL';

  const itemsHtml = (submission.items || [])
    .map((item) => {
      const isCorrect = item.isCorrect || item.score >= (item.maxScore || 10) * 0.75;
      const itemStatusColor = isCorrect ? '#15803d' : '#b91c1c';
      const itemStatusText = isCorrect ? 'Benar' : 'Perlu Perbaikan';

      return `
      <tr>
        <td style="text-align: center; font-weight: 700; font-family: monospace;">#${item.number}</td>
        <td style="text-align: center;">${item.type === 'essay' ? 'Uraian / Esai' : 'Pilihan Ganda'}</td>
        <td style="text-align: center; font-weight: 600;">${item.studentAnswer || '-'}</td>
        <td style="text-align: center; color: #475569;">${item.correctAnswer || '-'}</td>
        <td style="text-align: center; font-weight: 700; font-family: monospace;">${item.score} / ${item.maxScore}</td>
        <td style="text-align: center; font-weight: 700; color: ${itemStatusColor};">${itemStatusText}</td>
        <td style="font-size: 8pt; color: #334155;">${item.feedback || '-'}</td>
      </tr>
    `;
    })
    .join('');

  const strengthsHtml = (submission.strengths || [])
    .map((s) => `<li>${s}</li>`)
    .join('');

  const improvementsHtml = (submission.improvements || [])
    .map((i) => `<li>${i}</li>`)
    .join('');

  return `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <title>Rapor Asesmen - ${displayName} (${displayId})</title>
  <style>
    @page {
      size: A4 portrait;
      margin: 12mm 15mm 15mm 15mm;
    }
    * {
      box-sizing: border-box;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif;
      font-size: 9.5pt;
      line-height: 1.4;
      color: #0f172a;
      background: #ffffff;
      margin: 0;
      padding: 15px;
    }
    .paper-container {
      background: #ffffff;
      padding: 24px 32px;
      border: 1px solid #cbd5e1;
      max-width: 210mm;
      margin: 0 auto;
    }
    .kop-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      border-bottom: 3px double #0f172a;
      padding-bottom: 8px;
      margin-bottom: 12px;
    }
    .kop-logo {
      width: 60px;
      height: 60px;
      flex-shrink: 0;
    }
    .kop-text {
      text-align: center;
      flex: 1;
      padding: 0 10px;
    }
    .kop-text h4 {
      margin: 0;
      font-size: 8pt;
      font-weight: 700;
      text-transform: uppercase;
      color: #475569;
    }
    .kop-text h2 {
      margin: 1px 0;
      font-size: 10pt;
      font-weight: 800;
      text-transform: uppercase;
      color: #0f172a;
    }
    .kop-text h1 {
      margin: 2px 0;
      font-size: 12.5pt;
      font-weight: 900;
      text-transform: uppercase;
      color: #0f172a;
    }
    .kop-text p {
      margin: 2px 0 0;
      font-size: 7.5pt;
      color: #475569;
    }
    .doc-title-container {
      text-align: center;
      margin: 10px 0 12px;
    }
    .doc-title {
      font-size: 11pt;
      font-weight: 900;
      text-transform: uppercase;
      text-decoration: underline;
      margin: 0;
    }
    .doc-subtitle {
      font-size: 8pt;
      color: #475569;
      margin: 3px 0 0;
      font-weight: 600;
    }
    table.metadata-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 12px;
      background: #f8fafc;
      border: 1px solid #cbd5e1;
    }
    table.metadata-table td {
      padding: 4px 8px;
      font-size: 8.5pt;
      border: 1px solid #e2e8f0;
    }
    .metadata-label {
      font-weight: 700;
      color: #475569;
      width: 18%;
    }
    .metadata-value {
      font-weight: 600;
      color: #0f172a;
      width: 32%;
    }
    .score-banner {
      display: flex;
      align-items: center;
      justify-content: space-between;
      border: 1px solid #cbd5e1;
      background: #f8fafc;
      padding: 10px 16px;
      border-radius: 6px;
      margin-bottom: 12px;
    }
    .score-main {
      font-size: 24pt;
      font-weight: 900;
      font-family: monospace;
      color: #0f172a;
    }
    .score-badge {
      display: inline-block;
      padding: 4px 10px;
      border-radius: 4px;
      font-size: 9pt;
      font-weight: 800;
      text-transform: uppercase;
    }
    table.data-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 12px;
    }
    table.data-table th,
    table.data-table td {
      border: 1px solid #334155;
      padding: 4.5px 7px;
      font-size: 8pt;
    }
    table.data-table th {
      background: #f1f5f9;
      color: #0f172a;
      font-weight: 700;
      text-align: center;
    }
    .feedback-box {
      border: 1px solid #cbd5e1;
      background: #f8fafc;
      padding: 8px 12px;
      border-radius: 4px;
      margin-bottom: 12px;
      font-size: 8pt;
    }
    .feedback-box h5 {
      margin: 0 0 3px;
      font-size: 8.5pt;
      font-weight: 800;
      text-transform: uppercase;
    }
    .feedback-box ul {
      margin: 2px 0 6px 16px;
      padding: 0;
    }
    .signature-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      text-align: center;
      margin-top: 14px;
      padding-top: 10px;
      page-break-inside: avoid;
    }
    .signature-space {
      height: 50px;
    }
    .signature-name {
      font-weight: 800;
      text-decoration: underline;
      text-transform: uppercase;
      margin: 0;
      font-size: 8.5pt;
    }
    .signature-nip {
      margin: 2px 0 0;
      font-size: 7.5pt;
      font-family: monospace;
      color: #475569;
    }
  </style>
</head>
<body>
  <div class="paper-container">
    <!-- KOP SURAT -->
    <div class="kop-header">
      <div class="kop-logo">
        <svg viewBox="0 0 100 100" width="60" height="60" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="50" cy="50" r="46" stroke="#0f172a" stroke-width="2.5" fill="#f8fafc" />
          <path d="M50 14 L55 26 L68 28 L58 37 L61 50 L50 43 L39 50 L42 37 L32 28 L45 26 Z" fill="#b45309" stroke="#0f172a" stroke-width="1.5" />
          <path d="M22 62 C30 52 42 50 50 56 C58 50 70 52 78 62 C74 74 62 82 50 82 C38 82 26 74 22 62 Z" fill="#1e3a8a" stroke="#0f172a" stroke-width="1.5" />
          <path d="M35 70 C42 66 50 68 50 68 C50 68 58 66 65 70" stroke="#f8fafc" stroke-width="2" stroke-linecap="round" />
          <circle cx="50" cy="38" r="4" fill="#fbbf24" stroke="#0f172a" stroke-width="1" />
        </svg>
      </div>

      <div class="kop-text">
        <h4>PEMERINTAH DAERAH PROVINSI / KABUPATEN</h4>
        <h2>DINAS PENDIDIKAN DAN KEBUDAYAAN</h2>
        <h1>${teacherProfile.schoolName || 'SMA NEGERI PRESTASI INDONESIA'}</h1>
        <p>Alamat: ${teacherProfile.schoolAddress || 'Jl. Pendidikan No. 45'} • Jenjang: ${teacherProfile.gradeLevel || 'SMA/MA'} • Akreditasi: A • NPSN: ${teacherProfile.schoolNpsn || '20328901'}</p>
      </div>

      <div class="kop-logo" style="text-align: right;">
        <svg viewBox="0 0 100 100" width="60" height="60" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect x="10" y="10" width="80" height="80" rx="16" stroke="#0f172a" stroke-width="2.5" fill="#f8fafc" />
          <path d="M30 40 L50 25 L70 40 L70 70 L30 70 Z" fill="#047857" stroke="#0f172a" stroke-width="1.5" />
          <path d="M42 70 L42 52 L58 52 L58 70" fill="#f8fafc" stroke="#0f172a" stroke-width="1.5" />
          <circle cx="50" cy="38" r="5" fill="#f59e0b" />
        </svg>
      </div>
    </div>

    <!-- JUDUL LAPORAN -->
    <div class="doc-title-container">
      <h3 class="doc-title">LEMBAR HASIL PENILAIAN ASESMEN INDIVIDU SISWA</h3>
      <p class="doc-subtitle">Kurikulum Merdeka • Tahun Ajaran 2026/2027</p>
    </div>

    <!-- IDENTITAS SISWA & UJIAN -->
    <table class="metadata-table">
      <tr>
        <td class="metadata-label">Nama Siswa</td>
        <td class="metadata-value">: <strong>${displayName}</strong></td>
        <td class="metadata-label">Mata Pelajaran</td>
        <td class="metadata-value">: ${submission.subject || 'Mata Pelajaran'}</td>
      </tr>
      <tr>
        <td class="metadata-label">NIS / NISN</td>
        <td class="metadata-value font-mono">: ${displayId}</td>
        <td class="metadata-label">Nama Ujian</td>
        <td class="metadata-value">: ${submission.examTitle}</td>
      </tr>
      <tr>
        <td class="metadata-label">Kelas / Rombel</td>
        <td class="metadata-value">: ${submission.classRoom}</td>
        <td class="metadata-label">Standar KKM</td>
        <td class="metadata-value font-mono">: ${submission.kkm || 75}</td>
      </tr>
      <tr>
        <td class="metadata-label">Tanggal Koreksi</td>
        <td class="metadata-value">: ${currentDateFormatted}</td>
        <td class="metadata-label">Status Verifikasi</td>
        <td class="metadata-value">: ${submission.verifiedByTeacher ? 'Terverifikasi Guru' : 'Perlu Tinjauan'}</td>
      </tr>
    </table>

    <!-- BANNER CAPAIAN NILAI -->
    <div class="score-banner">
      <div>
        <span style="font-size: 8pt; font-weight: 700; color: #64748b; text-transform: uppercase;">Perolehan Skor Akhir:</span>
        <div style="display: flex; align-items: baseline; gap: 8px;">
          <span class="score-main">${submission.scorePercentage}</span>
          <span style="font-size: 11pt; font-weight: 700; color: #64748b;">/ 100 poin (Skor Asli: ${submission.totalScore}/${submission.maxTotalScore})</span>
        </div>
      </div>

      <div style="text-align: right;">
        <span class="score-badge" style="background: #e2e8f0; color: #0f172a; margin-right: 6px;">
          Predikat ${submission.gradeLetter}
        </span>
        <span class="score-badge" style="background: ${submission.isPassed ? '#dcfce7' : '#fee2e2'}; color: ${statusColor};">
          ${statusText}
        </span>
      </div>
    </div>

    <!-- TABEL RINCIAN BUTIR SOAL -->
    <div style="font-weight: 800; font-size: 8.5pt; text-transform: uppercase; margin-bottom: 5px;">
      Rincian Penilaian Butir Soal:
    </div>
    <table class="data-table">
      <thead>
        <tr>
          <th style="width: 30px;">No</th>
          <th>Tipe Soal</th>
          <th>Jawaban Siswa</th>
          <th>Kunci Jawaban</th>
          <th>Skor / Maks</th>
          <th>Status</th>
          <th>Catatan Guru</th>
        </tr>
      </thead>
      <tbody>
        ${itemsHtml || '<tr><td colspan="7" style="text-align:center;">Tidak ada rincian soal</td></tr>'}
      </tbody>
    </table>

    <!-- EVALUASI REFLEKSI PEDAGOGIK -->
    <div class="feedback-box">
      <h5>Umpan Balik Kualitatif & Evaluasi Guru:</h5>
      <p style="margin: 0 0 6px; line-height: 1.4;">${submission.summaryFeedback || 'Siswa menunjukkan penguasaan materi yang baik.'}</p>
      
      ${strengthsHtml ? `<strong>Kekuatan Penguasaan Siswa:</strong><ul>${strengthsHtml}</ul>` : ''}
      ${improvementsHtml ? `<strong>Hal yang Perlu Diperbaiki:</strong><ul>${improvementsHtml}</ul>` : ''}
    </div>

    <!-- PENGESAHAN DUA KOLOM -->
    <div class="signature-grid">
      <div>
        <p style="margin: 0;">Mengetahui,<br><strong>Orang Tua / Wali Siswa</strong></p>
        <div class="signature-space"></div>
        <p class="signature-name">( ............................................ )</p>
        <p class="signature-nip">Tanda Tangan & Nama Terang</p>
      </div>

      <div>
        <p style="margin: 0;">
          ${teacherProfile.schoolCity || 'Kota Semarang'}, ${currentDateFormatted}<br>
          <strong>Guru Mata Pelajaran</strong>
        </p>
        <div class="signature-space"></div>
        <p class="signature-name">${teacherProfile.name}</p>
        <p class="signature-nip">NIP. ${teacherProfile.nip}</p>
      </div>
    </div>
  </div>
</body>
</html>`;
}

/**
 * Directly downloads an Individual Student Assessment Report PDF
 */
export async function exportStudentAssessmentToPdf(
  submission: GradedSubmission,
  teacherProfile: TeacherProfile,
  anonymize: boolean
): Promise<{ success: boolean; message: string }> {
  let iframe: HTMLIFrameElement | null = null;
  try {
    const htmlContent = generateStudentAssessmentReportHtml(submission, teacherProfile, anonymize);

    iframe = document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.style.left = '-9999px';
    iframe.style.top = '0';
    iframe.style.width = '800px';
    iframe.style.height = '1200px';
    iframe.style.border = '0';
    iframe.style.zIndex = '-9999';
    document.body.appendChild(iframe);

    const doc = iframe.contentWindow?.document;
    if (!doc) throw new Error('Gagal menginisialisasi perender PDF');

    doc.open();
    doc.write(htmlContent);
    doc.close();

    await new Promise((r) => setTimeout(r, 300));

    const paper = (doc.querySelector('.paper-container') as HTMLElement) || doc.body;

    const canvas = await html2canvas(paper, {
      scale: 2,
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff',
      windowWidth: 800,
    });

    if (iframe && iframe.parentNode) {
      iframe.parentNode.removeChild(iframe);
      iframe = null;
    }

    const imgData = canvas.toDataURL('image/jpeg', 0.95);
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
      compress: true,
    });

    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();
    const imgHeight = (canvas.height * pdfWidth) / canvas.width;

    let heightLeft = imgHeight;
    let position = 0;

    pdf.addImage(imgData, 'JPEG', 0, position, pdfWidth, imgHeight, undefined, 'FAST');
    heightLeft -= pdfHeight;

    while (heightLeft > 5) {
      position = heightLeft - imgHeight;
      pdf.addPage();
      pdf.addImage(imgData, 'JPEG', 0, position, pdfWidth, imgHeight, undefined, 'FAST');
      heightLeft -= pdfHeight;
    }

    const cleanName = submission.studentName.replace(/[^a-zA-Z0-9]/g, '_');
    const cleanNis = submission.studentId.replace(/[^a-zA-Z0-9]/g, '_');
    const dateStr = new Date().toISOString().split('T')[0];
    const filename = `Rapor_Asesmen_${cleanName}_${cleanNis}_${dateStr}.pdf`;

    pdf.save(filename);

    return {
      success: true,
      message: `Rapor PDF siswa ${submission.studentName} berhasil diunduh.`,
    };
  } catch (err: any) {
    if (iframe && iframe.parentNode) {
      iframe.parentNode.removeChild(iframe);
    }
    console.error('Error generating student assessment PDF:', err);
    return {
      success: false,
      message: 'Gagal membuat berkas PDF rapor siswa.',
    };
  }
}

/**
 * Generate Standalone HTML for Buku Daftar Nilai (Grade Ledger Archive)
 */
export function generateBukuNilaiHtml(
  submissions: GradedSubmission[],
  selectedClass: string,
  subjectName: string,
  teacherProfile: TeacherProfile,
  anonymize: boolean
): string {
  const currentDateFormatted = new Date().toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  const classLabel = selectedClass === 'all' ? 'Seluruh Kelas (Rombel Gabungan)' : selectedClass;
  const totalStudents = submissions.length;
  const passedStudents = submissions.filter((s) => s.isPassed).length;
  const passRate = totalStudents > 0 ? Math.round((passedStudents / totalStudents) * 100) : 0;
  const avgScore = totalStudents > 0 ? Math.round((submissions.reduce((a, b) => a + b.scorePercentage, 0) / totalStudents) * 10) / 10 : 0;

  const rowsHtml = submissions
    .sort((a, b) => b.scorePercentage - a.scorePercentage)
    .map((sub, idx) => {
      const displayName = anonymize
        ? anonymizeStudentData(sub.studentName, sub.studentId).maskedName
        : sub.studentName;
      const displayId = anonymize
        ? anonymizeStudentData(sub.studentName, sub.studentId).maskedId
        : sub.studentId;

      const statusColor = sub.isPassed ? '#15803d' : '#b91c1c';
      const statusText = sub.isPassed ? 'TUNTAS' : 'REMEDIAL';

      return `
      <tr>
        <td style="text-align: center; font-weight: 700; font-family: monospace;">${idx + 1}</td>
        <td style="text-align: center; font-family: monospace;">${displayId}</td>
        <td style="font-weight: 600; text-align: left;">${displayName}</td>
        <td style="text-align: center;">${sub.classRoom}</td>
        <td style="text-align: left; font-size: 8pt;">${sub.examTitle}</td>
        <td style="text-align: center; font-weight: 800; font-family: monospace;">${sub.scorePercentage}</td>
        <td style="text-align: center; font-weight: 700;">${sub.gradeLetter}</td>
        <td style="text-align: center; font-weight: 700; color: ${statusColor};">${statusText}</td>
        <td style="text-align: center; font-size: 8pt; color: #475569;">${sub.verifiedByTeacher ? 'Terverifikasi' : 'Tinjauan'}</td>
        <td style="text-align: center; font-size: 8pt; font-family: monospace;">${sub.date || '-'}</td>
      </tr>
    `;
    })
    .join('');

  return `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <title>Buku Daftar Nilai - ${classLabel}</title>
  <style>
    @page {
      size: A4 landscape;
      margin: 12mm 15mm 15mm 15mm;
    }
    * {
      box-sizing: border-box;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif;
      font-size: 9pt;
      line-height: 1.35;
      color: #0f172a;
      background: #ffffff;
      margin: 0;
      padding: 15px;
    }
    .paper-container {
      background: #ffffff;
      padding: 24px 30px;
      border: 1px solid #cbd5e1;
      width: 100%;
      max-width: 297mm;
      margin: 0 auto;
    }
    .kop-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      border-bottom: 3px double #0f172a;
      padding-bottom: 8px;
      margin-bottom: 12px;
    }
    .kop-logo {
      width: 55px;
      height: 55px;
      flex-shrink: 0;
    }
    .kop-text {
      text-align: center;
      flex: 1;
      padding: 0 10px;
    }
    .kop-text h4 {
      margin: 0;
      font-size: 8pt;
      font-weight: 700;
      text-transform: uppercase;
      color: #475569;
    }
    .kop-text h2 {
      margin: 1px 0;
      font-size: 10pt;
      font-weight: 800;
      text-transform: uppercase;
      color: #0f172a;
    }
    .kop-text h1 {
      margin: 2px 0;
      font-size: 12.5pt;
      font-weight: 900;
      text-transform: uppercase;
      color: #0f172a;
    }
    .kop-text p {
      margin: 2px 0 0;
      font-size: 7.5pt;
      color: #475569;
    }
    .doc-title-container {
      text-align: center;
      margin: 10px 0 12px;
    }
    .doc-title {
      font-size: 11.5pt;
      font-weight: 900;
      text-transform: uppercase;
      text-decoration: underline;
      margin: 0;
    }
    table.metadata-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 12px;
      background: #f8fafc;
      border: 1px solid #cbd5e1;
    }
    table.metadata-table td {
      padding: 4px 8px;
      font-size: 8.5pt;
      border: 1px solid #e2e8f0;
    }
    table.data-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 12px;
    }
    table.data-table th,
    table.data-table td {
      border: 1px solid #334155;
      padding: 4px 6px;
      font-size: 8pt;
    }
    table.data-table th {
      background: #f1f5f9;
      color: #0f172a;
      font-weight: 700;
      text-align: center;
    }
    .signature-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      text-align: center;
      margin-top: 14px;
      padding-top: 10px;
      page-break-inside: avoid;
    }
    .signature-space {
      height: 45px;
    }
    .signature-name {
      font-weight: 800;
      text-decoration: underline;
      text-transform: uppercase;
      margin: 0;
      font-size: 8.5pt;
    }
    .signature-nip {
      margin: 2px 0 0;
      font-size: 7.5pt;
      font-family: monospace;
      color: #475569;
    }
  </style>
</head>
<body>
  <div class="paper-container">
    <!-- KOP SURAT -->
    <div class="kop-header">
      <div class="kop-logo">
        <svg viewBox="0 0 100 100" width="55" height="55" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="50" cy="50" r="46" stroke="#0f172a" stroke-width="2.5" fill="#f8fafc" />
          <path d="M50 14 L55 26 L68 28 L58 37 L61 50 L50 43 L39 50 L42 37 L32 28 L45 26 Z" fill="#b45309" stroke="#0f172a" stroke-width="1.5" />
          <path d="M22 62 C30 52 42 50 50 56 C58 50 70 52 78 62 C74 74 62 82 50 82 C38 82 26 74 22 62 Z" fill="#1e3a8a" stroke="#0f172a" stroke-width="1.5" />
          <path d="M35 70 C42 66 50 68 50 68 C50 68 58 66 65 70" stroke="#f8fafc" stroke-width="2" stroke-linecap="round" />
          <circle cx="50" cy="38" r="4" fill="#fbbf24" stroke="#0f172a" stroke-width="1" />
        </svg>
      </div>

      <div class="kop-text">
        <h4>PEMERINTAH DAERAH PROVINSI / KABUPATEN</h4>
        <h2>DINAS PENDIDIKAN DAN KEBUDAYAAN</h2>
        <h1>${teacherProfile.schoolName || 'SMA NEGERI PRESTASI INDONESIA'}</h1>
        <p>Alamat: ${teacherProfile.schoolAddress || 'Jl. Pendidikan No. 45'} • Jenjang: ${teacherProfile.gradeLevel || 'SMA/MA'} • Akreditasi: A • NPSN: ${teacherProfile.schoolNpsn || '20328901'}</p>
      </div>

      <div class="kop-logo" style="text-align: right;">
        <svg viewBox="0 0 100 100" width="55" height="55" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect x="10" y="10" width="80" height="80" rx="16" stroke="#0f172a" stroke-width="2.5" fill="#f8fafc" />
          <path d="M30 40 L50 25 L70 40 L70 70 L30 70 Z" fill="#047857" stroke="#0f172a" stroke-width="1.5" />
          <path d="M42 70 L42 52 L58 52 L58 70" fill="#f8fafc" stroke="#0f172a" stroke-width="1.5" />
          <circle cx="50" cy="38" r="5" fill="#f59e0b" />
        </svg>
      </div>
    </div>

    <!-- JUDUL BUKU DAFTAR NILAI -->
    <div class="doc-title-container">
      <h3 class="doc-title">BUKU DAFTAR NILAI & ARSIP HASIL ASESMEN PESERTA DIDIK</h3>
      <p style="margin: 3px 0 0; font-size: 8.5pt; font-weight: 600; color: #475569;">Kurikulum Merdeka • Dokumen Arsip Resmi Sekolah</p>
    </div>

    <!-- METADATA -->
    <table class="metadata-table">
      <tr>
        <td style="font-weight:700; width:15%;">Mata Pelajaran</td>
        <td style="width:35%;">: ${subjectName || 'Matematika'}</td>
        <td style="font-weight:700; width:15%;">Kelas / Rombel</td>
        <td style="width:35%;">: ${classLabel}</td>
      </tr>
      <tr>
        <td style="font-weight:700;">Guru Pengampu</td>
        <td>: ${teacherProfile.name}</td>
        <td style="font-weight:700;">Tanggal Laporan</td>
        <td>: ${currentDateFormatted}</td>
      </tr>
      <tr>
        <td style="font-weight:700;">NIP Guru</td>
        <td style="font-family:monospace;">: ${teacherProfile.nip}</td>
        <td style="font-weight:700;">Ringkasan Nilai</td>
        <td>: Total ${totalStudents} Siswa • Rata-rata ${avgScore} • Ketuntasan ${passRate}%</td>
      </tr>
    </table>

    <!-- TABEL LEGER NILAI -->
    <table class="data-table">
      <thead>
        <tr>
          <th style="width: 28px;">No</th>
          <th style="width: 80px;">NIS</th>
          <th>Nama Lengkap Siswa</th>
          <th style="width: 65px;">Kelas</th>
          <th>Nama Ujian / Asesmen</th>
          <th style="width: 55px;">Nilai</th>
          <th style="width: 55px;">Predikat</th>
          <th style="width: 75px;">Status</th>
          <th style="width: 80px;">Verifikasi</th>
          <th style="width: 80px;">Tanggal</th>
        </tr>
      </thead>
      <tbody>
        ${rowsHtml || '<tr><td colspan="10" style="text-align:center;">Belum ada data nilai asesmen siswa</td></tr>'}
      </tbody>
    </table>

    <!-- PENGESAHAN DUA KOLOM -->
    <div class="signature-grid">
      <div>
        <p style="margin: 0;">Mengetahui,<br><strong>Kepala Sekolah</strong></p>
        <div class="signature-space"></div>
        <p class="signature-name">${teacherProfile.principalName || 'Drs. H. Mulyadi, M.Pd.'}</p>
        <p class="signature-nip">NIP. ${teacherProfile.principalNip || '19750820 199903 1 004'}</p>
        ${teacherProfile.principalRank ? `<p class="signature-nip" style="margin-top:2px;">${teacherProfile.principalRank}</p>` : ''}
      </div>

      <div>
        <p style="margin: 0;">
          ${teacherProfile.schoolCity || 'Kota Semarang'}, ${currentDateFormatted}<br>
          <strong>Guru Mata Pelajaran</strong>
        </p>
        <div class="signature-space"></div>
        <p class="signature-name">${teacherProfile.name}</p>
        <p class="signature-nip">NIP. ${teacherProfile.nip}</p>
      </div>
    </div>
  </div>
</body>
</html>`;
}

/**
 * Directly downloads Buku Daftar Nilai (Grade Ledger) as official PDF
 */
export async function exportBukuNilaiToPdf(
  submissions: GradedSubmission[],
  selectedClass: string,
  subjectName: string,
  teacherProfile: TeacherProfile,
  anonymize: boolean
): Promise<{ success: boolean; message: string }> {
  let iframe: HTMLIFrameElement | null = null;
  try {
    const htmlContent = generateBukuNilaiHtml(submissions, selectedClass, subjectName, teacherProfile, anonymize);

    iframe = document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.style.left = '-9999px';
    iframe.style.top = '0';
    iframe.style.width = '1100px';
    iframe.style.height = '1400px';
    iframe.style.border = '0';
    iframe.style.zIndex = '-9999';
    document.body.appendChild(iframe);

    const doc = iframe.contentWindow?.document;
    if (!doc) throw new Error('Gagal menginisialisasi perender PDF');

    doc.open();
    doc.write(htmlContent);
    doc.close();

    await new Promise((r) => setTimeout(r, 350));

    const paper = (doc.querySelector('.paper-container') as HTMLElement) || doc.body;

    const canvas = await html2canvas(paper, {
      scale: 2,
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff',
      windowWidth: 1100,
    });

    if (iframe && iframe.parentNode) {
      iframe.parentNode.removeChild(iframe);
      iframe = null;
    }

    const imgData = canvas.toDataURL('image/jpeg', 0.95);
    const pdf = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: 'a4',
      compress: true,
    });

    const pdfWidth = pdf.internal.pageSize.getWidth(); // 297mm
    const pdfHeight = pdf.internal.pageSize.getHeight(); // 210mm
    const imgHeight = (canvas.height * pdfWidth) / canvas.width;

    let heightLeft = imgHeight;
    let position = 0;

    pdf.addImage(imgData, 'JPEG', 0, position, pdfWidth, imgHeight, undefined, 'FAST');
    heightLeft -= pdfHeight;

    while (heightLeft > 5) {
      position = heightLeft - imgHeight;
      pdf.addPage();
      pdf.addImage(imgData, 'JPEG', 0, position, pdfWidth, imgHeight, undefined, 'FAST');
      heightLeft -= pdfHeight;
    }

    const cleanClass = selectedClass.replace(/[^a-zA-Z0-9]/g, '_');
    const dateStr = new Date().toISOString().split('T')[0];
    const filename = `Buku_Daftar_Nilai_${cleanClass}_${dateStr}.pdf`;

    pdf.save(filename);

    return {
      success: true,
      message: `Buku Daftar Nilai PDF (${filename}) berhasil diunduh.`,
    };
  } catch (err: any) {
    if (iframe && iframe.parentNode) {
      iframe.parentNode.removeChild(iframe);
    }
    console.error('Error generating Buku Nilai PDF:', err);
    return {
      success: false,
      message: 'Gagal membuat berkas PDF Buku Daftar Nilai.',
    };
  }
}

/**
 * Helper to trigger client-side file downloads with UTF-8 BOM
 */
function downloadFileWithBlob(content: string, filename: string, mimeType: string): void {
  // Prepend UTF-8 BOM so Excel and Word open special Indonesian characters properly
  const bom = '\uFEFF';
  const blob = new Blob([bom + content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

// =========================================================================
// 1. WORD (.doc / .docx) EXPORT FUNCTIONS
// =========================================================================

/**
 * Export Laporan Analisis Nilai to Microsoft Word (.doc)
 */
export async function exportReportToWord(
  opts: ReportPrintOptions
): Promise<{ success: boolean; message: string }> {
  try {
    const {
      analytics,
      selectedClass,
      kkmReference,
      subjectName,
      examTitle,
      teacherProfile,
      anonymizeEnabled,
    } = opts;

    const classLabel = selectedClass === 'all' ? 'Seluruh Kelas' : selectedClass;
    const dateStr = new Date().toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
    const includeKop = teacherProfile.includeOfficialKop !== false;
    const includeSig = teacherProfile.includeSignatures !== false;

    const itemRows = analytics.itemDifficulty
      .map(
        (it) => `
      <tr>
        <td style="text-align:center;">#${it.questionNumber}</td>
        <td style="text-align:center;">${it.type === 'essay' ? 'Uraian' : 'PG'}</td>
        <td style="text-align:center;">${it.correctCount}</td>
        <td style="text-align:center;">${it.incorrectCount}</td>
        <td style="text-align:center; font-weight:bold;">${it.correctRate}%</td>
        <td style="text-align:center;">${it.difficultyCategory}</td>
        <td style="text-align:center;">${it.discriminationIndex} (${it.discriminationCategory})</td>
        <td style="text-align:center; font-weight:bold;">${it.recommendation}</td>
      </tr>`
      )
      .join('');

    const studentRows = analytics.studentRankings
      .map((st) => {
        const name = anonymizeEnabled
          ? anonymizeStudentData(st.studentName, st.studentId).maskedName
          : st.studentName;
        const id = anonymizeEnabled
          ? anonymizeStudentData(st.studentName, st.studentId).maskedId
          : st.studentId;
        return `
      <tr>
        <td style="text-align:center; font-weight:bold;">${st.rank}</td>
        <td>${name}</td>
        <td style="text-align:center;">${id}</td>
        <td style="text-align:center;">${st.classRoom}</td>
        <td style="text-align:center; font-weight:bold;">${st.scorePercentage}</td>
        <td style="text-align:center; font-weight:bold;">${st.gradeLetter}</td>
        <td style="text-align:center; font-weight:bold; color:${st.isPassed ? '#15803d' : '#b91c1c'};">${st.isPassed ? 'TUNTAS' : 'REMEDIAL'}</td>
        <td style="text-align:center;">${st.verifiedByTeacher ? 'Terverifikasi' : 'Tinjauan'}</td>
      </tr>`;
      })
      .join('');

    const wordHtml = `
<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
<head>
<meta charset='utf-8'>
<!--[if gte mso 9]>
<xml>
 <w:WordDocument>
  <w:View>Print</w:View>
  <w:Zoom>100</w:Zoom>
  <w:DoNotOptimizeForBrowser/>
 </w:WordDocument>
</xml>
<![endif]-->
<style>
@page Section1 { size: 595.3pt 841.9pt; margin: 1.0in 1.0in 1.0in 1.0in; mso-header-margin: 35.4pt; mso-footer-margin: 35.4pt; }
div.Section1 { page: Section1; }
body { font-family: 'Calibri', 'Arial', sans-serif; font-size: 11pt; color: #000000; line-height: 1.3; }
table { width: 100%; border-collapse: collapse; margin-top: 8pt; margin-bottom: 12pt; }
th, td { border: 1pt solid #333333; padding: 5pt 7pt; font-size: 9.5pt; }
th { background-color: #f1f5f9; font-weight: bold; text-align: center; }
.kop { text-align: center; border-bottom: 3pt double #000; padding-bottom: 8pt; margin-bottom: 12pt; }
.title { text-align: center; font-size: 13pt; font-weight: bold; text-decoration: underline; margin-top: 10pt; }
.subtitle { text-align: center; font-size: 9pt; color: #444; margin-bottom: 12pt; }
.section-head { font-size: 11pt; font-weight: bold; margin-top: 14pt; margin-bottom: 4pt; color: #0f172a; }
</style>
</head>
<body>
<div class="Section1">
  ${
    includeKop
      ? `<div class="kop">
    <h3 style="margin:0; font-size:10pt; text-transform:uppercase;">PEMERINTAH DAERAH PROVINSI / KABUPATEN</h3>
    <h2 style="margin:2pt 0; font-size:12pt; text-transform:uppercase;">DINAS PENDIDIKAN DAN KEBUDAYAAN</h2>
    <h1 style="margin:2pt 0; font-size:14pt; text-transform:uppercase;">${teacherProfile.schoolName}</h1>
    <p style="margin:0; font-size:8.5pt;">Alamat: ${teacherProfile.schoolAddress || 'Jl. Pendidikan No. 45'} • Akreditasi: A • Jenjang: ${teacherProfile.gradeLevel} • NPSN: ${teacherProfile.schoolNpsn || '20328901'}</p>
  </div>`
      : ''
  }

  <div class="title">LAPORAN ANALISIS HASIL PENILAIAN & EVALUASI BELAJAR</div>
  <div class="subtitle">Kurikulum Merdeka • Dokumen Resmi Sekolah</div>

  <table style="border:none; margin-bottom:10pt;">
    <tr>
      <td style="border:none; width:18%; font-weight:bold;">Mata Pelajaran</td>
      <td style="border:none; width:32%;">: ${subjectName}</td>
      <td style="border:none; width:18%; font-weight:bold;">Kelas / Rombel</td>
      <td style="border:none; width:32%;">: ${classLabel}</td>
    </tr>
    <tr>
      <td style="border:none; font-weight:bold;">Nama Ujian</td>
      <td style="border:none;">: ${examTitle}</td>
      <td style="border:none; font-weight:bold;">Standar KKM</td>
      <td style="border:none;">: ${kkmReference}</td>
    </tr>
    <tr>
      <td style="border:none; font-weight:bold;">Guru Pengampu</td>
      <td style="border:none;">: ${teacherProfile.name}</td>
      <td style="border:none; font-weight:bold;">Tanggal Pelaporan</td>
      <td style="border:none;">: ${dateStr}</td>
    </tr>
    <tr>
      <td style="border:none; font-weight:bold;">NIP Guru</td>
      <td style="border:none;">: ${teacherProfile.nip}</td>
      <td style="border:none; font-weight:bold;">Jumlah Peserta</td>
      <td style="border:none;">: ${analytics.totalStudents} Siswa</td>
    </tr>
  </table>

  <div class="section-head">I. Ringkasan Parameter Statistik & Ketuntasan Belajar</div>
  <table>
    <thead>
      <tr>
        <th>Total Peserta</th>
        <th>Rata-Rata (Mean)</th>
        <th>Median</th>
        <th>Standar Deviasi</th>
        <th>Ketuntasan KKM</th>
        <th>Tertinggi</th>
        <th>Terendah</th>
      </tr>
    </thead>
    <tbody>
      <tr style="text-align:center;">
        <td>${analytics.totalStudents} Siswa</td>
        <td><strong>${analytics.averageScore}</strong></td>
        <td>${analytics.medianScore}</td>
        <td>±${analytics.standardDeviation}</td>
        <td><strong>${analytics.passRatePercentage}%</strong> (${analytics.passedCount} Tuntas)</td>
        <td>${analytics.highestScore}</td>
        <td>${analytics.lowestScore}</td>
      </tr>
    </tbody>
  </table>

  <div class="section-head">II. Analisis Kualitas Butir Soal (Psikometrik)</div>
  <table>
    <thead>
      <tr>
        <th>No</th>
        <th>Tipe</th>
        <th>Benar</th>
        <th>Salah</th>
        <th>Tingkat Kesukaran (P)</th>
        <th>Kategori P</th>
        <th>Daya Pembeda (D)</th>
        <th>Rekomendasi Soal</th>
      </tr>
    </thead>
    <tbody>
      ${itemRows}
    </tbody>
  </table>

  <div class="section-head">III. Rekapitulasi Perolehan Nilai & Peringkat Siswa</div>
  <table>
    <thead>
      <tr>
        <th>Rank</th>
        <th>Nama Siswa</th>
        <th>NIS</th>
        <th>Kelas</th>
        <th>Nilai Akhir</th>
        <th>Predikat</th>
        <th>Status KKM</th>
        <th>Status Verifikasi</th>
      </tr>
    </thead>
    <tbody>
      ${studentRows}
    </tbody>
  </table>

  ${
    includeSig
      ? `<table style="border:none; margin-top:25pt; width:100%;">
    <tr>
      <td style="border:none; text-align:center; width:50%;">
        Mengetahui,<br><strong>Kepala Sekolah</strong><br><br><br><br>
        <strong>${teacherProfile.principalName || 'Drs. H. Mulyadi, M.Pd.'}</strong><br>
        NIP. ${teacherProfile.principalNip || '19750820 199903 1 004'}${teacherProfile.principalRank ? `<br><span style="font-size:9pt; color:#475569;">${teacherProfile.principalRank}</span>` : ''}
      </td>
      <td style="border:none; text-align:center; width:50%;">
        ${teacherProfile.schoolCity || 'Kota Semarang'}, ${dateStr}<br>
        <strong>Guru Mata Pelajaran</strong><br><br><br><br>
        <strong>${teacherProfile.name}</strong><br>
        NIP. ${teacherProfile.nip}
      </td>
    </tr>
  </table>`
      : ''
  }
</div>
</body>
</html>`;

    const cleanSubject = subjectName.replace(/[^a-zA-Z0-9]/g, '_');
    const cleanClass = selectedClass.replace(/[^a-zA-Z0-9]/g, '_');
    const fileDate = new Date().toISOString().split('T')[0];
    const filename = `Laporan_Analisis_${cleanSubject}_${cleanClass}_${fileDate}.doc`;

    downloadFileWithBlob(wordHtml, filename, 'application/msword;charset=utf-8');

    return {
      success: true,
      message: `Berkas Word "${filename}" berhasil diunduh.`,
    };
  } catch (err: any) {
    console.error('Error in exportReportToWord:', err);
    return {
      success: false,
      message: 'Gagal membuat dokumen Word laporan analisis.',
    };
  }
}

/**
 * Export Individual Student Assessment to Microsoft Word (.doc)
 */
export async function exportStudentAssessmentToWord(
  submission: GradedSubmission,
  teacherProfile: TeacherProfile,
  anonymize: boolean = false
): Promise<{ success: boolean; message: string }> {
  try {
    const displayName = anonymize
      ? anonymizeStudentData(submission.studentName, submission.studentId).maskedName
      : submission.studentName;
    const displayId = anonymize
      ? anonymizeStudentData(submission.studentName, submission.studentId).maskedId
      : submission.studentId;

    const dateStr = new Date().toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
    const includeKop = teacherProfile.includeOfficialKop !== false;
    const includeSig = teacherProfile.includeSignatures !== false;

    const itemsRows = (submission.items || [])
      .map((it) => {
        const isOk = it.isCorrect || it.score >= (it.maxScore || 10) * 0.75;
        return `
      <tr>
        <td style="text-align:center;">#${it.number}</td>
        <td style="text-align:center;">${it.type === 'essay' ? 'Uraian' : 'PG'}</td>
        <td style="text-align:center;">${it.studentAnswer || '-'}</td>
        <td style="text-align:center;">${it.correctAnswer || '-'}</td>
        <td style="text-align:center; font-weight:bold;">${it.score} / ${it.maxScore}</td>
        <td style="text-align:center; font-weight:bold; color:${isOk ? '#15803d' : '#b91c1c'};">${isOk ? 'Benar' : 'Perlu Perbaikan'}</td>
        <td>${it.feedback || '-'}</td>
      </tr>`;
      })
      .join('');

    const wordHtml = `
<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
<head>
<meta charset='utf-8'>
<!--[if gte mso 9]>
<xml>
 <w:WordDocument>
  <w:View>Print</w:View>
  <w:Zoom>100</w:Zoom>
  <w:DoNotOptimizeForBrowser/>
 </w:WordDocument>
</xml>
<![endif]-->
<style>
@page Section1 { size: 595.3pt 841.9pt; margin: 1.0in 1.0in 1.0in 1.0in; }
div.Section1 { page: Section1; }
body { font-family: 'Calibri', 'Arial', sans-serif; font-size: 11pt; color: #000000; line-height: 1.35; }
table { width: 100%; border-collapse: collapse; margin-top: 8pt; margin-bottom: 12pt; }
th, td { border: 1pt solid #333333; padding: 5pt 7pt; font-size: 9.5pt; }
th { background-color: #f1f5f9; font-weight: bold; text-align: center; }
.kop { text-align: center; border-bottom: 3pt double #000; padding-bottom: 8pt; margin-bottom: 12pt; }
.title { text-align: center; font-size: 13pt; font-weight: bold; text-decoration: underline; margin-top: 10pt; }
.subtitle { text-align: center; font-size: 9pt; color: #444; margin-bottom: 12pt; }
</style>
</head>
<body>
<div class="Section1">
  ${
    includeKop
      ? `<div class="kop">
    <h3 style="margin:0; font-size:10pt; text-transform:uppercase;">PEMERINTAH DAERAH PROVINSI / KABUPATEN</h3>
    <h2 style="margin:2pt 0; font-size:12pt; text-transform:uppercase;">DINAS PENDIDIKAN DAN KEBUDAYAAN</h2>
    <h1 style="margin:2pt 0; font-size:14pt; text-transform:uppercase;">${teacherProfile.schoolName}</h1>
    <p style="margin:0; font-size:8.5pt;">Alamat: ${teacherProfile.schoolAddress || 'Jl. Pendidikan No. 45'} • Jenjang: ${teacherProfile.gradeLevel} • Akreditasi: A • NPSN: ${teacherProfile.schoolNpsn || '20328901'}</p>
  </div>`
      : ''
  }

  <div class="title">LEMBAR HASIL PENILAIAN ASESMEN INDIVIDU SISWA</div>
  <div class="subtitle">Kurikulum Merdeka • Tahun Ajaran 2026/2027</div>

  <table style="border:none; margin-bottom:10pt;">
    <tr>
      <td style="border:none; width:18%; font-weight:bold;">Nama Siswa</td>
      <td style="border:none; width:32%;">: <strong>${displayName}</strong></td>
      <td style="border:none; width:18%; font-weight:bold;">Mata Pelajaran</td>
      <td style="border:none; width:32%;">: ${submission.subject}</td>
    </tr>
    <tr>
      <td style="border:none; font-weight:bold;">NIS / NISN</td>
      <td style="border:none;">: ${displayId}</td>
      <td style="border:none; font-weight:bold;">Nama Ujian</td>
      <td style="border:none;">: ${submission.examTitle}</td>
    </tr>
    <tr>
      <td style="border:none; font-weight:bold;">Kelas / Rombel</td>
      <td style="border:none;">: ${submission.classRoom}</td>
      <td style="border:none; font-weight:bold;">Standar KKM</td>
      <td style="border:none;">: ${submission.kkm || 75}</td>
    </tr>
    <tr>
      <td style="border:none; font-weight:bold;">Tanggal Koreksi</td>
      <td style="border:none;">: ${dateStr}</td>
      <td style="border:none; font-weight:bold;">Status Audit</td>
      <td style="border:none;">: ${submission.verifiedByTeacher ? 'Terverifikasi Guru' : 'Perlu Tinjauan'}</td>
    </tr>
  </table>

  <div style="background-color:#f1f5f9; border:1pt solid #cbd5e1; padding:10pt; margin-bottom:12pt; text-align:center;">
    <span style="font-size:10pt; font-weight:bold; text-transform:uppercase; color:#475569;">Capaian Skor Akhir Murid:</span><br>
    <span style="font-size:24pt; font-weight:bold; color:#0f172a;">${submission.scorePercentage} / 100</span>
    <span style="font-size:11pt; font-weight:bold; margin-left:10pt;">(Predikat ${submission.gradeLetter} • ${submission.isPassed ? 'TUNTAS KKM' : 'REMEDIAL'})</span>
  </div>

  <div style="font-weight:bold; font-size:10pt; margin-bottom:4pt;">Rincian Penilaian Butir Soal:</div>
  <table>
    <thead>
      <tr>
        <th style="width:30px;">No</th>
        <th>Tipe Soal</th>
        <th>Jawaban Siswa</th>
        <th>Kunci Acuan</th>
        <th>Skor</th>
        <th>Status</th>
        <th>Catatan Guru</th>
      </tr>
    </thead>
    <tbody>
      ${itemsRows}
    </tbody>
  </table>

  <div style="background-color:#f8fafc; border:1pt solid #cbd5e1; padding:8pt; margin-bottom:12pt;">
    <strong>Catatan & Umpan Balik Guru:</strong>
    <p style="margin:4pt 0;">${submission.summaryFeedback || 'Siswa menunjukkan penguasaan materi yang baik.'}</p>
    ${
      submission.strengths?.length
        ? `<p style="margin:2pt 0; font-size:9pt;"><strong>Kekuatan:</strong> ${submission.strengths.join(', ')}</p>`
        : ''
    }
    ${
      submission.improvements?.length
        ? `<p style="margin:2pt 0; font-size:9pt;"><strong>Perlu Peningkatan:</strong> ${submission.improvements.join(', ')}</p>`
        : ''
    }
  </div>

  ${
    includeSig
      ? `<table style="border:none; margin-top:20pt; width:100%;">
    <tr>
      <td style="border:none; text-align:center; width:50%;">
        Mengetahui,<br><strong>Orang Tua / Wali Siswa</strong><br><br><br><br>
        ( ............................................ )<br>
        Tanda Tangan & Nama Terang
      </td>
      <td style="border:none; text-align:center; width:50%;">
        ${teacherProfile.schoolCity || 'Kota Semarang'}, ${dateStr}<br>
        <strong>Guru Mata Pelajaran</strong><br><br><br><br>
        <strong>${teacherProfile.name}</strong><br>
        NIP. ${teacherProfile.nip}
      </td>
    </tr>
  </table>`
      : ''
  }
</div>
</body>
</html>`;

    const cleanName = submission.studentName.replace(/[^a-zA-Z0-9]/g, '_');
    const cleanNis = submission.studentId.replace(/[^a-zA-Z0-9]/g, '_');
    const fileDate = new Date().toISOString().split('T')[0];
    const filename = `Rapor_Asesmen_${cleanName}_${cleanNis}_${fileDate}.doc`;

    downloadFileWithBlob(wordHtml, filename, 'application/msword;charset=utf-8');

    return {
      success: true,
      message: `Rapor Word (${filename}) siswa ${submission.studentName} berhasil diunduh.`,
    };
  } catch (err: any) {
    console.error('Error in exportStudentAssessmentToWord:', err);
    return {
      success: false,
      message: 'Gagal membuat dokumen Word rapor siswa.',
    };
  }
}

/**
 * Export Buku Daftar Nilai to Microsoft Word (.doc)
 */
export async function exportBukuNilaiToWord(
  submissions: GradedSubmission[],
  selectedClass: string,
  subjectName: string,
  teacherProfile: TeacherProfile,
  anonymize: boolean
): Promise<{ success: boolean; message: string }> {
  try {
    const classLabel = selectedClass === 'all' ? 'Seluruh Kelas' : selectedClass;
    const dateStr = new Date().toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
    const includeKop = teacherProfile.includeOfficialKop !== false;
    const includeSig = teacherProfile.includeSignatures !== false;

    const rows = [...submissions]
      .sort((a, b) => b.scorePercentage - a.scorePercentage)
      .map((sub, idx) => {
        const name = anonymize
          ? anonymizeStudentData(sub.studentName, sub.studentId).maskedName
          : sub.studentName;
        const id = anonymize
          ? anonymizeStudentData(sub.studentName, sub.studentId).maskedId
          : sub.studentId;
        return `
      <tr>
        <td style="text-align:center;">${idx + 1}</td>
        <td style="text-align:center;">${id}</td>
        <td><strong>${name}</strong></td>
        <td style="text-align:center;">${sub.classRoom}</td>
        <td>${sub.examTitle}</td>
        <td style="text-align:center; font-weight:bold;">${sub.scorePercentage}</td>
        <td style="text-align:center; font-weight:bold;">${sub.gradeLetter}</td>
        <td style="text-align:center; font-weight:bold; color:${sub.isPassed ? '#15803d' : '#b91c1c'};">${sub.isPassed ? 'TUNTAS' : 'REMEDIAL'}</td>
        <td style="text-align:center;">${sub.verifiedByTeacher ? 'Verif' : 'Tinjau'}</td>
        <td style="text-align:center;">${sub.date || '-'}</td>
      </tr>`;
      })
      .join('');

    const wordHtml = `
<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
<head>
<meta charset='utf-8'>
<!--[if gte mso 9]>
<xml>
 <w:WordDocument>
  <w:View>Print</w:View>
  <w:Zoom>100</w:Zoom>
  <w:DoNotOptimizeForBrowser/>
 </w:WordDocument>
</xml>
<![endif]-->
<style>
@page SectionLandscape { size: 841.9pt 595.3pt; margin: 0.8in 0.8in 0.8in 0.8in; mso-header-margin: 35.4pt; mso-footer-margin: 35.4pt; }
div.SectionLandscape { page: SectionLandscape; }
body { font-family: 'Calibri', 'Arial', sans-serif; font-size: 10pt; color: #000000; line-height: 1.3; }
table { width: 100%; border-collapse: collapse; margin-top: 8pt; margin-bottom: 12pt; }
th, td { border: 1pt solid #333333; padding: 4.5pt 6pt; font-size: 9pt; }
th { background-color: #f1f5f9; font-weight: bold; text-align: center; }
.kop { text-align: center; border-bottom: 3pt double #000; padding-bottom: 6pt; margin-bottom: 10pt; }
.title { text-align: center; font-size: 13pt; font-weight: bold; text-decoration: underline; margin-top: 8pt; }
.subtitle { text-align: center; font-size: 9pt; color: #444; margin-bottom: 10pt; }
</style>
</head>
<body>
<div class="SectionLandscape">
  ${
    includeKop
      ? `<div class="kop">
    <h3 style="margin:0; font-size:10pt; text-transform:uppercase;">PEMERINTAH DAERAH PROVINSI / KABUPATEN</h3>
    <h2 style="margin:2pt 0; font-size:12pt; text-transform:uppercase;">DINAS PENDIDIKAN DAN KEBUDAYAAN</h2>
    <h1 style="margin:2pt 0; font-size:14pt; text-transform:uppercase;">${teacherProfile.schoolName}</h1>
    <p style="margin:0; font-size:8.5pt;">Alamat: ${teacherProfile.schoolAddress || 'Jl. Pendidikan No. 45'} • Akreditasi: A • Jenjang: ${teacherProfile.gradeLevel} • NPSN: ${teacherProfile.schoolNpsn || '20328901'}</p>
  </div>`
      : ''
  }

  <div class="title">BUKU DAFTAR NILAI & ARSIP HASIL ASESMEN PESERTA DIDIK</div>
  <div class="subtitle">Kurikulum Merdeka • Dokumen Arsip Resmi Sekolah</div>

  <table style="border:none; margin-bottom:8pt;">
    <tr>
      <td style="border:none; width:15%; font-weight:bold;">Mata Pelajaran</td>
      <td style="border:none; width:35%;">: ${subjectName}</td>
      <td style="border:none; width:15%; font-weight:bold;">Kelas / Rombel</td>
      <td style="border:none; width:35%;">: ${classLabel}</td>
    </tr>
    <tr>
      <td style="border:none; font-weight:bold;">Guru Pengampu</td>
      <td style="border:none;">: ${teacherProfile.name}</td>
      <td style="border:none; font-weight:bold;">Tanggal Laporan</td>
      <td style="border:none;">: ${dateStr}</td>
    </tr>
    <tr>
      <td style="border:none; font-weight:bold;">NIP Guru</td>
      <td style="border:none;">: ${teacherProfile.nip}</td>
      <td style="border:none; font-weight:bold;">Total Murid</td>
      <td style="border:none;">: ${submissions.length} Siswa</td>
    </tr>
  </table>

  <table>
    <thead>
      <tr>
        <th style="width:28px;">No</th>
        <th style="width:75px;">NIS</th>
        <th>Nama Lengkap Siswa</th>
        <th style="width:65px;">Kelas</th>
        <th>Nama Asesmen</th>
        <th style="width:50px;">Nilai</th>
        <th style="width:50px;">Predikat</th>
        <th style="width:75px;">Status</th>
        <th style="width:75px;">Verifikasi</th>
        <th style="width:80px;">Tanggal</th>
      </tr>
    </thead>
    <tbody>
      ${rows}
    </tbody>
  </table>

  ${
    includeSig
      ? `<table style="border:none; margin-top:20pt; width:100%;">
    <tr>
      <td style="border:none; text-align:center; width:50%;">
        Mengetahui,<br><strong>Kepala Sekolah</strong><br><br><br><br>
        <strong>${teacherProfile.principalName || 'Drs. H. Mulyadi, M.Pd.'}</strong><br>
        NIP. ${teacherProfile.principalNip || '19750820 199903 1 004'}${teacherProfile.principalRank ? `<br><span style="font-size:9pt; color:#475569;">${teacherProfile.principalRank}</span>` : ''}
      </td>
      <td style="border:none; text-align:center; width:50%;">
        ${teacherProfile.schoolCity || 'Kota Semarang'}, ${dateStr}<br>
        <strong>Guru Mata Pelajaran</strong><br><br><br><br>
        <strong>${teacherProfile.name}</strong><br>
        NIP. ${teacherProfile.nip}
      </td>
    </tr>
  </table>`
      : ''
  }
</div>
</body>
</html>`;

    const cleanClass = selectedClass.replace(/[^a-zA-Z0-9]/g, '_');
    const fileDate = new Date().toISOString().split('T')[0];
    const filename = `Buku_Daftar_Nilai_${cleanClass}_${fileDate}.doc`;

    downloadFileWithBlob(wordHtml, filename, 'application/msword;charset=utf-8');

    return {
      success: true,
      message: `Buku Daftar Nilai Word (${filename}) berhasil diunduh.`,
    };
  } catch (err: any) {
    console.error('Error in exportBukuNilaiToWord:', err);
    return {
      success: false,
      message: 'Gagal membuat dokumen Word buku daftar nilai.',
    };
  }
}

/**
 * Export Data Siswa & Rombel to Microsoft Word (.doc)
 */
export async function exportStudentsToWord(
  students: StudentRosterItem[],
  selectedClass: string,
  teacherProfile: TeacherProfile
): Promise<{ success: boolean; message: string }> {
  try {
    const classLabel = selectedClass === 'all' ? 'Seluruh Kelas' : selectedClass;
    const dateStr = new Date().toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
    const includeKop = teacherProfile.includeOfficialKop !== false;
    const includeSig = teacherProfile.includeSignatures !== false;

    const rows = students
      .map(
        (st, idx) => `
      <tr>
        <td style="text-align:center;">${idx + 1}</td>
        <td style="text-align:center;">${st.nis}</td>
        <td><strong>${st.name}</strong></td>
        <td style="text-align:center;">${st.classRoom}</td>
        <td style="text-align:center;">${st.gender === 'P' ? 'Perempuan' : 'Laki-laki'}</td>
        <td>${st.notes || '-'}</td>
      </tr>`
      )
      .join('');

    const wordHtml = `
<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
<head>
<meta charset='utf-8'>
<style>
@page Section1 { size: 595.3pt 841.9pt; margin: 1.0in 1.0in 1.0in 1.0in; }
div.Section1 { page: Section1; }
body { font-family: 'Calibri', 'Arial', sans-serif; font-size: 11pt; color: #000000; line-height: 1.3; }
table { width: 100%; border-collapse: collapse; margin-top: 8pt; margin-bottom: 12pt; }
th, td { border: 1pt solid #333333; padding: 5pt 7pt; font-size: 9.5pt; }
th { background-color: #f1f5f9; font-weight: bold; text-align: center; }
.kop { text-align: center; border-bottom: 3pt double #000; padding-bottom: 8pt; margin-bottom: 12pt; }
.title { text-align: center; font-size: 13pt; font-weight: bold; text-decoration: underline; margin-top: 10pt; }
</style>
</head>
<body>
<div class="Section1">
  ${
    includeKop
      ? `<div class="kop">
    <h3 style="margin:0; font-size:10pt; text-transform:uppercase;">PEMERINTAH DAERAH PROVINSI / KABUPATEN</h3>
    <h2 style="margin:2pt 0; font-size:12pt; text-transform:uppercase;">DINAS PENDIDIKAN DAN KEBUDAYAAN</h2>
    <h1 style="margin:2pt 0; font-size:14pt; text-transform:uppercase;">${teacherProfile.schoolName}</h1>
    <p style="margin:0; font-size:8.5pt;">Alamat: ${teacherProfile.schoolAddress || 'Jl. Pendidikan No. 45'} • Jenjang: ${teacherProfile.gradeLevel} • NPSN: ${teacherProfile.schoolNpsn || '20328901'}</p>
  </div>`
      : ''
  }

  <div class="title">DAFTAR NAMA SISWA & ROMBONGAN BELAJAR</div>
  <p style="text-align:center; font-size:9pt; color:#444;">Kelas: ${classLabel} • Dicetak pada: ${dateStr}</p>

  <table>
    <thead>
      <tr>
        <th style="width:30px;">No</th>
        <th style="width:85px;">NIS</th>
        <th>Nama Lengkap Siswa</th>
        <th style="width:75px;">Kelas</th>
        <th style="width:80px;">Jenis Kelamin</th>
        <th>Catatan</th>
      </tr>
    </thead>
    <tbody>
      ${rows}
    </tbody>
  </table>

  ${
    includeSig
      ? `<table style="border:none; margin-top:20pt; width:100%;">
    <tr>
      <td style="border:none; text-align:center; width:50%;">
        Mengetahui,<br><strong>Kepala Sekolah</strong><br><br><br><br>
        <strong>${teacherProfile.principalName || 'Drs. H. Mulyadi, M.Pd.'}</strong><br>
        NIP. ${teacherProfile.principalNip || '19750820 199903 1 004'}${teacherProfile.principalRank ? `<br><span style="font-size:9pt; color:#475569;">${teacherProfile.principalRank}</span>` : ''}
      </td>
      <td style="border:none; text-align:center; width:50%;">
        ${teacherProfile.schoolCity || 'Kota Semarang'}, ${dateStr}<br>
        <strong>Wali Kelas / Guru Pengampu</strong><br><br><br><br>
        <strong>${teacherProfile.name}</strong><br>
        NIP. ${teacherProfile.nip}
      </td>
    </tr>
  </table>`
      : ''
  }
</div>
</body>
</html>`;

    const cleanClass = selectedClass.replace(/[^a-zA-Z0-9]/g, '_');
    const fileDate = new Date().toISOString().split('T')[0];
    const filename = `Data_Siswa_${cleanClass}_${fileDate}.doc`;

    downloadFileWithBlob(wordHtml, filename, 'application/msword;charset=utf-8');

    return {
      success: true,
      message: `Data Siswa Word (${filename}) berhasil diunduh.`,
    };
  } catch (err: any) {
    console.error('Error in exportStudentsToWord:', err);
    return {
      success: false,
      message: 'Gagal membuat dokumen Word data siswa.',
    };
  }
}

// =========================================================================
// 2. EXCEL (.xls / Spreadsheet XML) EXPORT FUNCTIONS
// =========================================================================

/**
 * Export Laporan Analisis Nilai to Microsoft Excel (.xls)
 */
export async function exportReportToExcel(
  opts: ReportPrintOptions
): Promise<{ success: boolean; message: string }> {
  try {
    const {
      analytics,
      selectedClass,
      kkmReference,
      subjectName,
      examTitle,
      teacherProfile,
      anonymizeEnabled,
    } = opts;

    const classLabel = selectedClass === 'all' ? 'Seluruh Kelas' : selectedClass;
    const dateStr = new Date().toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });

    const itemRows = analytics.itemDifficulty
      .map(
        (it) => `
      <tr>
        <td style="text-align:center;">${it.questionNumber}</td>
        <td style="text-align:center;">${it.type === 'essay' ? 'Uraian' : 'PG'}</td>
        <td style="text-align:center;">${it.correctCount}</td>
        <td style="text-align:center;">${it.incorrectCount}</td>
        <td style="text-align:center; font-weight:bold;">${it.correctRate}%</td>
        <td style="text-align:center;">${it.difficultyCategory}</td>
        <td style="text-align:center;">${it.discriminationIndex}</td>
        <td style="text-align:center;">${it.discriminationCategory}</td>
        <td style="text-align:center; font-weight:bold;">${it.recommendation}</td>
      </tr>`
      )
      .join('');

    const studentRows = analytics.studentRankings
      .map((st) => {
        const name = anonymizeEnabled
          ? anonymizeStudentData(st.studentName, st.studentId).maskedName
          : st.studentName;
        const id = anonymizeEnabled
          ? anonymizeStudentData(st.studentName, st.studentId).maskedId
          : st.studentId;
        const statusBg = st.isPassed ? '#dcfce7' : '#fee2e2';
        const statusColor = st.isPassed ? '#166534' : '#991b1b';
        return `
      <tr>
        <td style="text-align:center; font-weight:bold;">${st.rank}</td>
        <td>${name}</td>
        <td style="text-align:center; mso-number-format:'\\@';">${id}</td>
        <td style="text-align:center;">${st.classRoom}</td>
        <td style="text-align:center; font-weight:bold;">${st.scorePercentage}</td>
        <td style="text-align:center; font-weight:bold;">${st.gradeLetter}</td>
        <td style="text-align:center; font-weight:bold; background-color:${statusBg}; color:${statusColor};">${st.isPassed ? 'TUNTAS' : 'REMEDIAL'}</td>
        <td style="text-align:center;">${st.verifiedByTeacher ? 'Terverifikasi' : 'Tinjauan'}</td>
      </tr>`;
      })
      .join('');

    const excelHtml = `
<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
<head>
<meta http-equiv="Content-Type" content="text/html; charset=utf-8">
<!--[if gte mso 9]>
<xml>
 <x:ExcelWorkbook>
  <x:ExcelWorksheets>
   <x:ExcelWorksheet>
    <x:Name>Laporan Analisis</x:Name>
    <x:WorksheetOptions>
     <x:DisplayGridlines/>
    </x:WorksheetOptions>
   </x:ExcelWorksheet>
  </x:ExcelWorksheets>
 </x:ExcelWorkbook>
</xml>
<![endif]-->
<style>
table { border-collapse: collapse; font-family: Calibri, sans-serif; }
td, th { border: .5pt solid #000; padding: 5px; font-size: 10pt; }
th { background-color: #dbeafe; font-weight: bold; text-align: center; }
.title { font-size: 14pt; font-weight: bold; text-align: center; border: none; }
.sub { font-size: 10pt; text-align: center; border: none; color: #475569; }
.section-title { font-size: 11pt; font-weight: bold; background-color: #f1f5f9; }
</style>
</head>
<body>
<table>
  <tr><td colspan="8" class="title">LAPORAN ANALISIS HASIL PENILAIAN & EVALUASI BELAJAR</td></tr>
  <tr><td colspan="8" class="sub">${teacherProfile.schoolName} • Kurikulum Merdeka</td></tr>
  <tr><td colspan="8" style="border:none;">&nbsp;</td></tr>
  <tr>
    <td style="font-weight:bold; background:#f8fafc;">Mata Pelajaran:</td>
    <td>${subjectName}</td>
    <td style="font-weight:bold; background:#f8fafc;">Kelas:</td>
    <td>${classLabel}</td>
    <td style="font-weight:bold; background:#f8fafc;">Standar KKM:</td>
    <td>${kkmReference}</td>
    <td style="font-weight:bold; background:#f8fafc;">Tanggal:</td>
    <td>${dateStr}</td>
  </tr>
  <tr>
    <td style="font-weight:bold; background:#f8fafc;">Nama Ujian:</td>
    <td>${examTitle}</td>
    <td style="font-weight:bold; background:#f8fafc;">Guru:</td>
    <td>${teacherProfile.name}</td>
    <td style="font-weight:bold; background:#f8fafc;">NIP:</td>
    <td style="mso-number-format:'\\@';">${teacherProfile.nip}</td>
    <td style="font-weight:bold; background:#f8fafc;">Total Peserta:</td>
    <td>${analytics.totalStudents} Siswa</td>
  </tr>
  <tr><td colspan="8" style="border:none;">&nbsp;</td></tr>
  <tr><td colspan="8" class="section-title">I. PARAMETER STATISTIK KELAS</td></tr>
  <tr>
    <th>Rata-Rata (Mean)</th>
    <th>Median</th>
    <th>Standar Deviasi</th>
    <th>Ketuntasan KKM</th>
    <th>Jumlah Tuntas</th>
    <th>Jumlah Remedial</th>
    <th>Nilai Tertinggi</th>
    <th>Nilai Terendah</th>
  </tr>
  <tr>
    <td style="text-align:center; font-weight:bold;">${analytics.averageScore}</td>
    <td style="text-align:center;">${analytics.medianScore}</td>
    <td style="text-align:center;">±${analytics.standardDeviation}</td>
    <td style="text-align:center; font-weight:bold;">${analytics.passRatePercentage}%</td>
    <td style="text-align:center;">${analytics.passedCount} Siswa</td>
    <td style="text-align:center;">${analytics.failedCount} Siswa</td>
    <td style="text-align:center; font-weight:bold;">${analytics.highestScore}</td>
    <td style="text-align:center; font-weight:bold;">${analytics.lowestScore}</td>
  </tr>
  <tr><td colspan="8" style="border:none;">&nbsp;</td></tr>
  <tr><td colspan="9" class="section-title">II. ANALISIS BUTIR SOAL PSIKOMETRIK</td></tr>
  <tr>
    <th>No Soal</th>
    <th>Tipe</th>
    <th>Jawaban Benar</th>
    <th>Jawaban Salah</th>
    <th>Tingkat Kesukaran (P)</th>
    <th>Kategori P</th>
    <th>Daya Pembeda (D)</th>
    <th>Kategori D</th>
    <th>Rekomendasi Soal</th>
  </tr>
  ${itemRows}
  <tr><td colspan="8" style="border:none;">&nbsp;</td></tr>
  <tr><td colspan="8" class="section-title">III. DAFTAR PEROLEHAN NILAI & PERINGKAT SISWA</td></tr>
  <tr>
    <th>Rank</th>
    <th>Nama Siswa</th>
    <th>NIS</th>
    <th>Kelas</th>
    <th>Nilai Akhir</th>
    <th>Predikat</th>
    <th>Status KKM</th>
    <th>Status Audit</th>
  </tr>
  ${studentRows}
</table>
</body>
</html>`;

    const cleanSubject = subjectName.replace(/[^a-zA-Z0-9]/g, '_');
    const cleanClass = selectedClass.replace(/[^a-zA-Z0-9]/g, '_');
    const fileDate = new Date().toISOString().split('T')[0];
    const filename = `Laporan_Analisis_${cleanSubject}_${cleanClass}_${fileDate}.xls`;

    downloadFileWithBlob(excelHtml, filename, 'application/vnd.ms-excel;charset=utf-8');

    return {
      success: true,
      message: `Berkas Excel "${filename}" berhasil diunduh.`,
    };
  } catch (err: any) {
    console.error('Error in exportReportToExcel:', err);
    return {
      success: false,
      message: 'Gagal membuat dokumen Excel laporan analisis.',
    };
  }
}

/**
 * Export Individual Student Assessment to Microsoft Excel (.xls)
 */
export async function exportStudentAssessmentToExcel(
  submission: GradedSubmission,
  teacherProfile: TeacherProfile,
  anonymize: boolean = false
): Promise<{ success: boolean; message: string }> {
  try {
    const displayName = anonymize
      ? anonymizeStudentData(submission.studentName, submission.studentId).maskedName
      : submission.studentName;
    const displayId = anonymize
      ? anonymizeStudentData(submission.studentName, submission.studentId).maskedId
      : submission.studentId;

    const dateStr = new Date().toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });

    const itemsRows = (submission.items || [])
      .map(
        (it) => `
      <tr>
        <td style="text-align:center;">${it.number}</td>
        <td style="text-align:center;">${it.type === 'essay' ? 'Uraian' : 'PG'}</td>
        <td style="text-align:center;">${it.studentAnswer || '-'}</td>
        <td style="text-align:center;">${it.correctAnswer || '-'}</td>
        <td style="text-align:center; font-weight:bold;">${it.score}</td>
        <td style="text-align:center;">${it.maxScore}</td>
        <td style="text-align:center; font-weight:bold; background-color:${it.score >= (it.maxScore || 10) * 0.75 ? '#dcfce7' : '#fee2e2'};">
          ${it.score >= (it.maxScore || 10) * 0.75 ? 'BENAR' : 'PERBAIKAN'}
        </td>
        <td>${it.feedback || '-'}</td>
      </tr>`
      )
      .join('');

    const excelHtml = `
<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
<head>
<meta http-equiv="Content-Type" content="text/html; charset=utf-8">
<!--[if gte mso 9]>
<xml>
 <x:ExcelWorkbook>
  <x:ExcelWorksheets>
   <x:ExcelWorksheet>
    <x:Name>Rapor Asesmen</x:Name>
    <x:WorksheetOptions>
     <x:DisplayGridlines/>
    </x:WorksheetOptions>
   </x:ExcelWorksheet>
  </x:ExcelWorksheets>
 </x:ExcelWorkbook>
</xml>
<![endif]-->
<style>
table { border-collapse: collapse; font-family: Calibri, sans-serif; }
td, th { border: .5pt solid #000; padding: 5px; font-size: 10pt; }
th { background-color: #dbeafe; font-weight: bold; text-align: center; }
.title { font-size: 14pt; font-weight: bold; text-align: center; border: none; }
</style>
</head>
<body>
<table>
  <tr><td colspan="8" class="title">LEMBAR HASIL PENILAIAN ASESMEN INDIVIDU SISWA</td></tr>
  <tr><td colspan="8" style="text-align:center; border:none; color:#475569;">${teacherProfile.schoolName} • Kurikulum Merdeka</td></tr>
  <tr><td colspan="8" style="border:none;">&nbsp;</td></tr>
  <tr>
    <td style="font-weight:bold; background:#f8fafc;">Nama Siswa:</td>
    <td colspan="3" style="font-weight:bold;">${displayName}</td>
    <td style="font-weight:bold; background:#f8fafc;">Mata Pelajaran:</td>
    <td colspan="3">${submission.subject}</td>
  </tr>
  <tr>
    <td style="font-weight:bold; background:#f8fafc;">NIS / NISN:</td>
    <td colspan="3" style="mso-number-format:'\\@';">${displayId}</td>
    <td style="font-weight:bold; background:#f8fafc;">Nama Ujian:</td>
    <td colspan="3">${submission.examTitle}</td>
  </tr>
  <tr>
    <td style="font-weight:bold; background:#f8fafc;">Kelas:</td>
    <td colspan="3">${submission.classRoom}</td>
    <td style="font-weight:bold; background:#f8fafc;">Standar KKM:</td>
    <td colspan="3">${submission.kkm || 75}</td>
  </tr>
  <tr>
    <td style="font-weight:bold; background:#f8fafc;">Nilai Akhir:</td>
    <td colspan="3" style="font-size:12pt; font-weight:bold;">${submission.scorePercentage} / 100 (Predikat ${submission.gradeLetter})</td>
    <td style="font-weight:bold; background:#f8fafc;">Status KKM:</td>
    <td colspan="3" style="font-weight:bold; background-color:${submission.isPassed ? '#dcfce7' : '#fee2e2'}; color:${submission.isPassed ? '#166534' : '#991b1b'};">
      ${submission.isPassed ? 'TUNTAS' : 'REMEDIAL'}
    </td>
  </tr>
  <tr><td colspan="8" style="border:none;">&nbsp;</td></tr>
  <tr><td colspan="8" style="font-weight:bold; background:#f1f5f9;">RINCIAN BUTIR SOAL</td></tr>
  <tr>
    <th>No</th>
    <th>Tipe</th>
    <th>Jawaban Siswa</th>
    <th>Kunci Acuan</th>
    <th>Skor</th>
    <th>Maks</th>
    <th>Status</th>
    <th>Catatan Koreksi</th>
  </tr>
  ${itemsRows}
  <tr><td colspan="8" style="border:none;">&nbsp;</td></tr>
  <tr>
    <td colspan="2" style="font-weight:bold; background:#f8fafc;">Ulasan Guru:</td>
    <td colspan="6">${submission.summaryFeedback || '-'}</td>
  </tr>
</table>
</body>
</html>`;

    const cleanName = submission.studentName.replace(/[^a-zA-Z0-9]/g, '_');
    const cleanNis = submission.studentId.replace(/[^a-zA-Z0-9]/g, '_');
    const fileDate = new Date().toISOString().split('T')[0];
    const filename = `Rapor_Asesmen_${cleanName}_${cleanNis}_${fileDate}.xls`;

    downloadFileWithBlob(excelHtml, filename, 'application/vnd.ms-excel;charset=utf-8');

    return {
      success: true,
      message: `Rapor Excel (${filename}) siswa ${submission.studentName} berhasil diunduh.`,
    };
  } catch (err: any) {
    console.error('Error in exportStudentAssessmentToExcel:', err);
    return {
      success: false,
      message: 'Gagal membuat dokumen Excel rapor siswa.',
    };
  }
}

/**
 * Export Buku Daftar Nilai (Grade Ledger) to Microsoft Excel (.xls)
 */
export async function exportBukuNilaiToExcel(
  submissions: GradedSubmission[],
  selectedClass: string,
  subjectName: string,
  teacherProfile: TeacherProfile,
  anonymize: boolean
): Promise<{ success: boolean; message: string }> {
  try {
    const classLabel = selectedClass === 'all' ? 'Seluruh Kelas' : selectedClass;
    const dateStr = new Date().toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });

    const rows = [...submissions]
      .sort((a, b) => b.scorePercentage - a.scorePercentage)
      .map((sub, idx) => {
        const name = anonymize
          ? anonymizeStudentData(sub.studentName, sub.studentId).maskedName
          : sub.studentName;
        const id = anonymize
          ? anonymizeStudentData(sub.studentName, sub.studentId).maskedId
          : sub.studentId;
        const statusBg = sub.isPassed ? '#dcfce7' : '#fee2e2';
        const statusColor = sub.isPassed ? '#166534' : '#991b1b';
        return `
      <tr>
        <td style="text-align:center;">${idx + 1}</td>
        <td style="text-align:center; mso-number-format:'\\@';">${id}</td>
        <td><strong>${name}</strong></td>
        <td style="text-align:center;">${sub.classRoom}</td>
        <td>${sub.examTitle}</td>
        <td style="text-align:center; font-weight:bold;">${sub.scorePercentage}</td>
        <td style="text-align:center; font-weight:bold;">${sub.gradeLetter}</td>
        <td style="text-align:center; font-weight:bold; background-color:${statusBg}; color:${statusColor};">${sub.isPassed ? 'TUNTAS' : 'REMEDIAL'}</td>
        <td style="text-align:center;">${sub.verifiedByTeacher ? 'Terverifikasi' : 'Tinjauan'}</td>
        <td style="text-align:center;">${sub.date || '-'}</td>
      </tr>`;
      })
      .join('');

    const excelHtml = `
<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
<head>
<meta http-equiv="Content-Type" content="text/html; charset=utf-8">
<!--[if gte mso 9]>
<xml>
 <x:ExcelWorkbook>
  <x:ExcelWorksheets>
   <x:ExcelWorksheet>
    <x:Name>Buku Daftar Nilai</x:Name>
    <x:WorksheetOptions>
     <x:DisplayGridlines/>
    </x:WorksheetOptions>
   </x:ExcelWorksheet>
  </x:ExcelWorksheets>
 </x:ExcelWorkbook>
</xml>
<![endif]-->
<style>
table { border-collapse: collapse; font-family: Calibri, sans-serif; }
td, th { border: .5pt solid #000; padding: 5px; font-size: 10pt; }
th { background-color: #dbeafe; font-weight: bold; text-align: center; }
.title { font-size: 14pt; font-weight: bold; text-align: center; border: none; }
.sub { font-size: 10pt; text-align: center; border: none; color: #475569; }
</style>
</head>
<body>
<table>
  <tr><td colspan="10" class="title">BUKU DAFTAR NILAI & ARSIP HASIL ASESMEN</td></tr>
  <tr><td colspan="10" class="sub">${teacherProfile.schoolName} • Kurikulum Merdeka</td></tr>
  <tr><td colspan="10" style="border:none;">&nbsp;</td></tr>
  <tr>
    <td style="font-weight:bold; background:#f8fafc;">Mata Pelajaran:</td>
    <td colspan="2">${subjectName}</td>
    <td style="font-weight:bold; background:#f8fafc;">Kelas:</td>
    <td colspan="2">${classLabel}</td>
    <td style="font-weight:bold; background:#f8fafc;">Tanggal:</td>
    <td colspan="3">${dateStr}</td>
  </tr>
  <tr>
    <td style="font-weight:bold; background:#f8fafc;">Guru Pengampu:</td>
    <td colspan="2">${teacherProfile.name}</td>
    <td style="font-weight:bold; background:#f8fafc;">NIP:</td>
    <td colspan="2" style="mso-number-format:'\\@';">${teacherProfile.nip}</td>
    <td style="font-weight:bold; background:#f8fafc;">Total Peserta:</td>
    <td colspan="3">${submissions.length} Siswa</td>
  </tr>
  <tr><td colspan="10" style="border:none;">&nbsp;</td></tr>
  <tr>
    <th>No</th>
    <th>NIS</th>
    <th>Nama Lengkap Siswa</th>
    <th>Kelas</th>
    <th>Nama Asesmen / Ujian</th>
    <th>Nilai Akhir</th>
    <th>Predikat</th>
    <th>Status KKM</th>
    <th>Status Verifikasi</th>
    <th>Tanggal Pelaksanaan</th>
  </tr>
  ${rows}
</table>
</body>
</html>`;

    const cleanClass = selectedClass.replace(/[^a-zA-Z0-9]/g, '_');
    const fileDate = new Date().toISOString().split('T')[0];
    const filename = `Buku_Daftar_Nilai_${cleanClass}_${fileDate}.xls`;

    downloadFileWithBlob(excelHtml, filename, 'application/vnd.ms-excel;charset=utf-8');

    return {
      success: true,
      message: `Buku Daftar Nilai Excel (${filename}) berhasil diunduh.`,
    };
  } catch (err: any) {
    console.error('Error in exportBukuNilaiToExcel:', err);
    return {
      success: false,
      message: 'Gagal membuat dokumen Excel buku daftar nilai.',
    };
  }
}

/**
 * Export Data Siswa & Rombel to Microsoft Excel (.xls)
 */
export async function exportStudentsToExcel(
  students: StudentRosterItem[],
  selectedClass: string,
  teacherProfile: TeacherProfile
): Promise<{ success: boolean; message: string }> {
  try {
    const classLabel = selectedClass === 'all' ? 'Seluruh Kelas' : selectedClass;
    const dateStr = new Date().toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });

    const rows = students
      .map(
        (st, idx) => `
      <tr>
        <td style="text-align:center;">${idx + 1}</td>
        <td style="text-align:center; mso-number-format:'\\@';">${st.nis}</td>
        <td><strong>${st.name}</strong></td>
        <td style="text-align:center;">${st.classRoom}</td>
        <td style="text-align:center;">${st.gender === 'P' ? 'Perempuan' : 'Laki-laki'}</td>
        <td>${st.notes || '-'}</td>
      </tr>`
      )
      .join('');

    const excelHtml = `
<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
<head>
<meta http-equiv="Content-Type" content="text/html; charset=utf-8">
<!--[if gte mso 9]>
<xml>
 <x:ExcelWorkbook>
  <x:ExcelWorksheets>
   <x:ExcelWorksheet>
    <x:Name>Data Siswa</x:Name>
    <x:WorksheetOptions>
     <x:DisplayGridlines/>
    </x:WorksheetOptions>
   </x:ExcelWorksheet>
  </x:ExcelWorksheets>
 </x:ExcelWorkbook>
</xml>
<![endif]-->
<style>
table { border-collapse: collapse; font-family: Calibri, sans-serif; }
td, th { border: .5pt solid #000; padding: 5px; font-size: 10pt; }
th { background-color: #dbeafe; font-weight: bold; text-align: center; }
.title { font-size: 14pt; font-weight: bold; text-align: center; border: none; }
</style>
</head>
<body>
<table>
  <tr><td colspan="6" class="title">DAFTAR NAMA SISWA & ROMBONGAN BELAJAR</td></tr>
  <tr><td colspan="6" style="text-align:center; border:none; color:#475569;">${teacherProfile.schoolName} • Kelas: ${classLabel} • Tanggal: ${dateStr}</td></tr>
  <tr><td colspan="6" style="border:none;">&nbsp;</td></tr>
  <tr>
    <th style="width:30px;">No</th>
    <th style="width:80px;">NIS</th>
    <th>Nama Lengkap Siswa</th>
    <th style="width:70px;">Kelas</th>
    <th style="width:80px;">Jenis Kelamin</th>
    <th>Catatan Khusus</th>
  </tr>
  ${rows}
</table>
</body>
</html>`;

    const cleanClass = selectedClass.replace(/[^a-zA-Z0-9]/g, '_');
    const fileDate = new Date().toISOString().split('T')[0];
    const filename = `Data_Siswa_${cleanClass}_${fileDate}.xls`;

    downloadFileWithBlob(excelHtml, filename, 'application/vnd.ms-excel;charset=utf-8');

    return {
      success: true,
      message: `Data Siswa Excel (${filename}) berhasil diunduh.`,
    };
  } catch (err: any) {
    console.error('Error in exportStudentsToExcel:', err);
    return {
      success: false,
      message: 'Gagal membuat dokumen Excel data siswa.',
    };
  }
}

// =========================================================================
// 3. UNIVERSAL MULTI-FORMAT EXPORT DISPATCHER
// =========================================================================

export type DocumentType = 'analysis' | 'student_report' | 'buku_nilai' | 'students';

export async function exportDocumentUniversal(
  docType: DocumentType,
  format: ExportFormat,
  payload: any
): Promise<{ success: boolean; message: string }> {
  switch (docType) {
    case 'analysis': {
      const opts = payload as ReportPrintOptions;
      if (format === 'word') return exportReportToWord(opts);
      if (format === 'excel') return exportReportToExcel(opts);
      return exportReportToPdf(opts);
    }
    case 'student_report': {
      const { submission, teacherProfile, anonymize } = payload;
      if (format === 'word') return exportStudentAssessmentToWord(submission, teacherProfile, anonymize);
      if (format === 'excel') return exportStudentAssessmentToExcel(submission, teacherProfile, anonymize);
      return exportStudentAssessmentToPdf(submission, teacherProfile, anonymize);
    }
    case 'buku_nilai': {
      const { submissions, selectedClass, subjectName, teacherProfile, anonymize } = payload;
      if (format === 'word') return exportBukuNilaiToWord(submissions, selectedClass, subjectName, teacherProfile, anonymize);
      if (format === 'excel') return exportBukuNilaiToExcel(submissions, selectedClass, subjectName, teacherProfile, anonymize);
      return exportBukuNilaiToPdf(submissions, selectedClass, subjectName, teacherProfile, anonymize);
    }
    case 'students': {
      const { students, selectedClass, teacherProfile } = payload;
      if (format === 'word') return exportStudentsToWord(students, selectedClass, teacherProfile);
      if (format === 'excel') return exportStudentsToExcel(students, selectedClass, teacherProfile);
      return exportStudentsToWord(students, selectedClass, teacherProfile);
    }
    default:
      return { success: false, message: 'Format atau jenis dokumen tidak dikenali.' };
  }
}



