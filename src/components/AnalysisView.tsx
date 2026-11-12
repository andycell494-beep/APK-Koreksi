import React, { useState } from 'react';
import {
  BarChart3,
  TrendingUp,
  AlertCircle,
  Sparkles,
  Printer,
  CheckCircle2,
  FileText,
  Users,
  Award,
  Layers,
  ChevronRight,
  School,
  Download,
  Copy,
  Check,
  FileDown,
  Info,
  Calendar,
  Eye,
  Sliders,
  FileSpreadsheet,
} from 'lucide-react';
import {
  GradedSubmission,
  calculateClassAnalytics,
  anonymizeStudentData,
} from '../utils/gradingLogic';
import { ExportFormat, loadTeacherProfile } from '../utils/storage';
import {
  executePrint,
  downloadPrintableHtml,
  exportReportToPdf,
  exportReportToWord,
  exportReportToExcel,
  ReportPrintOptions,
} from '../utils/printUtils';
import { ExportFormatMenu } from './ExportFormatMenu';

interface AnalysisViewProps {
  submissions: GradedSubmission[];
  anonymizeEnabled: boolean;
  onNavigateToScan: () => void;
}

type SubTab = 'overview' | 'items' | 'ranking' | 'print-report';

export const AnalysisView: React.FC<AnalysisViewProps> = ({
  submissions,
  anonymizeEnabled,
  onNavigateToScan,
}) => {
  const [selectedClass, setSelectedClass] = useState<string>('all');
  const [activeSubTab, setActiveSubTab] = useState<SubTab>('overview');
  const [copySuccess, setCopySuccess] = useState<boolean>(false);
  const [printFeedback, setPrintFeedback] = useState<string | null>(null);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState<boolean>(false);
  const teacherProfile = loadTeacherProfile();

  const classList = Array.from(new Set(submissions.map((s) => s.classRoom))).filter(Boolean);

  const filtered = selectedClass === 'all'
    ? submissions
    : submissions.filter((s) => s.classRoom === selectedClass);

  const kkmReference = filtered[0]?.kkm || 75;
  const examTitle = filtered[0]?.examTitle || 'Penilaian Sumatif Tengah Semester';
  const subjectName = filtered[0]?.subject || 'Matematika & Sains';
  const analytics = calculateClassAnalytics(filtered, kkmReference);

  const printOptions: ReportPrintOptions = {
    analytics,
    submissions: filtered,
    selectedClass,
    kkmReference,
    subjectName,
    examTitle,
    teacherProfile,
    anonymizeEnabled,
  };

  const handleExportPdf = async () => {
    setActiveSubTab('print-report');
    setIsGeneratingPdf(true);
    setPrintFeedback('Sedang memproses dan menyusun berkas PDF resmi (A4)... Mohon tunggu.');

    // Give DOM a tick to ensure the paper element is active
    await new Promise((r) => setTimeout(r, 200));
    const res = await exportReportToPdf(printOptions);

    setIsGeneratingPdf(false);
    setPrintFeedback(res.message);
    setTimeout(() => setPrintFeedback(null), 6000);
  };

  const handleExportWord = async () => {
    setActiveSubTab('print-report');
    setIsGeneratingPdf(true);
    setPrintFeedback('Sedang menyusun dan mengunduh berkas Word (.doc)...');

    await new Promise((r) => setTimeout(r, 100));
    const res = await exportReportToWord(printOptions);

    setIsGeneratingPdf(false);
    setPrintFeedback(res.message);
    setTimeout(() => setPrintFeedback(null), 6000);
  };

  const handleExportExcel = async () => {
    setActiveSubTab('print-report');
    setIsGeneratingPdf(true);
    setPrintFeedback('Sedang menyusun dan mengunduh berkas Excel (.xls)...');

    await new Promise((r) => setTimeout(r, 100));
    const res = await exportReportToExcel(printOptions);

    setIsGeneratingPdf(false);
    setPrintFeedback(res.message);
    setTimeout(() => setPrintFeedback(null), 6000);
  };

  const handleUniversalExport = async (format: ExportFormat) => {
    if (format === 'word') {
      await handleExportWord();
    } else if (format === 'excel') {
      await handleExportExcel();
    } else {
      await handleExportPdf();
    }
  };

  const handlePrint = () => {
    setActiveSubTab('print-report');
    setPrintFeedback('Mempersiapkan dialog cetak peramban...');

    setTimeout(() => {
      const res = executePrint(printOptions);
      setPrintFeedback(res.message);
      setTimeout(() => setPrintFeedback(null), 5000);
    }, 200);
  };

  const handleDownloadReport = () => {
    downloadPrintableHtml(printOptions);
    setPrintFeedback('File dokumen cetak (HTML) berhasil diunduh. Anda dapat membukanya di browser untuk mencetak langsung.');
    setTimeout(() => setPrintFeedback(null), 6000);
  };

  const handleCopySummary = () => {
    const text = `*LAPORAN ANALISIS NILAI SISWA - KURIKULUM MERDEKA*
Satuan Pendidikan: ${teacherProfile.schoolName}
Mata Pelajaran: ${subjectName}
Kelas: ${selectedClass === 'all' ? 'Seluruh Kelas' : selectedClass}
Ujian: ${examTitle}
Standar KKM: ${kkmReference}

*RINGKASAN STATISTIK:*
• Total Peserta: ${analytics.totalStudents} siswa
• Rata-rata (Mean): ${analytics.averageScore} / 100
• Nilai Tengah (Median): ${analytics.medianScore}
• Standar Deviasi: ±${analytics.standardDeviation}
• Ketuntasan KKM: ${analytics.passRatePercentage}% (${analytics.passedCount} Tuntas, ${analytics.failedCount} Remedial)
• Nilai Tertinggi: ${analytics.highestScore} | Terendah: ${analytics.lowestScore}

*REKOMENDASI PEDAGOGIK:*
${analytics.passRatePercentage >= 75
  ? 'Ketuntasan kelas memenuhi target kurikulum. Butir soal dengan daya pembeda tinggi direkomendasikan masuk ke Bank Soal.'
  : `Sebanyak ${analytics.failedCount} murid perlu mengikuti program remedial pada materi pokok yang belum tuntas.`}

Guru Pengampu: ${teacherProfile.name} (NIP: ${teacherProfile.nip})`;

    const copyFallback = () => {
      try {
        const textarea = document.createElement('textarea');
        textarea.value = text;
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
        setCopySuccess(true);
        setTimeout(() => setCopySuccess(false), 3000);
      } catch (e) {
        console.warn('Fallback copy failed', e);
      }
    };

    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(text)
        .then(() => {
          setCopySuccess(true);
          setTimeout(() => setCopySuccess(false), 3000);
        })
        .catch(() => copyFallback());
    } else {
      copyFallback();
    }
  };

  return (
    <div className="flex flex-col min-h-[calc(100vh-4.5rem)] pb-24">
      {/* Top Header Card (Hidden on Print) */}
      <div className="no-print bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-4 py-3 sticky top-0 z-30 shadow-xs">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              Analisis Nilai & Butir Soal
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Evaluasi Psikometrik & Format Cetak Resmi Kurikulum
            </p>
          </div>

          <div className="flex items-center gap-2">
            <ExportFormatMenu
              onExport={handleUniversalExport}
              isExporting={isGeneratingPdf}
              buttonLabel="Cetak / Unduh"
              size="sm"
            />
          </div>
        </div>

        {/* Global Print Notification Toast */}
        {printFeedback && (
          <div className="mt-2.5 p-2.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/80 border border-indigo-200 dark:border-indigo-800 text-indigo-900 dark:text-indigo-200 text-xs flex items-center justify-between animate-in fade-in slide-in-from-top-1">
            <div className="flex items-center gap-2">
              <Info className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
              <span>{printFeedback}</span>
            </div>
            <button
              type="button"
              onClick={() => setPrintFeedback(null)}
              className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline ml-2"
            >
              Tutup
            </button>
          </div>
        )}

        {/* Filters and Sub Tabs */}
        <div className="mt-3 space-y-2">
          {classList.length > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-semibold text-slate-400">Filter Kelas:</span>
              <select
                value={selectedClass}
                onChange={(e) => setSelectedClass(e.target.value)}
                className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-none text-xs font-semibold"
              >
                <option value="all">Semua Kelas ({submissions.length} siswa)</option>
                {classList.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Sub Navigation Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-xs">
            <button
              type="button"
              onClick={() => setActiveSubTab('overview')}
              className={`px-3 py-1 rounded-full whitespace-nowrap font-semibold transition ${
                activeSubTab === 'overview'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
              }`}
            >
              Ringkasan & Kurikulum
            </button>

            <button
              type="button"
              onClick={() => setActiveSubTab('items')}
              className={`px-3 py-1 rounded-full whitespace-nowrap font-semibold transition ${
                activeSubTab === 'items'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
              }`}
            >
              Analisis Butir Soal ({analytics.itemDifficulty.length})
            </button>

            <button
              type="button"
              onClick={() => setActiveSubTab('ranking')}
              className={`px-3 py-1 rounded-full whitespace-nowrap font-semibold transition ${
                activeSubTab === 'ranking'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
              }`}
            >
              Peringkat & Remedial ({analytics.studentRankings.length})
            </button>

            <button
              type="button"
              onClick={() => setActiveSubTab('print-report')}
              className={`px-3 py-1 rounded-full whitespace-nowrap font-semibold transition flex items-center gap-1 ${
                activeSubTab === 'print-report'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              Format Cetak Resmi (A4)
            </button>
          </div>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 text-center border border-slate-200 dark:border-slate-800 shadow-sm">
            <BarChart3 className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
            <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">
              Belum Cukup Data Analisis
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xs mx-auto mt-1 mb-4">
              Periksa lembar jawaban murid terlebih dahulu untuk menyusun analisis dan dokumen cetak.
            </p>
            <button
              type="button"
              onClick={onNavigateToScan}
              className="px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-semibold"
            >
              Periksa Lembar Jawaban
            </button>
          </div>
        </div>
      ) : (
        <>
          {/* TAB 1: OVERVIEW & DESCRIPTIVE STATS */}
          {activeSubTab === 'overview' && (
            <div className="p-4 space-y-4 no-print animate-in fade-in">
              {/* Comprehensive Descriptive Stat Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs">
                  <span className="text-[11px] text-slate-400 font-medium block">Rata-rata (Mean)</span>
                  <div className="flex items-baseline gap-1 mt-0.5">
                    <span className="text-2xl font-black font-mono text-slate-900 dark:text-white">
                      {analytics.averageScore}
                    </span>
                    <span className="text-xs text-slate-400">/ 100</span>
                  </div>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 block">
                    {analytics.totalStudents} siswa terdata
                  </span>
                </div>

                <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs">
                  <span className="text-[11px] text-slate-400 font-medium block">Median (Nilai Tengah)</span>
                  <div className="flex items-baseline gap-1 mt-0.5">
                    <span className="text-2xl font-black font-mono text-indigo-600 dark:text-indigo-400">
                      {analytics.medianScore}
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 block">
                    Titik tengah distribusi
                  </span>
                </div>

                <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs">
                  <span className="text-[11px] text-slate-400 font-medium block">Standar Deviasi</span>
                  <div className="flex items-baseline gap-1 mt-0.5">
                    <span className="text-2xl font-black font-mono text-violet-600 dark:text-violet-400">
                      ±{analytics.standardDeviation}
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 block">
                    Variasi sebaran nilai
                  </span>
                </div>

                <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs">
                  <span className="text-[11px] text-slate-400 font-medium block">Ketuntasan KKM ({kkmReference})</span>
                  <div className="flex items-baseline gap-1 mt-0.5">
                    <span className="text-2xl font-black font-mono text-emerald-600 dark:text-emerald-400">
                      {analytics.passRatePercentage}%
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 block">
                    {analytics.passedCount} Tuntas • {analytics.failedCount} Remedial
                  </span>
                </div>

                <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs">
                  <span className="text-[11px] text-slate-400 font-medium block">Nilai Tertinggi</span>
                  <div className="flex items-baseline gap-1 mt-0.5">
                    <span className="text-2xl font-black font-mono text-emerald-600">
                      {analytics.highestScore}
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-400 mt-1 block">Skor maksimum</span>
                </div>

                <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs">
                  <span className="text-[11px] text-slate-400 font-medium block">Rentang Skor (Range)</span>
                  <div className="flex items-baseline gap-1 mt-0.5">
                    <span className="text-2xl font-black font-mono text-rose-600">
                      {analytics.scoreRange}
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-400 mt-1 block">Min: {analytics.lowestScore}</span>
                </div>
              </div>

              {/* Grade Distribution Bar Chart */}
              <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                    Distribusi Predikat Nilai (Kurikulum Merdeka)
                  </h3>
                  <span className="text-xs text-slate-400 font-mono">
                    KKM: {kkmReference}
                  </span>
                </div>

                <div className="space-y-2.5">
                  {[
                    { label: 'Predikat A (Sangat Baik / 90-100)', count: analytics.gradeDistribution.A, color: 'bg-emerald-500' },
                    { label: 'Predikat B (Baik / 80-89)', count: analytics.gradeDistribution.B, color: 'bg-indigo-500' },
                    { label: 'Predikat C (Cukup / 70-79)', count: analytics.gradeDistribution.C, color: 'bg-amber-500' },
                    { label: 'Predikat D (Kurang / 60-69)', count: analytics.gradeDistribution.D, color: 'bg-orange-500' },
                    { label: 'Predikat E (Sangat Kurang / <60)', count: analytics.gradeDistribution.E, color: 'bg-rose-500' },
                  ].map((item) => {
                    const pct = analytics.totalStudents > 0
                      ? Math.round((item.count / analytics.totalStudents) * 100)
                      : 0;

                    return (
                      <div key={item.label} className="space-y-1">
                        <div className="flex justify-between text-xs text-slate-700 dark:text-slate-300">
                          <span className="font-medium">{item.label}</span>
                          <span className="font-mono font-bold">
                            {item.count} siswa ({pct}%)
                          </span>
                        </div>
                        <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                          <div
                            className={`h-full ${item.color} rounded-full transition-all duration-500`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* AI Pedagogical Recommendations */}
              <div className="bg-gradient-to-br from-indigo-900 via-indigo-950 to-slate-900 text-white rounded-2xl p-4 shadow-md space-y-2.5 border border-indigo-800/60">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-amber-400" />
                    <h4 className="text-xs font-bold tracking-wide uppercase text-indigo-200">
                      Rekomendasi Analisis AI
                    </h4>
                  </div>
                  <button
                    type="button"
                    onClick={handlePrint}
                    className="text-[11px] underline text-indigo-300 hover:text-white"
                  >
                    Buka Versi Cetak
                  </button>
                </div>
                <p className="text-xs text-indigo-100/95 leading-relaxed">
                  {analytics.passRatePercentage >= 75
                    ? `Ketuntasan kelas mencapai ${analytics.passRatePercentage}%. Secara umum murid telah menguasai indikator utama. Butir soal dengan daya pembeda tinggi dapat disimpan ke dalam bank soal untuk ujian periode mendatang.`
                    : `Terdapat ${analytics.failedCount} siswa yang membutuhkan remedial. Berikan penekanan pada materi soal yang masuk kategori 'Sukar' dan adakan bimbingan teman sebaya.`}
                </p>
              </div>
            </div>
          )}

          {/* TAB 2: PSYCHOMETRIC ITEM ANALYSIS */}
          {activeSubTab === 'items' && (
            <div className="p-4 space-y-3 no-print animate-in fade-in">
              <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200 dark:border-slate-800 shadow-xs space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                      Uji Kualitas Butir Soal (Psikometrik)
                    </h3>
                    <p className="text-[11px] text-slate-400">
                      Tingkat Kesukaran ($P$) & Daya Pembeda ($D$)
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handlePrint}
                    className="text-xs text-indigo-600 dark:text-indigo-400 font-semibold flex items-center gap-1"
                  >
                    <Printer className="w-3.5 h-3.5" /> Cetak Tabel
                  </button>
                </div>

                <div className="divide-y divide-slate-100 dark:divide-slate-800">
                  {analytics.itemDifficulty.map((item) => (
                    <div key={item.questionNumber} className="py-3 text-xs space-y-2">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2">
                          <span className="w-8 h-8 rounded-xl bg-indigo-50 dark:bg-indigo-950 font-mono font-bold text-indigo-700 dark:text-indigo-300 flex items-center justify-center text-sm">
                            #{item.questionNumber}
                          </span>
                          <div>
                            <span className="font-bold text-slate-800 dark:text-slate-200">
                              Butir Soal Nomor {item.questionNumber}
                            </span>
                            <span className="text-[10px] text-slate-400 block">
                              {item.type === 'essay' ? 'Soal Esai / Uraian' : 'Pilihan Ganda'} • {item.correctCount} Siswa Benar, {item.incorrectCount} Siswa Salah
                            </span>
                          </div>
                        </div>

                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            item.recommendation === 'Diterima Baik'
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                              : item.recommendation === 'Revisi Soal'
                              ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                              : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                          }`}
                        >
                          {item.recommendation}
                        </span>
                      </div>

                      {/* Detail Metrics Badges */}
                      <div className="grid grid-cols-2 gap-2 text-[11px] bg-slate-50 dark:bg-slate-800/60 p-2.5 rounded-xl">
                        <div>
                          <span className="text-slate-400 block text-[10px]">Tingkat Kesukaran (P):</span>
                          <span className="font-semibold text-slate-800 dark:text-slate-200">
                            {item.correctRate}% ({item.difficultyCategory})
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-400 block text-[10px]">Daya Pembeda (D):</span>
                          <span className="font-semibold text-slate-800 dark:text-slate-200">
                            {item.discriminationIndex} ({item.discriminationCategory})
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: STUDENT RANKINGS & REMEDIAL */}
          {activeSubTab === 'ranking' && (
            <div className="p-4 space-y-4 no-print animate-in fade-in">
              {/* Ranking Table */}
              <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
                    <Award className="w-4 h-4 text-amber-500" />
                    Peringkat Siswa ({analytics.studentRankings.length})
                  </h3>
                  <button
                    type="button"
                    onClick={handlePrint}
                    className="text-xs text-indigo-600 dark:text-indigo-400 font-semibold flex items-center gap-1"
                  >
                    <Printer className="w-3.5 h-3.5" /> Cetak Rapor
                  </button>
                </div>

                <div className="divide-y divide-slate-100 dark:divide-slate-800">
                  {analytics.studentRankings.map((student) => {
                    const displayName = anonymizeEnabled
                      ? anonymizeStudentData(student.studentName, student.studentId).maskedName
                      : student.studentName;
                    const displayId = anonymizeEnabled
                      ? anonymizeStudentData(student.studentName, student.studentId).maskedId
                      : student.studentId;

                    return (
                      <div
                        key={student.studentId + student.rank}
                        className="py-2.5 flex items-center justify-between text-xs"
                      >
                        <div className="flex items-center gap-2.5">
                          <span
                            className={`w-7 h-7 rounded-full font-mono font-bold flex items-center justify-center text-xs ${
                              student.rank === 1
                                ? 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300 ring-2 ring-amber-400'
                                : student.rank === 2
                                ? 'bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300 ring-2 ring-slate-400'
                                : student.rank === 3
                                ? 'bg-amber-50 text-amber-800 dark:bg-amber-950/60 ring-2 ring-amber-600'
                                : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                            }`}
                          >
                            {student.rank}
                          </span>

                          <div>
                            <span className="font-bold text-slate-800 dark:text-slate-200">
                              {displayName}
                            </span>
                            <span className="text-[10px] text-slate-400 block">
                              NIS: {displayId} • {student.classRoom}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <div className="text-right">
                            <span className="text-sm font-black font-mono text-slate-900 dark:text-white">
                              {student.scorePercentage}
                            </span>
                            <span className="text-[10px] text-slate-400 block font-semibold">
                              Predikat {student.gradeLetter}
                            </span>
                          </div>

                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              student.isPassed
                                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                                : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                            }`}
                          >
                            {student.isPassed ? 'Tuntas' : 'Remedial'}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Remedial Targets Section */}
              {analytics.remedialStudentNames.length > 0 && (
                <div className="bg-rose-50/80 dark:bg-rose-950/30 rounded-2xl p-4 border border-rose-200 dark:border-rose-900/60 space-y-2">
                  <div className="flex items-center gap-2 text-rose-800 dark:text-rose-300 font-bold text-xs">
                    <AlertCircle className="w-4 h-4" />
                    <span>Daftar Siswa Peserta Remedial ({analytics.remedialStudentNames.length} Siswa)</span>
                  </div>
                  <p className="text-xs text-rose-700 dark:text-rose-400 leading-relaxed">
                    Siswa berikut belum mencapai KKM ({kkmReference}) dan dijadwalkan mengikuti pembelajaran remedial serta tes perbaikan:
                  </p>
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {analytics.remedialStudentNames.map((name, idx) => {
                      const display = anonymizeEnabled ? anonymizeStudentData(name, '000').maskedName : name;
                      return (
                        <span
                          key={idx}
                          className="px-2.5 py-1 rounded-lg bg-white dark:bg-slate-900 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800 text-xs font-semibold shadow-2xs"
                        >
                          {display}
                        </span>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 4: OFFICIAL FORMAL PRINTABLE REPORT (ON-SCREEN PREVIEW & PRINT MEDIA) */}
          <div
            className={`w-full ${
              activeSubTab === 'print-report' ? 'block' : 'hidden print:block'
            }`}
          >
            {/* Top Toolbar in Screen View */}
            <div className="no-print bg-slate-900 text-white p-4 mx-4 mt-4 rounded-2xl shadow-lg border border-slate-800">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="text-xs font-black uppercase tracking-wider text-emerald-400">
                      Pratinjau Format Cetak Resmi (Standar A4)
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 mt-0.5">
                    Dokumen siap cetak ke printer fisik atau simpan sebagai file PDF bergaris rapi.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={handleExportPdf}
                    disabled={isGeneratingPdf}
                    className="flex-1 sm:flex-none px-3.5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 active:scale-95 text-white font-bold text-xs transition shadow-md flex items-center justify-center gap-1.5"
                    title="Buat dan unduh berkas PDF resmi bergaris rapi langsung ke perangkat"
                  >
                    {isGeneratingPdf ? (
                      <>
                        <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        <span>Menyusun...</span>
                      </>
                    ) : (
                      <>
                        <FileDown className="w-3.5 h-3.5" />
                        <span>Cetak PDF</span>
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={handleExportWord}
                    disabled={isGeneratingPdf}
                    className="flex-1 sm:flex-none px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 active:scale-95 text-white font-bold text-xs transition shadow-md flex items-center justify-center gap-1.5"
                    title="Ekspor ke Microsoft Word (.doc) lengkap dengan Kop Dinas dan Format Resmi"
                  >
                    <FileText className="w-3.5 h-3.5" />
                    <span>Ekspor Word</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleExportExcel}
                    disabled={isGeneratingPdf}
                    className="flex-1 sm:flex-none px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white font-bold text-xs transition shadow-md flex items-center justify-center gap-1.5"
                    title="Ekspor ke Microsoft Excel (.xls) lengkap dengan rekapitulasi data dan statistik"
                  >
                    <FileSpreadsheet className="w-3.5 h-3.5" />
                    <span>Ekspor Excel</span>
                  </button>

                  <button
                    type="button"
                    onClick={handlePrint}
                    className="flex-1 sm:flex-none px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 active:scale-95 text-slate-200 font-semibold text-xs transition shadow-sm flex items-center justify-center gap-1.5 border border-slate-700"
                    title="Buka dialog pencetakan printer fisik peramban"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>Printer Fisik</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleDownloadReport}
                    className="flex-1 sm:flex-none px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 active:scale-95 text-slate-200 font-semibold text-xs transition shadow-sm flex items-center justify-center gap-1.5 border border-slate-700"
                    title="Unduh file HTML standalone"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>File HTML</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleCopySummary}
                    className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 active:scale-95 text-slate-200 font-semibold text-xs transition flex items-center justify-center gap-1.5 border border-slate-700"
                    title="Salin ringkasan teks untuk dikirim ke WA/Catatan"
                  >
                    {copySuccess ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        <span className="text-emerald-400">Tersalin!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Salin Teks</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Printing Helper Hint */}
              <div className="mt-3 pt-3 border-t border-slate-800 flex items-start gap-2 text-[11px] text-slate-400">
                <Info className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <span>
                  <strong>Tips Unduh PDF:</strong> Tombol <em>&quot;Cetak / Unduh PDF (A4)&quot;</em> akan langsung menghasilkan berkas <code>.pdf</code> beresolusi tinggi tanpa melewati pop-up peramban. Jika ingin mencetak langsung ke kertas via printer fisik, pilih <em>&quot;Kirim ke Printer&quot;</em>.
                </span>
              </div>
            </div>

            {/* REALISTIC A4 PAPER CANVAS */}
            <div className="p-3 sm:p-6 overflow-x-auto">
              <div
                id="report-print-paper"
                className="printable-document bg-white text-slate-900 text-xs w-full max-w-[210mm] min-h-[297mm] mx-auto shadow-2xl rounded-none sm:rounded-sm p-6 sm:p-12 border border-slate-300 print:border-none print:shadow-none print:p-0 print:m-0"
              >
                
                {/* KOP SURAT RESMI KEDINASAN */}
                <div className="flex items-center justify-between pb-3 border-b-4 border-double border-slate-900 mb-4">
                  {/* Lambang Tut Wuri Handayani SVG */}
                  <div className="w-16 h-16 shrink-0">
                    <svg viewBox="0 0 100 100" className="w-full h-full" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <circle cx="50" cy="50" r="46" stroke="#0f172a" strokeWidth="2.5" fill="#f8fafc" />
                      <path d="M50 14 L55 26 L68 28 L58 37 L61 50 L50 43 L39 50 L42 37 L32 28 L45 26 Z" fill="#b45309" stroke="#0f172a" strokeWidth="1.5" />
                      <path d="M22 62 C30 52 42 50 50 56 C58 50 70 52 78 62 C74 74 62 82 50 82 C38 82 26 74 22 62 Z" fill="#1e3a8a" stroke="#0f172a" strokeWidth="1.5" />
                      <path d="M35 70 C42 66 50 68 50 68 C50 68 58 66 65 70" stroke="#f8fafc" strokeWidth="2" strokeLinecap="round" />
                      <circle cx="50" cy="38" r="4" fill="#fbbf24" stroke="#0f172a" strokeWidth="1" />
                    </svg>
                  </div>

                  <div className="text-center flex-1 px-4">
                    <h4 className="text-[10px] font-bold uppercase tracking-widest text-slate-600">
                      PEMERINTAH DAERAH PROVINSI / KABUPATEN
                    </h4>
                    <h2 className="text-xs font-black uppercase tracking-wide text-slate-900 mt-0.5">
                      DINAS PENDIDIKAN DAN KEBUDAYAAN
                    </h2>
                    <h1 className="text-sm sm:text-base font-black uppercase text-slate-950 mt-0.5">
                      {teacherProfile.schoolName || 'SMA NEGERI PRESTASI INDONESIA'}
                    </h1>
                    <p className="text-[10px] text-slate-600 mt-1">
                      Alamat: {teacherProfile.schoolAddress || 'Jl. Pendidikan No. 45'} • Jenjang: {teacherProfile.gradeLevel || 'SMA/MA'} • Akreditasi: A • NPSN: {teacherProfile.schoolNpsn || '20328901'}
                    </p>
                  </div>

                  {/* Lambang Sekolah Mitra SVG */}
                  <div className="w-16 h-16 shrink-0 text-right">
                    <svg viewBox="0 0 100 100" className="w-full h-full" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <rect x="10" y="10" width="80" height="80" rx="16" stroke="#0f172a" strokeWidth="2.5" fill="#f8fafc" />
                      <path d="M30 40 L50 25 L70 40 L70 70 L30 70 Z" fill="#047857" stroke="#0f172a" strokeWidth="1.5" />
                      <path d="M42 70 L42 52 L58 52 L58 70" fill="#f8fafc" stroke="#0f172a" strokeWidth="1.5" />
                      <circle cx="50" cy="38" r="5" fill="#f59e0b" />
                    </svg>
                  </div>
                </div>

                {/* JUDUL DOKUMEN LAPORAN */}
                <div className="text-center my-4">
                  <h3 className="text-sm sm:text-base font-black uppercase underline tracking-wide text-slate-950">
                    LAPORAN ANALISIS HASIL PENILAIAN & EVALUASI BELAJAR SISWA
                  </h3>
                  <p className="text-[11px] text-slate-600 mt-0.5 font-medium">
                    Nomor Dokumen: LAP-EVAL/{new Date().getFullYear()}/{selectedClass === 'all' ? 'ALL' : selectedClass} • Kurikulum Merdeka
                  </p>
                </div>

                {/* IDENTITAS UJIAN & KELAS (METADATA TABLE) */}
                <table className="w-full text-xs border border-slate-300 border-collapse mb-4 bg-slate-50/60">
                  <tbody>
                    <tr>
                      <td className="border border-slate-300 px-3 py-1.5 font-bold text-slate-700 w-1/4 bg-slate-100/70">Mata Pelajaran</td>
                      <td className="border border-slate-300 px-3 py-1.5 font-semibold text-slate-900 w-1/4">{subjectName}</td>
                      <td className="border border-slate-300 px-3 py-1.5 font-bold text-slate-700 w-1/4 bg-slate-100/70">Kelas / Rombel</td>
                      <td className="border border-slate-300 px-3 py-1.5 font-semibold text-slate-900 w-1/4">{selectedClass === 'all' ? 'Seluruh Kelas' : selectedClass}</td>
                    </tr>
                    <tr>
                      <td className="border border-slate-300 px-3 py-1.5 font-bold text-slate-700 bg-slate-100/70">Nama Ujian</td>
                      <td className="border border-slate-300 px-3 py-1.5 font-semibold text-slate-900">{examTitle}</td>
                      <td className="border border-slate-300 px-3 py-1.5 font-bold text-slate-700 bg-slate-100/70">Standar KKM / KKTP</td>
                      <td className="border border-slate-300 px-3 py-1.5 font-bold font-mono text-slate-900">{kkmReference}</td>
                    </tr>
                    <tr>
                      <td className="border border-slate-300 px-3 py-1.5 font-bold text-slate-700 bg-slate-100/70">Guru Pengampu</td>
                      <td className="border border-slate-300 px-3 py-1.5 font-semibold text-slate-900">{teacherProfile.name}</td>
                      <td className="border border-slate-300 px-3 py-1.5 font-bold text-slate-700 bg-slate-100/70">Tanggal Pelaporan</td>
                      <td className="border border-slate-300 px-3 py-1.5 font-medium text-slate-900">
                        {new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                      </td>
                    </tr>
                    <tr>
                      <td className="border border-slate-300 px-3 py-1.5 font-bold text-slate-700 bg-slate-100/70">NIP Guru</td>
                      <td className="border border-slate-300 px-3 py-1.5 font-mono text-slate-900">{teacherProfile.nip}</td>
                      <td className="border border-slate-300 px-3 py-1.5 font-bold text-slate-700 bg-slate-100/70">Total Peserta</td>
                      <td className="border border-slate-300 px-3 py-1.5 font-mono font-bold text-slate-900">{analytics.totalStudents} Siswa</td>
                    </tr>
                  </tbody>
                </table>

                {/* BAGIAN I: STATISTIK HASIL EVALUASI */}
                <div className="mb-4">
                  <div className="font-extrabold text-xs uppercase mb-1.5 text-slate-900 flex items-center gap-1.5">
                    <span>I. RINGKASAN STATISTIK EVALUASI KELAS</span>
                  </div>
                  
                  {/* Grid Stat Cards */}
                  <div className="grid grid-cols-4 gap-2 mb-2">
                    <div className="border border-slate-300 p-2 text-center rounded bg-slate-50">
                      <span className="text-[10px] text-slate-500 font-semibold block uppercase">Rata-Rata (Mean)</span>
                      <span className="text-base font-black font-mono text-slate-900">{analytics.averageScore}</span>
                      <span className="text-[9px] text-slate-400 block">Skala 100</span>
                    </div>
                    <div className="border border-slate-300 p-2 text-center rounded bg-slate-50">
                      <span className="text-[10px] text-slate-500 font-semibold block uppercase">Median</span>
                      <span className="text-base font-black font-mono text-indigo-700">{analytics.medianScore}</span>
                      <span className="text-[9px] text-slate-400 block">Titik Tengah</span>
                    </div>
                    <div className="border border-slate-300 p-2 text-center rounded bg-slate-50">
                      <span className="text-[10px] text-slate-500 font-semibold block uppercase">Standar Deviasi</span>
                      <span className="text-base font-black font-mono text-violet-700">±{analytics.standardDeviation}</span>
                      <span className="text-[9px] text-slate-400 block">Sebaran Nilai</span>
                    </div>
                    <div className="border border-slate-300 p-2 text-center rounded bg-slate-50">
                      <span className="text-[10px] text-slate-500 font-semibold block uppercase">Ketuntasan KKM</span>
                      <span className="text-base font-black font-mono text-emerald-700">{analytics.passRatePercentage}%</span>
                      <span className="text-[9px] text-slate-400 block">{analytics.passedCount} Tuntas</span>
                    </div>
                  </div>

                  <table className="w-full text-xs border border-slate-400 border-collapse">
                    <thead>
                      <tr className="bg-slate-100 text-slate-900">
                        <th className="border border-slate-300 px-2 py-1.5 font-bold">Total Peserta</th>
                        <th className="border border-slate-300 px-2 py-1.5 font-bold">Tuntas KKM (&ge; {kkmReference})</th>
                        <th className="border border-slate-300 px-2 py-1.5 font-bold">Belum Tuntas (&lt; {kkmReference})</th>
                        <th className="border border-slate-300 px-2 py-1.5 font-bold">Nilai Tertinggi</th>
                        <th className="border border-slate-300 px-2 py-1.5 font-bold">Nilai Terendah</th>
                        <th className="border border-slate-300 px-2 py-1.5 font-bold">Rentang Skor (Range)</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="text-center font-mono">
                        <td className="border border-slate-300 px-2 py-1.5">{analytics.totalStudents} Siswa</td>
                        <td className="border border-slate-300 px-2 py-1.5 font-bold text-emerald-700">{analytics.passedCount} Siswa ({analytics.passRatePercentage}%)</td>
                        <td className="border border-slate-300 px-2 py-1.5 font-bold text-rose-700">{analytics.failedCount} Siswa ({100 - analytics.passRatePercentage}%)</td>
                        <td className="border border-slate-300 px-2 py-1.5 font-bold">{analytics.highestScore}</td>
                        <td className="border border-slate-300 px-2 py-1.5 font-bold">{analytics.lowestScore}</td>
                        <td className="border border-slate-300 px-2 py-1.5">{analytics.scoreRange} poin</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* DISTRIBUSI PREDIKAT CAPAIAN */}
                <div className="mb-4">
                  <span className="text-[11px] font-bold text-slate-700 uppercase block mb-1">
                    Distribusi Predikat Capaian Pembelajaran:
                  </span>
                  <table className="w-full text-xs border border-slate-400 border-collapse text-center">
                    <thead>
                      <tr className="bg-slate-100 text-slate-900 font-bold">
                        <th className="border border-slate-300 px-2 py-1">Predikat A (90-100)</th>
                        <th className="border border-slate-300 px-2 py-1">Predikat B (80-89)</th>
                        <th className="border border-slate-300 px-2 py-1">Predikat C (70-79)</th>
                        <th className="border border-slate-300 px-2 py-1">Predikat D (60-69)</th>
                        <th className="border border-slate-300 px-2 py-1">Predikat E (&lt;60)</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="font-mono font-bold">
                        <td className="border border-slate-300 px-2 py-1.5">{analytics.gradeDistribution.A} Siswa ({analytics.totalStudents > 0 ? Math.round((analytics.gradeDistribution.A / analytics.totalStudents) * 100) : 0}%)</td>
                        <td className="border border-slate-300 px-2 py-1.5">{analytics.gradeDistribution.B} Siswa ({analytics.totalStudents > 0 ? Math.round((analytics.gradeDistribution.B / analytics.totalStudents) * 100) : 0}%)</td>
                        <td className="border border-slate-300 px-2 py-1.5">{analytics.gradeDistribution.C} Siswa ({analytics.totalStudents > 0 ? Math.round((analytics.gradeDistribution.C / analytics.totalStudents) * 100) : 0}%)</td>
                        <td className="border border-slate-300 px-2 py-1.5">{analytics.gradeDistribution.D} Siswa ({analytics.totalStudents > 0 ? Math.round((analytics.gradeDistribution.D / analytics.totalStudents) * 100) : 0}%)</td>
                        <td className="border border-slate-300 px-2 py-1.5">{analytics.gradeDistribution.E} Siswa ({analytics.totalStudents > 0 ? Math.round((analytics.gradeDistribution.E / analytics.totalStudents) * 100) : 0}%)</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* BAGIAN II: TABEL ANALISIS BUTIR SOAL */}
                <div className="mb-4">
                  <div className="font-extrabold text-xs uppercase mb-1.5 text-slate-900">
                    II. ANALISIS KUALITAS BUTIR SOAL (TINGKAT KESUKARAN & DAYA PEMBEDA)
                  </div>
                  <table className="w-full text-xs border border-slate-400 border-collapse text-center">
                    <thead>
                      <tr className="bg-slate-100 text-slate-900 font-bold">
                        <th className="border border-slate-300 px-2 py-1.5 w-10">No</th>
                        <th className="border border-slate-300 px-2 py-1.5">Tipe Soal</th>
                        <th className="border border-slate-300 px-2 py-1.5">Benar</th>
                        <th className="border border-slate-300 px-2 py-1.5">Salah</th>
                        <th className="border border-slate-300 px-2 py-1.5">Tingkat Kesukaran (P)</th>
                        <th className="border border-slate-300 px-2 py-1.5">Kategori P</th>
                        <th className="border border-slate-300 px-2 py-1.5">Daya Pembeda (D)</th>
                        <th className="border border-slate-300 px-2 py-1.5">Rekomendasi</th>
                      </tr>
                    </thead>
                    <tbody>
                      {analytics.itemDifficulty.length === 0 ? (
                        <tr>
                          <td colSpan={8} className="border border-slate-300 px-2 py-2 text-slate-500">
                            Tidak ada butir soal terdata
                          </td>
                        </tr>
                      ) : (
                        analytics.itemDifficulty.map((item) => (
                          <tr key={item.questionNumber}>
                            <td className="border border-slate-300 px-2 py-1.5 font-bold font-mono">#{item.questionNumber}</td>
                            <td className="border border-slate-300 px-2 py-1.5">{item.type === 'essay' ? 'Esai / Uraian' : 'Pilihan Ganda'}</td>
                            <td className="border border-slate-300 px-2 py-1.5 font-mono">{item.correctCount}</td>
                            <td className="border border-slate-300 px-2 py-1.5 font-mono">{item.incorrectCount}</td>
                            <td className="border border-slate-300 px-2 py-1.5 font-mono font-bold">{item.correctRate}%</td>
                            <td className="border border-slate-300 px-2 py-1.5 font-semibold">{item.difficultyCategory}</td>
                            <td className="border border-slate-300 px-2 py-1.5 font-mono">{item.discriminationIndex} ({item.discriminationCategory})</td>
                            <td className={`border border-slate-300 px-2 py-1.5 font-bold ${
                              item.recommendation === 'Diterima Baik'
                                ? 'text-emerald-700'
                                : item.recommendation === 'Revisi Soal'
                                ? 'text-amber-700'
                                : 'text-rose-700'
                            }`}>
                              {item.recommendation}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>

                {/* BAGIAN III: TABEL DAFTAR NILAI DAN PERINGKAT SISWA */}
                <div className="mb-4">
                  <div className="font-extrabold text-xs uppercase mb-1.5 text-slate-900">
                    III. DAFTAR PEROLEHAN NILAI & PERINGKAT KELAS
                  </div>
                  <table className="w-full text-xs border border-slate-400 border-collapse">
                    <thead>
                      <tr className="bg-slate-100 text-slate-900 font-bold text-center">
                        <th className="border border-slate-300 px-2 py-1.5 w-10">Rank</th>
                        <th className="border border-slate-300 px-2 py-1.5 text-left">Nama Siswa</th>
                        <th className="border border-slate-300 px-2 py-1.5">NIS</th>
                        <th className="border border-slate-300 px-2 py-1.5">Kelas</th>
                        <th className="border border-slate-300 px-2 py-1.5">Nilai Akhir</th>
                        <th className="border border-slate-300 px-2 py-1.5">Predikat</th>
                        <th className="border border-slate-300 px-2 py-1.5">Status KKM</th>
                        <th className="border border-slate-300 px-2 py-1.5">Verifikasi</th>
                      </tr>
                    </thead>
                    <tbody>
                      {analytics.studentRankings.map((st) => {
                        const displayName = anonymizeEnabled
                          ? anonymizeStudentData(st.studentName, st.studentId).maskedName
                          : st.studentName;
                        const displayId = anonymizeEnabled
                          ? anonymizeStudentData(st.studentName, st.studentId).maskedId
                          : st.studentId;

                        return (
                          <tr key={st.studentId + st.rank} className="text-center">
                            <td className="border border-slate-300 px-2 py-1.5 font-bold font-mono">{st.rank}</td>
                            <td className="border border-slate-300 px-2 py-1.5 text-left font-semibold">{displayName}</td>
                            <td className="border border-slate-300 px-2 py-1.5 font-mono">{displayId}</td>
                            <td className="border border-slate-300 px-2 py-1.5">{st.classRoom}</td>
                            <td className="border border-slate-300 px-2 py-1.5 font-mono font-black text-slate-900">{st.scorePercentage}</td>
                            <td className="border border-slate-300 px-2 py-1.5 font-bold">{st.gradeLetter}</td>
                            <td className={`border border-slate-300 px-2 py-1.5 font-bold ${
                              st.isPassed ? 'text-emerald-700' : 'text-rose-700'
                            }`}>
                              {st.isPassed ? 'TUNTAS' : 'REMEDIAL'}
                            </td>
                            <td className="border border-slate-300 px-2 py-1.5 text-[10px] text-slate-600">
                              {st.verifiedByTeacher ? 'Terverifikasi' : 'Tinjauan'}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* BAGIAN IV: TINDAK LANJUT PEMBELAJARAN */}
                <div className="mb-6 p-3 rounded border border-slate-300 bg-slate-50 text-xs">
                  <h4 className="font-bold uppercase mb-1.5 text-slate-900">
                    IV. KESIMPULAN & RENCANA TINDAK LANJUT PEDAGOGIK
                  </h4>
                  <p className="leading-relaxed text-slate-700">
                    1. <strong>Program Remedial:</strong> Siswa yang belum mencapai nilai KKM ({kkmReference}) sebanyak <strong>{analytics.failedCount} orang</strong> wajib mengikuti bimbingan ulang pada materi pokok yang belum tuntas sebelum ujian perbaikan.<br />
                    2. <strong>Program Pengayaan:</strong> Sebanyak <strong>{analytics.passedCount} siswa</strong> yang tuntas diberikan materi pengayaan berbasis pemecahan masalah (Problem-Based Learning).<br />
                    3. <strong>Perbaikan Bank Soal:</strong> Butir soal dengan daya pembeda rendah direvisi redaksi pertanyaannya sebelum dimasukkan ke dalam arsip bank soal berikutnya.
                  </p>
                </div>

                {/* LEMBAR PENGESAHAN TANDA TANGAN DUA KOLOM */}
                <div className="pt-4 grid grid-cols-2 text-xs text-center border-t border-slate-300">
                  <div className="space-y-12">
                    <p className="text-slate-800">Mengetahui,<br /><strong>Kepala Sekolah</strong></p>
                    <div>
                      <p className="font-bold underline uppercase text-slate-950">{teacherProfile.principalName || 'Drs. H. Mulyadi, M.Pd.'}</p>
                      <p className="font-mono text-[11px] text-slate-600">NIP. {teacherProfile.principalNip || '19750820 199903 1 004'}</p>
                      {teacherProfile.principalRank && (
                        <p className="text-[10px] text-slate-500 mt-0.5">{teacherProfile.principalRank}</p>
                      )}
                    </div>
                  </div>

                  <div className="space-y-12">
                    <p className="text-slate-800">
                      {teacherProfile.schoolCity || 'Kota Semarang'}, {new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}<br />
                      <strong>Guru Mata Pelajaran</strong>
                    </p>
                    <div>
                      <p className="font-bold underline uppercase text-slate-950">{teacherProfile.name}</p>
                      <p className="font-mono text-[11px] text-slate-600">NIP. {teacherProfile.nip}</p>
                    </div>
                  </div>
                </div>

              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
