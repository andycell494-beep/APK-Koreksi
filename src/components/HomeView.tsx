import React from 'react';
import {
  Camera,
  Image as ImageIcon,
  Sparkles,
  TrendingUp,
  Clock,
  CheckCircle2,
  ChevronRight,
  BookOpen,
  ArrowRight,
  Zap,
  Lightbulb,
  Users,
  FileSpreadsheet,
  Printer,
} from 'lucide-react';
import { GradedSubmission, anonymizeStudentData } from '../utils/gradingLogic';
import { TeacherProfile } from '../utils/storage';
import { PWAInstallButton } from './PWAInstallButton';

interface HomeViewProps {
  profile: TeacherProfile;
  submissions: GradedSubmission[];
  anonymizeEnabled: boolean;
  onNavigateToScan: () => void;
  onNavigateToResults: () => void;
  onNavigateToAnalytics: () => void;
  onNavigateToBukuNilai?: () => void;
  onNavigateToStudents?: () => void;
  onSelectSubmission: (sub: GradedSubmission) => void;
}

export const HomeView: React.FC<HomeViewProps> = ({
  profile,
  submissions,
  anonymizeEnabled,
  onNavigateToScan,
  onNavigateToResults,
  onNavigateToAnalytics,
  onNavigateToBukuNilai,
  onNavigateToStudents,
  onSelectSubmission,
}) => {
  const totalGraded = submissions.length;
  const unverifiedCount = submissions.filter((s) => !s.verifiedByTeacher).length;
  const averageScore =
    totalGraded > 0
      ? Math.round(
          (submissions.reduce((acc, curr) => acc + curr.scorePercentage, 0) /
            totalGraded) *
            10
        ) / 10
      : 0;
  const passCount = submissions.filter((s) => s.isPassed).length;
  const passRate = totalGraded > 0 ? Math.round((passCount / totalGraded) * 100) : 0;

  const recentSubmissions = submissions.slice(0, 3);

  return (
    <div className="flex flex-col min-h-[calc(100vh-4.5rem)] pb-24">
      {/* Top Greeting Header */}
      <div className="bg-white dark:bg-slate-900 border-b border-slate-200/80 dark:border-slate-800 px-4 pt-5 pb-4 sticky top-0 z-30 shadow-xs">
        <div className="flex items-center justify-between">
          <div className="min-w-0 pr-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 block">
              Selamat Bertugas,
            </span>
            <h1 className="text-base font-extrabold text-slate-900 dark:text-white truncate">
              {profile.name}
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
              {profile.schoolName}
            </p>
          </div>

          <PWAInstallButton variant="compact" />
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* Hero Mobile Scan Banner (Primary CTA) */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-tr from-indigo-700 via-indigo-600 to-violet-600 text-white p-5 shadow-xl shadow-indigo-600/25">
          {/* Subtle background glow circle */}
          <div className="absolute -right-8 -top-8 w-40 h-40 rounded-full bg-white/10 blur-xl pointer-events-none" />

          <div className="relative z-10 space-y-3">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/20 backdrop-blur-md text-[11px] font-semibold">
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>AI Smart Grading Engine</span>
            </div>

            <div>
              <h2 className="text-lg font-black leading-tight">
                Koreksi Lembar Jawaban Instan
              </h2>
              <p className="text-xs text-indigo-100 mt-1 leading-relaxed">
                Arahkan kamera ke lembar jawaban murid. AI otomatis mendeteksi identitas, mencocokkan kunci, dan menghitung skor.
              </p>
            </div>

            <div className="pt-1 flex gap-2">
              <button
                type="button"
                onClick={onNavigateToScan}
                className="flex-1 py-3 px-4 rounded-xl bg-white text-indigo-700 font-extrabold text-xs shadow-md hover:bg-indigo-50 active:scale-95 transition flex items-center justify-center gap-2"
              >
                <Camera className="w-4 h-4 text-indigo-600" />
                <span>Mulai Periksa Sekarang</span>
              </button>
            </div>
          </div>
        </div>

        {/* Quick Stat Tiles Grid */}
        <div className="grid grid-cols-2 gap-3">
          <div
            onClick={onNavigateToResults}
            className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-xs cursor-pointer hover:border-indigo-300 transition"
          >
            <div className="flex items-center justify-between text-slate-400 mb-1.5">
              <span className="text-[11px] font-semibold">Total Lembar</span>
              <BookOpen className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            </div>
            <div className="text-2xl font-black font-mono text-slate-900 dark:text-white">
              {totalGraded}
            </div>
            <span className="text-[10px] text-slate-400 mt-0.5 block">
              Lembar terarsip
            </span>
          </div>

          <div
            onClick={onNavigateToResults}
            className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-xs cursor-pointer hover:border-amber-300 transition"
          >
            <div className="flex items-center justify-between text-slate-400 mb-1.5">
              <span className="text-[11px] font-semibold">Perlu Tinjauan</span>
              <Clock className="w-4 h-4 text-amber-500" />
            </div>
            <div className="text-2xl font-black font-mono text-amber-600 dark:text-amber-400">
              {unverifiedCount}
            </div>
            <span className="text-[10px] text-slate-400 mt-0.5 block">
              Menunggu verifikasi guru
            </span>
          </div>

          <div
            onClick={onNavigateToAnalytics}
            className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-xs cursor-pointer hover:border-indigo-300 transition"
          >
            <div className="flex items-center justify-between text-slate-400 mb-1.5">
              <span className="text-[11px] font-semibold">Rata-rata Nilai</span>
              <TrendingUp className="w-4 h-4 text-indigo-600" />
            </div>
            <div className="text-2xl font-black font-mono text-slate-900 dark:text-white">
              {averageScore}
            </div>
            <span className="text-[10px] text-slate-400 mt-0.5 block">
              Skala penilaian 0-100
            </span>
          </div>

          <div
            onClick={onNavigateToAnalytics}
            className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-xs cursor-pointer hover:border-emerald-300 transition"
          >
            <div className="flex items-center justify-between text-slate-400 mb-1.5">
              <span className="text-[11px] font-semibold">Ketuntasan KKM</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="text-2xl font-black font-mono text-emerald-600 dark:text-emerald-400">
              {passRate}%
            </div>
            <span className="text-[10px] text-slate-400 mt-0.5 block">
              {passCount} dari {totalGraded} siswa
            </span>
          </div>
        </div>

        {/* Quick Menu: Buku Daftar Nilai & Data Siswa */}
        <div className="grid grid-cols-2 gap-3">
          <div
            onClick={onNavigateToBukuNilai || onNavigateToResults}
            className="p-3.5 rounded-2xl bg-gradient-to-br from-indigo-50 to-blue-50 dark:from-indigo-950/40 dark:to-blue-950/30 border border-indigo-100 dark:border-indigo-900/60 shadow-2xs hover:shadow-xs cursor-pointer transition active:scale-98"
          >
            <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center mb-2 shadow-xs">
              <BookOpen className="w-4 h-4" />
            </div>
            <h4 className="text-xs font-bold text-slate-900 dark:text-white">
              Buku Daftar Nilai
            </h4>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 leading-snug">
              Leger nilai & cetak PDF A4 Landscape
            </p>
          </div>

          <div
            onClick={onNavigateToStudents || onNavigateToResults}
            className="p-3.5 rounded-2xl bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950/40 dark:to-teal-950/30 border border-emerald-100 dark:border-emerald-900/60 shadow-2xs hover:shadow-xs cursor-pointer transition active:scale-98"
          >
            <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center mb-2 shadow-xs">
              <Users className="w-4 h-4" />
            </div>
            <h4 className="text-xs font-bold text-slate-900 dark:text-white">
              Data Siswa & Rombel
            </h4>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 leading-snug">
              Tambah satuan & impor massal
            </p>
          </div>
        </div>

        {/* Recent Grading Cards */}
        <div className="space-y-2.5">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
              Aktivitas Pemeriksaan Terbaru
            </h3>
            <button
              type="button"
              onClick={onNavigateToResults}
              className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 flex items-center gap-0.5"
            >
              <span>Lihat Semua</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {recentSubmissions.length === 0 ? (
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 text-center border border-slate-200 dark:border-slate-800 text-xs text-slate-500">
              Belum ada pemeriksaan terbaru.
            </div>
          ) : (
            <div className="space-y-2">
              {recentSubmissions.map((sub) => {
                const displayName = anonymizeEnabled
                  ? anonymizeStudentData(sub.studentName, sub.studentId).maskedName
                  : sub.studentName;

                return (
                  <div
                    key={sub.id}
                    onClick={() => onSelectSubmission(sub)}
                    className="p-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 flex items-center justify-between shadow-2xs hover:shadow-xs transition cursor-pointer"
                  >
                    <div className="min-w-0 pr-2">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">
                          {displayName}
                        </span>
                        <span
                          className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                            sub.verifiedByTeacher
                              ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                              : 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300'
                          }`}
                        >
                          {sub.verifiedByTeacher ? 'Terverifikasi' : 'Perlu Tinjauan'}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 truncate mt-0.5">
                        {sub.classRoom} • {sub.examTitle}
                      </p>
                    </div>

                    <div className="text-right flex-shrink-0">
                      <span className="text-sm font-black font-mono text-slate-900 dark:text-white">
                        {sub.scorePercentage}
                      </span>
                      <span className="text-[10px] text-slate-400 block font-bold">
                        Predikat {sub.gradeLetter}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Mobile Camera Photography Tips for Max Accuracy */}
        <div className="p-4 rounded-2xl bg-amber-50/70 dark:bg-amber-950/20 border border-amber-200/80 dark:border-amber-900/40 text-xs space-y-2">
          <div className="flex items-center gap-2 text-amber-900 dark:text-amber-300 font-bold">
            <Lightbulb className="w-4 h-4 text-amber-600 flex-shrink-0" />
            <span>Tips Pemindaian Akurat dengan Kamera HP</span>
          </div>
          <ul className="text-amber-800 dark:text-amber-200/90 text-[11px] space-y-1 pl-1 list-disc list-inside">
            <li>Pegang kamera tepat di atas lembar jawaban secara tegak lurus.</li>
            <li>Pastikan pencahayaan terang dan hindari bayangan tangan/badan.</li>
            <li>Pastikan tulisan nama murid dan nomor butir soal tidak terpotong.</li>
          </ul>
        </div>
      </div>
    </div>
  );
};
