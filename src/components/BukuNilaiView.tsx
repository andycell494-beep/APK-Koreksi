import React, { useState } from 'react';
import {
  BookOpen,
  Download,
  Printer,
  FileSpreadsheet,
  Search,
  Filter,
  CheckCircle,
  Clock,
  Sparkles,
  TrendingUp,
  FileText,
  User,
  ArrowUpDown,
  X,
  ChevronRight,
  Eye,
} from 'lucide-react';
import {
  GradedSubmission,
  anonymizeStudentData,
  exportSubmissionsToCSV,
} from '../utils/gradingLogic';
import { ExportFormat, TeacherProfile, loadTeacherProfile } from '../utils/storage';
import {
  exportBukuNilaiToPdf,
  exportBukuNilaiToWord,
  exportBukuNilaiToExcel,
  exportStudentAssessmentToPdf,
  exportStudentAssessmentToWord,
  exportStudentAssessmentToExcel,
} from '../utils/printUtils';
import { ExportFormatMenu } from './ExportFormatMenu';

interface BukuNilaiViewProps {
  submissions: GradedSubmission[];
  anonymizeEnabled: boolean;
  onSelectSubmission?: (sub: GradedSubmission) => void;
  onNavigateToScan?: () => void;
  onNavigateToStudents?: () => void;
  onBackToResults?: () => void;
}

export const BukuNilaiView: React.FC<BukuNilaiViewProps> = ({
  submissions,
  anonymizeEnabled,
  onSelectSubmission,
  onNavigateToScan,
  onNavigateToStudents,
  onBackToResults,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedClass, setSelectedClass] = useState<string>('all');
  const [selectedExam, setSelectedExam] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'score_desc' | 'score_asc' | 'name_asc'>('score_desc');
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [previewSub, setPreviewSub] = useState<GradedSubmission | null>(null);

  const teacherProfile: TeacherProfile = loadTeacherProfile();

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Unique classes and exams
  const classList = Array.from(new Set(submissions.map((s) => s.classRoom))).filter(Boolean);
  const examList = Array.from(new Set(submissions.map((s) => s.examTitle))).filter(Boolean);

  // Filter submissions
  const filteredSubmissions = submissions.filter((sub) => {
    const matchesSearch =
      sub.studentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      sub.studentId.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesClass = selectedClass === 'all' || sub.classRoom === selectedClass;
    const matchesExam = selectedExam === 'all' || sub.examTitle === selectedExam;
    return matchesSearch && matchesClass && matchesExam;
  });

  // Sort
  const sortedSubmissions = [...filteredSubmissions].sort((a, b) => {
    if (sortBy === 'score_desc') return b.scorePercentage - a.scorePercentage;
    if (sortBy === 'score_asc') return a.scorePercentage - b.scorePercentage;
    return a.studentName.localeCompare(b.studentName);
  });

  // Stats
  const total = sortedSubmissions.length;
  const avg =
    total > 0
      ? Math.round(
          (sortedSubmissions.reduce((acc, curr) => acc + curr.scorePercentage, 0) / total) * 10
        ) / 10
      : 0;
  const passCount = sortedSubmissions.filter((s) => s.isPassed).length;
  const passRate = total > 0 ? Math.round((passCount / total) * 100) : 0;
  const highestScore = total > 0 ? Math.max(...sortedSubmissions.map((s) => s.scorePercentage)) : 0;
  const lowestScore = total > 0 ? Math.min(...sortedSubmissions.map((s) => s.scorePercentage)) : 0;

  // Handle Download Buku Nilai in Word, PDF, or Excel
  const handleBukuNilaiExport = async (format: ExportFormat) => {
    if (sortedSubmissions.length === 0) {
      showToast('Tidak ada data nilai untuk dicetak.');
      return;
    }

    setIsExportingPdf(true);
    try {
      const subjectName = sortedSubmissions[0]?.subject || 'Semua Mata Pelajaran';
      if (format === 'word') {
        const result = await exportBukuNilaiToWord(
          sortedSubmissions,
          selectedClass,
          subjectName,
          teacherProfile,
          anonymizeEnabled
        );
        showToast(result.message);
      } else if (format === 'excel') {
        const result = await exportBukuNilaiToExcel(
          sortedSubmissions,
          selectedClass,
          subjectName,
          teacherProfile,
          anonymizeEnabled
        );
        showToast(result.message);
      } else {
        const result = await exportBukuNilaiToPdf(
          sortedSubmissions,
          selectedClass,
          subjectName,
          teacherProfile,
          anonymizeEnabled
        );
        showToast(result.message);
      }
    } catch (e: any) {
      showToast('Gagal mengunduh Buku Nilai.');
    } finally {
      setIsExportingPdf(false);
    }
  };

  // Handle Download Individual Student Assessment in Word, PDF, or Excel
  const handleDownloadStudentReport = async (
    sub: GradedSubmission,
    format: ExportFormat,
    e?: React.MouseEvent
  ) => {
    if (e) e.stopPropagation();
    setIsExportingPdf(true);
    try {
      if (format === 'word') {
        const result = await exportStudentAssessmentToWord(sub, teacherProfile);
        showToast(result.message);
      } else if (format === 'excel') {
        const result = await exportStudentAssessmentToExcel(sub, teacherProfile);
        showToast(result.message);
      } else {
        const result = await exportStudentAssessmentToPdf(sub, teacherProfile, anonymizeEnabled);
        showToast(result.message);
      }
    } catch (e: any) {
      showToast('Gagal mengunduh rapor asesmen siswa.');
    } finally {
      setIsExportingPdf(false);
    }
  };

  // Handle Export CSV
  const handleExportCSV = () => {
    if (sortedSubmissions.length === 0) return;
    const csv = exportSubmissionsToCSV(sortedSubmissions);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Buku_Daftar_Nilai_${selectedClass}_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Leger nilai berhasil diekspor ke format CSV.');
  };

  return (
    <div className="flex flex-col min-h-[calc(100vh-4.5rem)] pb-24 bg-slate-50 dark:bg-slate-950">
      {/* Top Header Card */}
      <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-4 py-3.5 sticky top-0 z-30 shadow-xs">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              Buku Daftar Nilai
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Leger & Arsip Rekapitulasi Asesmen Peserta Didik
            </p>
          </div>

          <div className="flex items-center gap-1.5">
            {onBackToResults && (
              <button
                type="button"
                onClick={onBackToResults}
                className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold hover:bg-slate-200 transition"
              >
                Kembali
              </button>
            )}

            <button
              type="button"
              onClick={handleExportCSV}
              disabled={sortedSubmissions.length === 0}
              className="px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold flex items-center gap-1 transition disabled:opacity-40"
              title="Ekspor Leger CSV"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">CSV</span>
            </button>

            <ExportFormatMenu
              onExport={handleBukuNilaiExport}
              isExporting={isExportingPdf}
              buttonLabel="Cetak Leger"
              size="sm"
            />
          </div>
        </div>

        {/* Toast Alert */}
        {toastMessage && (
          <div className="mt-2.5 p-2.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/80 border border-indigo-200 dark:border-indigo-800 text-indigo-900 dark:text-indigo-200 text-xs flex items-center justify-between animate-in fade-in">
            <span>{toastMessage}</span>
            <button
              type="button"
              onClick={() => setToastMessage(null)}
              className="font-bold ml-2 text-indigo-600 dark:text-indigo-400"
            >
              Tutup
            </button>
          </div>
        )}

        {/* Filter and Search Bar */}
        <div className="mt-3 space-y-2">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari nama murid atau NIS pada buku nilai..."
              className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 border-none text-xs text-slate-900 dark:text-white placeholder:text-slate-400 font-medium focus:ring-2 focus:ring-indigo-500"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs">
            <select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="px-2.5 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border-none font-semibold truncate"
            >
              <option value="all">Semua Kelas ({submissions.length})</option>
              {classList.map((c) => (
                <option key={c} value={c}>
                  Kelas {c}
                </option>
              ))}
            </select>

            <select
              value={selectedExam}
              onChange={(e) => setSelectedExam(e.target.value)}
              className="px-2.5 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border-none font-semibold truncate"
            >
              <option value="all">Semua Ujian</option>
              {examList.map((ex) => (
                <option key={ex} value={ex}>
                  {ex}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* Statistical Summary Mini Dashboard */}
        <div className="grid grid-cols-4 gap-2">
          <div className="bg-white dark:bg-slate-900 p-3 rounded-2xl border border-slate-200/80 dark:border-slate-800 text-center shadow-2xs">
            <span className="text-[10px] text-slate-400 font-semibold block uppercase">Peserta</span>
            <span className="text-base font-black font-mono text-slate-900 dark:text-white mt-0.5 block">
              {total}
            </span>
          </div>

          <div className="bg-white dark:bg-slate-900 p-3 rounded-2xl border border-slate-200/80 dark:border-slate-800 text-center shadow-2xs">
            <span className="text-[10px] text-slate-400 font-semibold block uppercase">Rata-Rata</span>
            <span className="text-base font-black font-mono text-indigo-600 dark:text-indigo-400 mt-0.5 block">
              {avg}
            </span>
          </div>

          <div className="bg-white dark:bg-slate-900 p-3 rounded-2xl border border-slate-200/80 dark:border-slate-800 text-center shadow-2xs">
            <span className="text-[10px] text-slate-400 font-semibold block uppercase">Ketuntasan</span>
            <span className="text-base font-black font-mono text-emerald-600 dark:text-emerald-400 mt-0.5 block">
              {passRate}%
            </span>
          </div>

          <div className="bg-white dark:bg-slate-900 p-3 rounded-2xl border border-slate-200/80 dark:border-slate-800 text-center shadow-2xs">
            <span className="text-[10px] text-slate-400 font-semibold block uppercase">Tertinggi</span>
            <span className="text-base font-black font-mono text-violet-600 dark:text-violet-400 mt-0.5 block">
              {highestScore}
            </span>
          </div>
        </div>

        {/* Action Callout for Official PDF Print */}
        <div className="p-3.5 rounded-2xl bg-gradient-to-r from-indigo-50 to-violet-50 dark:from-indigo-950/40 dark:to-violet-950/40 border border-indigo-100 dark:border-indigo-900/60 flex items-center justify-between text-xs">
          <div className="min-w-0 pr-3">
            <span className="font-bold text-slate-900 dark:text-white block">
              Cetak Buku Daftar Nilai A4 Landscape
            </span>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
              Dilengkapi Kop Resmi Dinas Pendidikan, Rekap Nilai, dan Lembar Pengesahan.
            </p>
          </div>

          <ExportFormatMenu
            onExport={handleBukuNilaiExport}
            isExporting={isExportingPdf}
            buttonLabel="Unduh Berkas"
            size="sm"
          />
        </div>

        {/* Ledger Records / Submissions */}
        {sortedSubmissions.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 text-center border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
            <BookOpen className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto" />
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">
              Belum Ada Rekap Nilai
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xs mx-auto">
              Periksa lembar jawaban murid untuk mengisi buku nilai atau sesuaikan filter pencarian.
            </p>
            {onNavigateToScan && (
              <button
                type="button"
                onClick={onNavigateToScan}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-bold shadow-md hover:bg-indigo-700 transition"
              >
                <Sparkles className="w-3.5 h-3.5" />
                Mulai Periksa Lembar Jawaban
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-2.5">
            <div className="flex items-center justify-between text-xs px-1">
              <span className="font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider text-[11px]">
                Daftar Arsip Nilai Siswa ({sortedSubmissions.length})
              </span>
              <span className="text-slate-400 text-[11px]">
                Diurutkan skor tertinggi
              </span>
            </div>

            {sortedSubmissions.map((sub, idx) => {
              const displayName = anonymizeEnabled
                ? anonymizeStudentData(sub.studentName, sub.studentId).maskedName
                : sub.studentName;
              const displayId = anonymizeEnabled
                ? anonymizeStudentData(sub.studentName, sub.studentId).maskedId
                : sub.studentId;

              return (
                <div
                  key={sub.id}
                  className="bg-white dark:bg-slate-900 rounded-2xl p-3.5 border border-slate-200/80 dark:border-slate-800 shadow-2xs hover:shadow-xs transition"
                >
                  <div className="flex items-start justify-between gap-2.5">
                    <div className="flex items-start gap-2.5 min-w-0">
                      <span className="w-6 h-6 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-mono font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                        {idx + 1}
                      </span>

                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-xs text-slate-900 dark:text-white truncate">
                            {displayName}
                          </span>
                          <span
                            className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${
                              sub.isPassed
                                ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                                : 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300'
                            }`}
                          >
                            {sub.isPassed ? 'TUNTAS' : 'REMEDIAL'}
                          </span>
                        </div>

                        <p className="text-[11px] text-slate-400 font-mono mt-0.5">
                          NIS: {displayId} • {sub.classRoom}
                        </p>
                        <p className="text-[11px] text-indigo-600 dark:text-indigo-400 font-medium truncate mt-0.5">
                          {sub.examTitle}
                        </p>
                      </div>
                    </div>

                    {/* Score and Individual PDF Print Action */}
                    <div className="flex flex-col items-end shrink-0">
                      <div className="flex items-baseline gap-1">
                        <span className="text-base font-black font-mono text-slate-900 dark:text-white">
                          {sub.scorePercentage}
                        </span>
                        <span className="text-[10px] font-bold text-slate-400">
                          ({sub.gradeLetter})
                        </span>
                      </div>

                      <div className="mt-2 flex items-center gap-1.5">
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={(e) => handleDownloadStudentReport(sub, 'pdf', e)}
                            className="px-2 py-0.5 rounded-md bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 text-[10px] font-bold border border-rose-200 dark:border-rose-800 transition active:scale-95"
                            title="Unduh Rapor PDF"
                          >
                            PDF
                          </button>
                          <button
                            type="button"
                            onClick={(e) => handleDownloadStudentReport(sub, 'word', e)}
                            className="px-2 py-0.5 rounded-md bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 text-[10px] font-bold border border-blue-200 dark:border-blue-800 transition active:scale-95"
                            title="Unduh Rapor Word (.doc)"
                          >
                            Word
                          </button>
                          <button
                            type="button"
                            onClick={(e) => handleDownloadStudentReport(sub, 'excel', e)}
                            className="px-2 py-0.5 rounded-md bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 text-[10px] font-bold border border-emerald-200 dark:border-emerald-800 transition active:scale-95"
                            title="Unduh Rapor Excel (.xls)"
                          >
                            Excel
                          </button>
                        </div>

                        {onSelectSubmission && (
                          <button
                            type="button"
                            onClick={() => onSelectSubmission(sub)}
                            className="p-1 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300 transition"
                            title="Buka Rincian Lembar Jawaban"
                          >
                            <ChevronRight className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
