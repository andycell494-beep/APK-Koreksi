import React, { useState } from 'react';
import {
  FileCheck2,
  Search,
  CheckCircle,
  Clock,
  ChevronRight,
  Download,
  Trash2,
  Edit3,
  Save,
  Printer,
  Sparkles,
  AlertTriangle,
  X,
  ArrowUpDown,
  BookOpen,
  Users,
  FileText,
  FileSpreadsheet,
} from 'lucide-react';
import {
  GradedSubmission,
  calculateTotalScore,
  determineGradeLetter,
  anonymizeStudentData,
  exportSubmissionsToCSV,
} from '../utils/gradingLogic';
import {
  updateSubmission,
  deleteSubmission,
  loadTeacherProfile,
  TeacherProfile,
  ExportFormat,
} from '../utils/storage';
import {
  exportStudentAssessmentToPdf,
  exportStudentAssessmentToWord,
  exportStudentAssessmentToExcel,
} from '../utils/printUtils';
import { ExportFormatMenu } from './ExportFormatMenu';
import { ConfirmModal } from './ConfirmModal';
import { StudentManagementView } from './StudentManagementView';
import { BukuNilaiView } from './BukuNilaiView';

interface ResultsViewProps {
  submissions: GradedSubmission[];
  onSubmissionsUpdated: () => void;
  anonymizeEnabled: boolean;
  onNavigateToScan: () => void;
  initialSubTab?: 'submissions' | 'buku_nilai' | 'students';
}

export const ResultsView: React.FC<ResultsViewProps> = ({
  submissions,
  onSubmissionsUpdated,
  anonymizeEnabled,
  onNavigateToScan,
  initialSubTab = 'submissions',
}) => {
  const [subTab, setSubTab] = useState<'submissions' | 'buku_nilai' | 'students'>(initialSubTab);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterClass, setFilterClass] = useState('all');
  const [filterStatus, setFilterStatus] = useState<'all' | 'verified' | 'unverified'>('all');
  const [selectedSubmission, setSelectedSubmission] = useState<GradedSubmission | null>(null);

  // Edit / Override state inside detail modal
  const [isEditing, setIsEditing] = useState(false);
  const [editedItems, setEditedItems] = useState<GradedSubmission['items']>([]);
  const [editedFeedback, setEditedFeedback] = useState('');

  // Delete confirm state
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);

  // PDF Export state & toast
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const teacherProfile: TeacherProfile = loadTeacherProfile();

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Unique classes for filter dropdown
  const classList = Array.from(new Set(submissions.map((s) => s.classRoom))).filter(Boolean);

  // Filter & Search logic
  const filteredSubmissions = submissions.filter((sub) => {
    const matchesSearch =
      sub.studentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      sub.studentId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      sub.examTitle.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesClass = filterClass === 'all' || sub.classRoom === filterClass;

    const matchesStatus =
      filterStatus === 'all' ||
      (filterStatus === 'verified' && sub.verifiedByTeacher) ||
      (filterStatus === 'unverified' && !sub.verifiedByTeacher);

    return matchesSearch && matchesClass && matchesStatus;
  });

  const handleOpenDetail = (sub: GradedSubmission) => {
    setSelectedSubmission(sub);
    setEditedItems(JSON.parse(JSON.stringify(sub.items || [])));
    setEditedFeedback(sub.summaryFeedback || '');
    setIsEditing(false);
  };

  const handleScoreChange = (itemIdx: number, newScore: number) => {
    const updated = [...editedItems];
    const max = updated[itemIdx].maxScore || 10;
    const clamped = Math.max(0, Math.min(max, newScore));
    updated[itemIdx] = {
      ...updated[itemIdx],
      score: clamped,
      isCorrect: clamped >= max * 0.75,
    };
    setEditedItems(updated);
  };

  const handleSaveEdits = (markAsVerified = false) => {
    if (!selectedSubmission) return;

    const { totalScore, maxTotalScore, percentage } = calculateTotalScore(editedItems);
    const gradeLetter = determineGradeLetter(percentage);
    const isPassed = percentage >= (selectedSubmission.kkm || 75);

    const updated = updateSubmission(selectedSubmission.id, {
      items: editedItems,
      totalScore,
      maxTotalScore,
      scorePercentage: percentage,
      gradeLetter,
      isPassed,
      summaryFeedback: editedFeedback,
      verifiedByTeacher: markAsVerified ? true : selectedSubmission.verifiedByTeacher,
    });

    if (updated) {
      setSelectedSubmission(updated);
      setIsEditing(false);
      onSubmissionsUpdated();
    }
  };

  const handleConfirmDelete = () => {
    if (deleteTargetId) {
      deleteSubmission(deleteTargetId);
      setDeleteTargetId(null);
      if (selectedSubmission?.id === deleteTargetId) {
        setSelectedSubmission(null);
      }
      onSubmissionsUpdated();
    }
  };

  const handleExportCSV = () => {
    const csv = exportSubmissionsToCSV(filteredSubmissions);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `rekap_nilai_smartgrade_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Download Individual Student Assessment in Word, PDF, or Excel
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
    } catch (err: any) {
      showToast('Gagal membuat berkas rapor asesmen siswa.');
    } finally {
      setIsExportingPdf(false);
    }
  };

  // Render Sub-Views if Buku Nilai or Data Siswa is active
  if (subTab === 'buku_nilai') {
    return (
      <div className="flex flex-col min-h-screen">
        {/* Sub-navigation bar */}
        <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-3 pt-2.5 pb-1 sticky top-0 z-40">
          <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none text-xs">
            <button
              type="button"
              onClick={() => setSubTab('submissions')}
              className="px-3 py-1.5 rounded-xl font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            >
              Hasil Koreksi
            </button>
            <button
              type="button"
              onClick={() => setSubTab('buku_nilai')}
              className="px-3 py-1.5 rounded-xl font-bold bg-indigo-600 text-white shadow-xs transition"
            >
              Buku Daftar Nilai
            </button>
            <button
              type="button"
              onClick={() => setSubTab('students')}
              className="px-3 py-1.5 rounded-xl font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            >
              Kelola Siswa
            </button>
          </div>
        </div>

        <BukuNilaiView
          submissions={submissions}
          anonymizeEnabled={anonymizeEnabled}
          onSelectSubmission={handleOpenDetail}
          onNavigateToScan={onNavigateToScan}
          onNavigateToStudents={() => setSubTab('students')}
        />
      </div>
    );
  }

  if (subTab === 'students') {
    return (
      <div className="flex flex-col min-h-screen">
        {/* Sub-navigation bar */}
        <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-3 pt-2.5 pb-1 sticky top-0 z-40">
          <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none text-xs">
            <button
              type="button"
              onClick={() => setSubTab('submissions')}
              className="px-3 py-1.5 rounded-xl font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            >
              Hasil Koreksi
            </button>
            <button
              type="button"
              onClick={() => setSubTab('buku_nilai')}
              className="px-3 py-1.5 rounded-xl font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            >
              Buku Daftar Nilai
            </button>
            <button
              type="button"
              onClick={() => setSubTab('students')}
              className="px-3 py-1.5 rounded-xl font-bold bg-indigo-600 text-white shadow-xs transition"
            >
              Kelola Siswa
            </button>
          </div>
        </div>

        <StudentManagementView onBackToResults={() => setSubTab('submissions')} />
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-[calc(100vh-4.5rem)] pb-24">
      {/* Top Header Card */}
      <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-4 py-3 sticky top-0 z-30 shadow-xs">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
              <FileCheck2 className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              Hasil Nilai Asesmen
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Daftar Pemeriksaan, Koreksi & Verifikasi Skor Guru
            </p>
          </div>

          <button
            type="button"
            onClick={handleExportCSV}
            disabled={filteredSubmissions.length === 0}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 text-white text-xs font-semibold hover:bg-emerald-700 active:scale-95 transition disabled:opacity-50"
            title="Unduh Rekap Format CSV/Excel"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Ekspor CSV</span>
          </button>
        </div>

        {/* Global Toast Alert */}
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

        {/* Navigation Switcher Pills */}
        <div className="flex items-center gap-1.5 mt-3 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
          <button
            type="button"
            onClick={() => setSubTab('submissions')}
            className={`px-3 py-1.5 rounded-xl font-bold transition flex items-center gap-1.5 ${
              subTab === 'submissions'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
            }`}
          >
            <FileCheck2 className="w-3.5 h-3.5" />
            <span>Hasil Koreksi ({submissions.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setSubTab('buku_nilai')}
            className="px-3 py-1.5 rounded-xl font-bold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition flex items-center gap-1.5"
          >
            <BookOpen className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
            <span>Buku Nilai</span>
          </button>

          <button
            type="button"
            onClick={() => setSubTab('students')}
            className="px-3 py-1.5 rounded-xl font-bold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition flex items-center gap-1.5"
          >
            <Users className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>Data Siswa</span>
          </button>
        </div>

        {/* Search & Filter Bar */}
        <div className="mt-3 space-y-2">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari nama murid, NIS, atau ujian..."
              className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 border-none text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:ring-2 focus:ring-indigo-500 font-medium"
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

          {/* Filter Pills */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none text-xs">
            <button
              type="button"
              onClick={() => setFilterStatus('all')}
              className={`px-3 py-1 rounded-full whitespace-nowrap font-medium transition ${
                filterStatus === 'all'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
              }`}
            >
              Semua ({submissions.length})
            </button>
            <button
              type="button"
              onClick={() => setFilterStatus('unverified')}
              className={`px-3 py-1 rounded-full whitespace-nowrap font-medium transition flex items-center gap-1 ${
                filterStatus === 'unverified'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300'
              }`}
            >
              <Clock className="w-3 h-3" />
              Perlu Tinjauan ({submissions.filter((s) => !s.verifiedByTeacher).length})
            </button>
            <button
              type="button"
              onClick={() => setFilterStatus('verified')}
              className={`px-3 py-1 rounded-full whitespace-nowrap font-medium transition flex items-center gap-1 ${
                filterStatus === 'verified'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300'
              }`}
            >
              <CheckCircle className="w-3 h-3" />
              Terverifikasi ({submissions.filter((s) => s.verifiedByTeacher).length})
            </button>

            {classList.length > 0 && (
              <select
                value={filterClass}
                onChange={(e) => setFilterClass(e.target.value)}
                className="px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-none text-xs"
              >
                <option value="all">Semua Kelas</option>
                {classList.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            )}
          </div>
        </div>
      </div>

      {/* Submission Cards List */}
      <div className="p-4 space-y-3">
        {filteredSubmissions.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 text-center border border-slate-200 dark:border-slate-800 shadow-sm">
            <BookOpen className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
            <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">
              Belum Ada Lembar Jawaban
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xs mx-auto mt-1 mb-5">
              Mulai periksa lembar jawaban murid dengan kamera HP atau unggah foto dari galeri.
            </p>
            <button
              type="button"
              onClick={onNavigateToScan}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 text-white text-xs font-bold shadow-md hover:bg-indigo-700 active:scale-95 transition"
            >
              <Sparkles className="w-4 h-4" />
              Mulai Periksa Sekarang
            </button>
          </div>
        ) : (
          filteredSubmissions.map((sub) => {
            const displayName = anonymizeEnabled
              ? anonymizeStudentData(sub.studentName, sub.studentId).maskedName
              : sub.studentName;
            const displayId = anonymizeEnabled
              ? anonymizeStudentData(sub.studentName, sub.studentId).maskedId
              : sub.studentId;

            return (
              <div
                key={sub.id}
                onClick={() => handleOpenDetail(sub)}
                className="group bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200/90 dark:border-slate-800 shadow-xs hover:shadow-md hover:border-indigo-200 dark:hover:border-indigo-900 transition-all cursor-pointer"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-bold text-slate-900 dark:text-white truncate">
                        {displayName}
                      </span>
                      {sub.verifiedByTeacher ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 text-[10px] font-semibold">
                          <CheckCircle className="w-3 h-3" /> Verif
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 text-[10px] font-semibold">
                          <Clock className="w-3 h-3" /> Tinjau
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                      {sub.classRoom} • NIS: {displayId}
                    </p>
                    <p className="text-[11px] text-indigo-600 dark:text-indigo-400 font-medium truncate mt-0.5">
                      {sub.examTitle} ({sub.subject})
                    </p>
                  </div>

                  {/* Score Pill */}
                  <div className="flex flex-col items-end">
                    <div
                      className={`w-13 h-13 rounded-2xl flex flex-col items-center justify-center font-black shadow-xs ${
                        sub.isPassed
                          ? 'bg-emerald-50 text-emerald-600 border border-emerald-200 dark:bg-emerald-950/60 dark:border-emerald-800'
                          : 'bg-rose-50 text-rose-600 border border-rose-200 dark:bg-rose-950/60 dark:border-rose-800'
                      }`}
                    >
                      <span className="text-base leading-none font-mono">
                        {sub.scorePercentage}
                      </span>
                      <span className="text-[10px] font-bold mt-0.5">
                        {sub.gradeLetter}
                      </span>
                    </div>
                    <span className="text-[10px] text-slate-400 mt-1 font-mono">
                      KKM: {sub.kkm}
                    </span>
                  </div>
                </div>

                {/* Card Bottom: Rapor multi-format buttons & Feedback snippet */}
                <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={(e) => handleDownloadStudentReport(sub, 'pdf', e)}
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 font-bold text-[10px] border border-rose-200 dark:border-rose-800 transition active:scale-95"
                      title="Unduh Rapor PDF"
                    >
                      <Printer className="w-2.5 h-2.5 text-rose-600" />
                      <span>PDF</span>
                    </button>
                    <button
                      type="button"
                      onClick={(e) => handleDownloadStudentReport(sub, 'word', e)}
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 font-bold text-[10px] border border-blue-200 dark:border-blue-800 transition active:scale-95"
                      title="Unduh Rapor Word (.doc)"
                    >
                      <FileText className="w-2.5 h-2.5 text-blue-600" />
                      <span>Word</span>
                    </button>
                    <button
                      type="button"
                      onClick={(e) => handleDownloadStudentReport(sub, 'excel', e)}
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 font-bold text-[10px] border border-emerald-200 dark:border-emerald-800 transition active:scale-95"
                      title="Unduh Rapor Excel (.xls)"
                    >
                      <FileSpreadsheet className="w-2.5 h-2.5 text-emerald-600" />
                      <span>Excel</span>
                    </button>
                  </div>

                  <div className="flex items-center gap-1 text-slate-400 group-hover:text-indigo-600 transition text-[11px]">
                    <span>Buka Rincian</span>
                    <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition" />
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Detailed Result & Teacher Correction Modal */}
      {selectedSubmission && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in"
        >
          <div className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-t-3xl sm:rounded-3xl shadow-2xl max-h-[92vh] flex flex-col overflow-hidden border border-slate-200 dark:border-slate-800 animate-in slide-in-from-bottom">
            {/* Modal Header */}
            <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/80 dark:bg-slate-850">
              <div className="min-w-0 pr-3">
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold text-slate-900 dark:text-white truncate">
                    {anonymizeEnabled
                      ? anonymizeStudentData(selectedSubmission.studentName, selectedSubmission.studentId).maskedName
                      : selectedSubmission.studentName}
                  </h3>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      selectedSubmission.verifiedByTeacher
                        ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                        : 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300'
                    }`}
                  >
                    {selectedSubmission.verifiedByTeacher ? 'Terverifikasi' : 'Perlu Tinjauan'}
                  </span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {selectedSubmission.classRoom} • {selectedSubmission.examTitle}
                </p>
              </div>

              <div className="flex items-center gap-1">
                <ExportFormatMenu
                  onExport={(fmt) => handleDownloadStudentReport(selectedSubmission, fmt)}
                  isExporting={isExportingPdf}
                  buttonLabel="Unduh Rapor"
                  size="sm"
                />
                <button
                  type="button"
                  onClick={() => setDeleteTargetId(selectedSubmission.id)}
                  aria-label="Hapus Nilai"
                  className="p-2 rounded-xl text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40"
                  title="Hapus Nilai Murid"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedSubmission(null)}
                  aria-label="Tutup Detail"
                  className="p-2 rounded-xl text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Body: Scrollable content */}
            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              {/* Score Summary Box */}
              <div className="p-4 rounded-2xl bg-gradient-to-br from-indigo-50 to-violet-50 dark:from-indigo-950/40 dark:to-violet-950/30 border border-indigo-100 dark:border-indigo-900/60 flex items-center justify-between">
                <div>
                  <span className="text-xs text-indigo-700 dark:text-indigo-300 font-semibold uppercase tracking-wider block">
                    Nilai Akhir Murid
                  </span>
                  <div className="flex items-baseline gap-2 mt-1">
                    <span className="text-3xl font-black font-mono text-slate-900 dark:text-white">
                      {isEditing
                        ? calculateTotalScore(editedItems).percentage
                        : selectedSubmission.scorePercentage}
                    </span>
                    <span className="text-sm font-bold text-slate-500">
                      / 100
                    </span>
                    <span
                      className={`ml-2 px-2 py-0.5 rounded-lg text-xs font-black ${
                        selectedSubmission.isPassed
                          ? 'bg-emerald-500 text-white'
                          : 'bg-rose-500 text-white'
                      }`}
                    >
                      Predikat {isEditing ? determineGradeLetter(calculateTotalScore(editedItems).percentage) : selectedSubmission.gradeLetter}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    {selectedSubmission.isPassed ? '✓ Memenuhi KKM' : '✕ Belum Memenuhi KKM'} ({selectedSubmission.kkm})
                  </p>
                </div>

                <div className="flex flex-col gap-2">
                  <button
                    type="button"
                    onClick={() => setIsEditing(!isEditing)}
                    className="px-3.5 py-2 rounded-xl border border-indigo-200 dark:border-indigo-800 bg-white dark:bg-slate-800 text-xs font-semibold text-indigo-600 dark:text-indigo-400 shadow-xs flex items-center gap-1.5 active:scale-95"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>{isEditing ? 'Batal Edit' : 'Koreksi Nilai'}</span>
                  </button>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => handleDownloadStudentReport(selectedSubmission, 'pdf')}
                      disabled={isExportingPdf}
                      className="px-2.5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-xs flex items-center justify-center gap-1 active:scale-95 transition"
                      title="Unduh Rapor PDF"
                    >
                      <Printer className="w-3.5 h-3.5" />
                      <span>PDF</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDownloadStudentReport(selectedSubmission, 'word')}
                      disabled={isExportingPdf}
                      className="px-2.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs flex items-center justify-center gap-1 active:scale-95 transition"
                      title="Unduh Rapor Word (.doc)"
                    >
                      <FileText className="w-3.5 h-3.5" />
                      <span>Word</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDownloadStudentReport(selectedSubmission, 'excel')}
                      disabled={isExportingPdf}
                      className="px-2.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs flex items-center justify-center gap-1 active:scale-95 transition"
                      title="Unduh Rapor Excel (.xls)"
                    >
                      <FileSpreadsheet className="w-3.5 h-3.5" />
                      <span>Excel</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* AI Feedback & Teacher Notes */}
              <div className="space-y-2">
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                  Ulasan & Catatan Guru
                </span>
                {isEditing ? (
                  <textarea
                    value={editedFeedback}
                    onChange={(e) => setEditedFeedback(e.target.value)}
                    rows={3}
                    className="w-full p-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs focus:ring-2 focus:ring-indigo-500"
                    placeholder="Tuliskan catatan khusus atau saran perbaikan untuk murid..."
                  />
                ) : (
                  <p className="text-xs text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-800/60 p-3 rounded-xl leading-relaxed">
                    {selectedSubmission.summaryFeedback}
                  </p>
                )}
              </div>

              {/* Strengths & Improvements */}
              {selectedSubmission.strengths?.length > 0 && (
                <div className="space-y-1">
                  <span className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400">
                    Kelebihan / Pemahaman Baik:
                  </span>
                  <ul className="text-xs text-slate-600 dark:text-slate-300 list-disc list-inside space-y-0.5">
                    {selectedSubmission.strengths.map((str, idx) => (
                      <li key={idx}>{str}</li>
                    ))}
                  </ul>
                </div>
              )}

              {selectedSubmission.improvements?.length > 0 && (
                <div className="space-y-1">
                  <span className="text-[11px] font-bold text-amber-700 dark:text-amber-400">
                    Perlu Peningkatan:
                  </span>
                  <ul className="text-xs text-slate-600 dark:text-slate-300 list-disc list-inside space-y-0.5">
                    {selectedSubmission.improvements.map((imp, idx) => (
                      <li key={idx}>{imp}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Question Item Breakdown */}
              <div className="space-y-2 pt-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                    Rincian Jawaban Per Butir Soal
                  </span>
                  {isEditing && (
                    <span className="text-[10px] text-indigo-600 font-semibold">
                      Mode Koreksi Aktif
                    </span>
                  )}
                </div>

                <div className="space-y-2">
                  {(isEditing ? editedItems : selectedSubmission.items || []).map((item, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200/80 dark:border-slate-700 text-xs space-y-1.5"
                    >
                      <div className="flex items-start justify-between">
                        <span className="font-bold text-slate-800 dark:text-slate-200">
                          Soal #{item.number} {item.type === 'essay' ? '(Esai/Uraian)' : '(Pilihan Ganda)'}
                        </span>

                        {isEditing ? (
                          <div className="flex items-center gap-1">
                            <span className="text-[11px] text-slate-400">Skor:</span>
                            <input
                              type="number"
                              min={0}
                              max={item.maxScore}
                              value={item.score}
                              onChange={(e) =>
                                handleScoreChange(idx, Number(e.target.value) || 0)
                              }
                              className="w-14 px-2 py-1 rounded bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 text-xs font-mono font-bold text-center"
                            />
                            <span className="text-slate-400 font-mono">/ {item.maxScore}</span>
                          </div>
                        ) : (
                          <span
                            className={`font-mono font-bold px-2 py-0.5 rounded ${
                              item.isCorrect
                                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                                : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                            }`}
                          >
                            {item.score} / {item.maxScore}
                          </span>
                        )}
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-[11px]">
                        <div>
                          <span className="text-slate-400 block">Jawaban Siswa:</span>
                          <span className="font-medium text-slate-700 dark:text-slate-300">
                            {item.studentAnswer || '-'}
                          </span>
                        </div>
                        {item.correctAnswer && (
                          <div>
                            <span className="text-slate-400 block">Kunci / Acuan:</span>
                            <span className="font-medium text-slate-700 dark:text-slate-300">
                              {item.correctAnswer}
                            </span>
                          </div>
                        )}
                      </div>

                      {item.feedback && (
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 pt-1 border-t border-slate-200/60 dark:border-slate-700/60">
                          💡 {item.feedback}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Modal Footer Actions */}
            <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center gap-2">
              {isEditing ? (
                <>
                  <button
                    type="button"
                    onClick={() => handleSaveEdits(false)}
                    className="flex-1 py-3 rounded-xl bg-slate-800 text-white text-xs font-bold hover:bg-slate-700 active:scale-95 transition"
                  >
                    Simpan Perubahan
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSaveEdits(true)}
                    className="flex-1 py-3 rounded-xl bg-indigo-600 text-white text-xs font-bold hover:bg-indigo-700 active:scale-95 transition flex items-center justify-center gap-1.5"
                  >
                    <CheckCircle className="w-4 h-4" />
                    <span>Verifikasi & Simpan</span>
                  </button>
                </>
              ) : (
                <>
                  {!selectedSubmission.verifiedByTeacher ? (
                    <button
                      type="button"
                      onClick={() => {
                        const updated = updateSubmission(selectedSubmission.id, {
                          verifiedByTeacher: true,
                        });
                        if (updated) {
                          setSelectedSubmission(updated);
                          onSubmissionsUpdated();
                        }
                      }}
                      className="flex-1 py-3 rounded-xl bg-indigo-600 text-white text-xs font-bold hover:bg-indigo-700 active:scale-95 transition flex items-center justify-center gap-1.5 shadow-md"
                    >
                      <CheckCircle className="w-4 h-4" />
                      <span>Verifikasi Nilai Ini</span>
                    </button>
                  ) : (
                    <div className="flex-1 text-center py-2 text-xs font-semibold text-emerald-600 dark:text-emerald-400 flex items-center justify-center gap-1">
                      <CheckCircle className="w-4 h-4" />
                      <span>Telah Diverifikasi Guru</span>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Dialog before deleting */}
      <ConfirmModal
        isOpen={!!deleteTargetId}
        title="Hapus Hasil Nilai?"
        message="Data penilaian murid ini akan dihapus permanen dari penyimpanan perangkat Anda. Tindakan ini tidak dapat dibatalkan."
        confirmLabel="Hapus Data"
        cancelLabel="Batal"
        isDestructive={true}
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteTargetId(null)}
      />
    </div>
  );
};
