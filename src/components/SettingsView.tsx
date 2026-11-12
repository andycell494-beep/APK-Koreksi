import React, { useState } from 'react';
import {
  Settings,
  User,
  Moon,
  Sun,
  Shield,
  Download,
  Upload,
  RefreshCw,
  Sliders,
  CheckCircle,
  HelpCircle,
  Smartphone,
  Info,
  FileText,
  FileSpreadsheet,
  Printer,
  Award,
  Building2,
  MapPin,
  School,
  UserCheck,
} from 'lucide-react';
import {
  loadTeacherProfile,
  saveTeacherProfile,
  loadSubmissions,
  saveSubmissions,
  TeacherProfile,
} from '../utils/storage';
import { PWAInstallButton } from './PWAInstallButton';
import { ConfirmModal } from './ConfirmModal';

interface SettingsViewProps {
  currentTheme: 'light' | 'dark';
  onToggleTheme: () => void;
  anonymizeEnabled: boolean;
  onToggleAnonymize: (enabled: boolean) => void;
  onDataReset: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  currentTheme,
  onToggleTheme,
  anonymizeEnabled,
  onToggleAnonymize,
  onDataReset,
}) => {
  const [profile, setProfile] = useState<TeacherProfile>(loadTeacherProfile());
  const [saveToast, setSaveToast] = useState(false);
  const [principalSaveToast, setPrincipalSaveToast] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  const handleProfileSave = (e: React.FormEvent) => {
    e.preventDefault();
    saveTeacherProfile(profile);
    setSaveToast(true);
    setTimeout(() => setSaveToast(false), 2500);
  };

  const handlePrincipalSave = (e: React.FormEvent) => {
    e.preventDefault();
    saveTeacherProfile(profile);
    setPrincipalSaveToast(true);
    setTimeout(() => setPrincipalSaveToast(false), 2500);
  };

  const handleBackupJSON = () => {
    const data = {
      profile,
      submissions: loadSubmissions(),
      exportedAt: new Date().toISOString(),
      version: '2.0.0',
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `backup_smartgrade_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleRestoreJSON = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        if (json.submissions && Array.isArray(json.submissions)) {
          saveSubmissions(json.submissions);
        }
        if (json.profile) {
          saveTeacherProfile(json.profile);
          setProfile(json.profile);
        }
        alert('Data berhasil dipulihkan dari berkas cadangan!');
        onDataReset();
      } catch {
        alert('Berkas cadangan tidak valid.');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="flex flex-col min-h-[calc(100vh-4.5rem)] pb-24">
      {/* Top Header Card */}
      <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-4 py-3 sticky top-0 z-30 shadow-xs">
        <h1 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
          <Settings className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
          Pengaturan Aplikasi
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Profil Guru, Tampilan, Privasi Murid & PWA
        </p>
      </div>

      <div className="p-4 space-y-4">
        {/* PWA Install Promo Card */}
        <div className="p-4 rounded-2xl bg-gradient-to-br from-indigo-600 to-violet-700 text-white shadow-md space-y-3">
          <div className="flex items-center gap-2.5">
            <Smartphone className="w-6 h-6 text-indigo-200" />
            <div>
              <h3 className="text-sm font-bold">Pasang Sebagai Aplikasi Native</h3>
              <p className="text-xs text-indigo-100">
                Akses instan dari layar utama HP tanpa buka browser
              </p>
            </div>
          </div>
          <PWAInstallButton className="w-full bg-white text-indigo-700 hover:bg-indigo-50 border-none shadow-none" />
        </div>

        {/* Teacher Profile Form */}
        <form
          onSubmit={handleProfileSave}
          className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200 dark:border-slate-800 shadow-xs space-y-3"
        >
          <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
            <span className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
              <User className="w-4 h-4 text-indigo-600" />
              Profil Pengajar & Sekolah
            </span>
            {saveToast && (
              <span className="text-xs font-semibold text-emerald-600 flex items-center gap-1 animate-in fade-in">
                <CheckCircle className="w-3.5 h-3.5" /> Tersimpan
              </span>
            )}
          </div>

          <div className="space-y-3 text-xs">
            <div>
              <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                Nama Lengkap & Gelar Guru
              </label>
              <input
                type="text"
                value={profile.name}
                onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                className="w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs"
                placeholder="Contoh: Ibu Ratna Dewi, S.Pd."
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  NIP / No. Induk Pegawai
                </label>
                <input
                  type="text"
                  value={profile.nip}
                  onChange={(e) => setProfile({ ...profile, nip: e.target.value })}
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-mono"
                  placeholder="19880415..."
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Jenjang Satuan
                </label>
                <select
                  value={profile.gradeLevel}
                  onChange={(e) => setProfile({ ...profile, gradeLevel: e.target.value })}
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs"
                >
                  <option value="SD / MI">SD / MI</option>
                  <option value="SMP / MTs">SMP / MTs</option>
                  <option value="SMA / MA">SMA / MA</option>
                  <option value="SMK / MAK">SMK / MAK</option>
                  <option value="Perguruan Tinggi">Perguruan Tinggi</option>
                </select>
              </div>
            </div>

            <div>
              <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                Nama Sekolah / Instansi
              </label>
              <input
                type="text"
                value={profile.schoolName}
                onChange={(e) => setProfile({ ...profile, schoolName: e.target.value })}
                className="w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs"
                placeholder="Contoh: SMA Negeri 1 Prestasi"
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-2.5 rounded-xl bg-slate-900 dark:bg-indigo-600 text-white font-semibold text-xs hover:bg-slate-800 active:scale-95 transition"
          >
            Simpan Profil Guru
          </button>
        </form>

        {/* Data Kepala Sekolah & Kedinasan Form */}
        <form
          onSubmit={handlePrincipalSave}
          className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200 dark:border-slate-800 shadow-xs space-y-3.5"
        >
          <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
            <div>
              <span className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
                <School className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                Data Kepala Sekolah & Pejabat Penandatangan
              </span>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                Informasi legalitas Kepala Satuan Pendidikan pada lembar pengesahan rapor, leger, dan analisis.
              </p>
            </div>
            {principalSaveToast && (
              <span className="text-xs font-semibold text-emerald-600 flex items-center gap-1 shrink-0 animate-in fade-in">
                <CheckCircle className="w-3.5 h-3.5" /> Tersimpan
              </span>
            )}
          </div>

          <div className="space-y-3 text-xs">
            {/* Nama & NIP Kepala Sekolah */}
            <div>
              <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                Nama Lengkap & Gelar Kepala Sekolah
              </label>
              <input
                type="text"
                value={profile.principalName || ''}
                onChange={(e) => setProfile({ ...profile, principalName: e.target.value })}
                className="w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white"
                placeholder="Contoh: Drs. H. Mulyadi, M.Pd."
              />
              <p className="text-[10px] text-slate-400 mt-1">
                Dicantumkan sebagai penandatangan pertama pada lembar pengesahan resmi.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  NIP Kepala Sekolah
                </label>
                <input
                  type="text"
                  value={profile.principalNip || ''}
                  onChange={(e) => setProfile({ ...profile, principalNip: e.target.value })}
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-mono text-slate-900 dark:text-white"
                  placeholder="Contoh: 19750820 199903 1 004"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Pangkat / Golongan Ruang
                </label>
                <input
                  type="text"
                  value={profile.principalRank || ''}
                  onChange={(e) => setProfile({ ...profile, principalRank: e.target.value })}
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white"
                  placeholder="Contoh: Pembina Utama Muda, IV/c"
                />
              </div>
            </div>

            {/* Kota, NPSN & Alamat Sekolah */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1 flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-slate-400" />
                  Kota / Kabupaten Kedudukan Sekolah
                </label>
                <input
                  type="text"
                  value={profile.schoolCity || ''}
                  onChange={(e) => setProfile({ ...profile, schoolCity: e.target.value })}
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white"
                  placeholder="Contoh: Kota Semarang"
                />
                <p className="text-[10px] text-slate-400 mt-1">
                  Lokasi penandatanganan dokumen (misal: Kota Semarang, 12 November 2026).
                </p>
              </div>

              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1 flex items-center gap-1">
                  <Building2 className="w-3.5 h-3.5 text-slate-400" />
                  NPSN (Nomor Pokok Sekolah Nasional)
                </label>
                <input
                  type="text"
                  value={profile.schoolNpsn || ''}
                  onChange={(e) => setProfile({ ...profile, schoolNpsn: e.target.value })}
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-mono text-slate-900 dark:text-white"
                  placeholder="Contoh: 20328901"
                />
              </div>
            </div>

            <div>
              <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                Alamat Lengkap Satuan Pendidikan
              </label>
              <input
                type="text"
                value={profile.schoolAddress || ''}
                onChange={(e) => setProfile({ ...profile, schoolAddress: e.target.value })}
                className="w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white"
                placeholder="Contoh: Jl. Pendidikan No. 45, Semarang Selatan"
              />
              <p className="text-[10px] text-slate-400 mt-1">
                Ditampilkan pada baris sub-kop surat dinas resmi di seluruh dokumen cetak.
              </p>
            </div>

            {/* Live Signature Block Preview */}
            <div className="mt-3 p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-dashed border-slate-200 dark:border-slate-700 space-y-2">
              <div className="flex items-center justify-between text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                <span className="flex items-center gap-1.5">
                  <Award className="w-3.5 h-3.5 text-emerald-600" />
                  Pratinjau Kolom Pengesahan Tanda Tangan Dokumen
                </span>
                <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                  Resmi
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2 text-center text-[11px] border-t border-slate-200 dark:border-slate-700/80">
                <div className="space-y-6 bg-white dark:bg-slate-900 p-2.5 rounded-lg border border-slate-100 dark:border-slate-800">
                  <p className="text-slate-600 dark:text-slate-400">
                    Mengetahui,<br />
                    <strong className="text-slate-800 dark:text-slate-200">Kepala Sekolah</strong>
                  </p>
                  <div>
                    <p className="font-bold underline text-slate-900 dark:text-white truncate">
                      {profile.principalName || 'Drs. H. Mulyadi, M.Pd.'}
                    </p>
                    <p className="text-[10px] font-mono text-slate-500 truncate">
                      NIP. {profile.principalNip || '19750820 199903 1 004'}
                    </p>
                    {profile.principalRank && (
                      <p className="text-[9px] text-slate-400 truncate mt-0.5">
                        {profile.principalRank}
                      </p>
                    )}
                  </div>
                </div>

                <div className="space-y-6 bg-white dark:bg-slate-900 p-2.5 rounded-lg border border-slate-100 dark:border-slate-800">
                  <p className="text-slate-600 dark:text-slate-400">
                    {profile.schoolCity || 'Kota Semarang'}, {new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}<br />
                    <strong className="text-slate-800 dark:text-slate-200">Guru Pengampu</strong>
                  </p>
                  <div>
                    <p className="font-bold underline text-slate-900 dark:text-white truncate">
                      {profile.name || 'Guru Pengampu'}
                    </p>
                    <p className="text-[10px] font-mono text-slate-500 truncate">
                      NIP. {profile.nip || '-'}
                    </p>
                    <p className="text-[9px] text-slate-400 truncate mt-0.5">
                      {profile.schoolName || 'Satuan Pendidikan'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-sm active:scale-95 transition flex items-center justify-center gap-1.5"
          >
            <UserCheck className="w-4 h-4" />
            <span>Simpan Data Kepala Sekolah & Sekolah</span>
          </button>
        </form>

        {/* Pengaturan Format Berkas Cetak & Ekspor (Word, PDF, Excel) */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
            <div>
              <span className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider block">
                Format Berkas Cetak & Ekspor
              </span>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                Atur format bawaan cetak rapor, analisis nilai, dan buku daftar nilai
              </p>
            </div>
            {saveToast && (
              <span className="text-xs font-semibold text-emerald-600 flex items-center gap-1 animate-in fade-in">
                <CheckCircle className="w-3.5 h-3.5" /> Tersimpan
              </span>
            )}
          </div>

          {/* Format Pilihan Utama: 3 Radio Cards */}
          <div>
            <label className="text-xs font-bold text-slate-800 dark:text-slate-200 block mb-2">
              Pilihan Format Utama / Bawaan:
            </label>
            <div className="grid grid-cols-3 gap-2">
              {/* PDF Option */}
              <button
                type="button"
                onClick={() => {
                  const updated = { ...profile, defaultExportFormat: 'pdf' as const };
                  setProfile(updated);
                  saveTeacherProfile(updated);
                  setSaveToast(true);
                  setTimeout(() => setSaveToast(false), 2000);
                }}
                className={`p-3 rounded-2xl border text-left flex flex-col justify-between transition-all active:scale-95 ${
                  (profile.defaultExportFormat || 'pdf') === 'pdf'
                    ? 'border-rose-500 bg-rose-50/70 dark:bg-rose-950/40 dark:border-rose-700 shadow-xs'
                    : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-850 opacity-75 hover:opacity-100'
                }`}
              >
                <div>
                  <div className="w-7 h-7 rounded-lg bg-rose-600 text-white flex items-center justify-center mb-1.5 shadow-2xs">
                    <Printer className="w-4 h-4" />
                  </div>
                  <span className="text-xs font-black text-slate-900 dark:text-white block">
                    PDF (.pdf)
                  </span>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 leading-tight">
                    Siap cetak & arsip resmi
                  </p>
                </div>
                {(profile.defaultExportFormat || 'pdf') === 'pdf' && (
                  <span className="mt-2 text-[9px] font-bold text-rose-700 dark:text-rose-300 flex items-center gap-0.5">
                    <CheckCircle className="w-3 h-3" /> Terpilih
                  </span>
                )}
              </button>

              {/* Word Option */}
              <button
                type="button"
                onClick={() => {
                  const updated = { ...profile, defaultExportFormat: 'word' as const };
                  setProfile(updated);
                  saveTeacherProfile(updated);
                  setSaveToast(true);
                  setTimeout(() => setSaveToast(false), 2000);
                }}
                className={`p-3 rounded-2xl border text-left flex flex-col justify-between transition-all active:scale-95 ${
                  profile.defaultExportFormat === 'word'
                    ? 'border-blue-500 bg-blue-50/70 dark:bg-blue-950/40 dark:border-blue-700 shadow-xs'
                    : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-850 opacity-75 hover:opacity-100'
                }`}
              >
                <div>
                  <div className="w-7 h-7 rounded-lg bg-blue-600 text-white flex items-center justify-center mb-1.5 shadow-2xs">
                    <FileText className="w-4 h-4" />
                  </div>
                  <span className="text-xs font-black text-slate-900 dark:text-white block">
                    Word (.doc)
                  </span>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 leading-tight">
                    Bisa disunting di MS Word
                  </p>
                </div>
                {profile.defaultExportFormat === 'word' && (
                  <span className="mt-2 text-[9px] font-bold text-blue-700 dark:text-blue-300 flex items-center gap-0.5">
                    <CheckCircle className="w-3 h-3" /> Terpilih
                  </span>
                )}
              </button>

              {/* Excel Option */}
              <button
                type="button"
                onClick={() => {
                  const updated = { ...profile, defaultExportFormat: 'excel' as const };
                  setProfile(updated);
                  saveTeacherProfile(updated);
                  setSaveToast(true);
                  setTimeout(() => setSaveToast(false), 2000);
                }}
                className={`p-3 rounded-2xl border text-left flex flex-col justify-between transition-all active:scale-95 ${
                  profile.defaultExportFormat === 'excel'
                    ? 'border-emerald-500 bg-emerald-50/70 dark:bg-emerald-950/40 dark:border-emerald-700 shadow-xs'
                    : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-850 opacity-75 hover:opacity-100'
                }`}
              >
                <div>
                  <div className="w-7 h-7 rounded-lg bg-emerald-600 text-white flex items-center justify-center mb-1.5 shadow-2xs">
                    <FileSpreadsheet className="w-4 h-4" />
                  </div>
                  <span className="text-xs font-black text-slate-900 dark:text-white block">
                    Excel (.xls)
                  </span>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 leading-tight">
                    Tabel data & analisis angka
                  </p>
                </div>
                {profile.defaultExportFormat === 'excel' && (
                  <span className="mt-2 text-[9px] font-bold text-emerald-700 dark:text-emerald-300 flex items-center gap-0.5">
                    <CheckCircle className="w-3 h-3" /> Terpilih
                  </span>
                )}
              </button>
            </div>
          </div>

          {/* Opsi Dokumen Tambahan */}
          <div className="space-y-3 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
            {/* Toggle Kop Surat Resmi */}
            <div className="flex items-center justify-between">
              <div>
                <span className="font-semibold text-slate-800 dark:text-slate-200 block">
                  Sertakan Kop Surat Resmi Kedinasan
                </span>
                <span className="text-[11px] text-slate-500 dark:text-slate-400">
                  Logo Tut Wuri Handayani & Dinas Pendidikan Provinsi/Kabupaten
                </span>
              </div>
              <button
                type="button"
                onClick={() => {
                  const updated = {
                    ...profile,
                    includeOfficialKop: profile.includeOfficialKop === false ? true : false,
                  };
                  setProfile(updated);
                  saveTeacherProfile(updated);
                }}
                className={`w-11 h-6 rounded-full transition-colors p-0.5 ${
                  profile.includeOfficialKop !== false ? 'bg-indigo-600' : 'bg-slate-300'
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-full bg-white transition-transform ${
                    profile.includeOfficialKop !== false ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {/* Toggle Lembar Pengesahan Tanda Tangan */}
            <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800">
              <div>
                <span className="font-semibold text-slate-800 dark:text-slate-200 block">
                  Sertakan Lembar Pengesahan Tanda Tangan
                </span>
                <span className="text-[11px] text-slate-500 dark:text-slate-400">
                  Kolom tanda tangan Kepala Sekolah & Guru Mata Pelajaran
                </span>
              </div>
              <button
                type="button"
                onClick={() => {
                  const updated = {
                    ...profile,
                    includeSignatures: profile.includeSignatures === false ? true : false,
                  };
                  setProfile(updated);
                  saveTeacherProfile(updated);
                }}
                className={`w-11 h-6 rounded-full transition-colors p-0.5 ${
                  profile.includeSignatures !== false ? 'bg-indigo-600' : 'bg-slate-300'
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-full bg-white transition-transform ${
                    profile.includeSignatures !== false ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {/* Pilihan Ukuran Kertas */}
            <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800">
              <div>
                <span className="font-semibold text-slate-800 dark:text-slate-200 block">
                  Ukuran Kertas Standar
                </span>
                <span className="text-[11px] text-slate-500 dark:text-slate-400">
                  Format tata letak lembar cetak
                </span>
              </div>
              <select
                value={profile.paperSize || 'A4'}
                onChange={(e) => {
                  const updated = {
                    ...profile,
                    paperSize: e.target.value as 'A4' | 'F4',
                  };
                  setProfile(updated);
                  saveTeacherProfile(updated);
                }}
                className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 border-none font-bold text-xs"
              >
                <option value="A4">A4 (210 x 297 mm)</option>
                <option value="F4">F4 / Folio (215 x 330 mm)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Preferences: Theme, Privacy, Camera */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
          <span className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider block pb-2 border-b border-slate-100 dark:border-slate-800">
            Preferensi Sistem
          </span>

          {/* Theme Toggle */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              {currentTheme === 'dark' ? (
                <Moon className="w-5 h-5 text-indigo-400" />
              ) : (
                <Sun className="w-5 h-5 text-amber-500" />
              )}
              <div>
                <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 block">
                  Mode Gelap (Dark Mode)
                </span>
                <span className="text-[11px] text-slate-500 dark:text-slate-400">
                  {currentTheme === 'dark' ? 'Tema gelap aktif' : 'Tema terang aktif'}
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={onToggleTheme}
              className={`w-12 h-6 rounded-full transition-colors p-0.5 ${
                currentTheme === 'dark' ? 'bg-indigo-600' : 'bg-slate-300'
              }`}
            >
              <div
                className={`w-5 h-5 rounded-full bg-white transition-transform ${
                  currentTheme === 'dark' ? 'translate-x-6' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* Student Privacy / Anonymize Toggle */}
          <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2.5 pr-2">
              <Shield className="w-5 h-5 text-emerald-600 flex-shrink-0" />
              <div>
                <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 block">
                  Lindungi Data Pribadi Murid
                </span>
                <span className="text-[11px] text-slate-500 dark:text-slate-400">
                  Samarkan nama & NIS pada tampilan rapor dan ekspor data
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => onToggleAnonymize(!anonymizeEnabled)}
              className={`w-12 h-6 rounded-full transition-colors p-0.5 flex-shrink-0 ${
                anonymizeEnabled ? 'bg-emerald-600' : 'bg-slate-300'
              }`}
            >
              <div
                className={`w-5 h-5 rounded-full bg-white transition-transform ${
                  anonymizeEnabled ? 'translate-x-6' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        </div>

        {/* Data Management: Backup & Reset */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
          <span className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider block pb-2 border-b border-slate-100 dark:border-slate-800">
            Cadangan & Pemeliharaan Data
          </span>

          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={handleBackupJSON}
              className="py-2.5 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-200 flex items-center justify-center gap-1.5 hover:bg-slate-100"
            >
              <Download className="w-4 h-4 text-indigo-600" />
              <span>Cadangkan JSON</span>
            </button>

            <label className="py-2.5 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-200 flex items-center justify-center gap-1.5 hover:bg-slate-100 cursor-pointer">
              <Upload className="w-4 h-4 text-indigo-600" />
              <span>Pulihkan JSON</span>
              <input
                type="file"
                accept=".json"
                onChange={handleRestoreJSON}
                className="hidden"
              />
            </label>
          </div>

          <button
            type="button"
            onClick={() => setShowResetConfirm(true)}
            className="w-full py-2.5 rounded-xl border border-rose-200 dark:border-rose-900/60 bg-rose-50 dark:bg-rose-950/30 text-rose-600 text-xs font-semibold hover:bg-rose-100 dark:hover:bg-rose-950/60 transition flex items-center justify-center gap-1.5"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Reset ke Data Contoh Bawaan</span>
          </button>
        </div>

        {/* App Info Footer */}
        <div className="text-center text-[11px] text-slate-400 dark:text-slate-500 space-y-1 pt-2">
          <p className="font-semibold">AI Smart Grading PWA Mobile v2.1.0</p>
          <p>Ditenagai Model Gemini 3.8 Flash • Standar Kurikulum Nasional</p>
        </div>
      </div>

      <ConfirmModal
        isOpen={showResetConfirm}
        title="Reset Data Penilaian?"
        message="Seluruh hasil koreksi saat ini akan dikembalikan ke data contoh awal. Pastikan Anda telah mencadangkan data penting jika diperlukan."
        confirmLabel="Reset Data"
        cancelLabel="Batal"
        isDestructive={true}
        onConfirm={() => {
          localStorage.clear();
          setShowResetConfirm(false);
          onDataReset();
        }}
        onCancel={() => setShowResetConfirm(false)}
      />
    </div>
  );
};
