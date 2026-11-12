import React, { useState } from 'react';
import {
  Users,
  UserPlus,
  FileSpreadsheet,
  Trash2,
  Edit2,
  Search,
  Check,
  AlertCircle,
  Download,
  Upload,
  Sparkles,
  ArrowRight,
  Filter,
  X,
  FileText,
  Printer,
} from 'lucide-react';
import {
  StudentRosterItem,
  loadStudents,
  addStudent,
  bulkAddStudents,
  updateStudent,
  deleteStudent,
  loadTeacherProfile,
  TeacherProfile,
  ExportFormat,
} from '../utils/storage';
import {
  exportStudentsToWord,
  exportStudentsToExcel,
} from '../utils/printUtils';
import { ExportFormatMenu } from './ExportFormatMenu';

interface StudentManagementViewProps {
  onBackToResults?: () => void;
  onSelectStudentForScan?: (student: StudentRosterItem) => void;
}

export const StudentManagementView: React.FC<StudentManagementViewProps> = ({
  onBackToResults,
}) => {
  const [students, setStudents] = useState<StudentRosterItem[]>(loadStudents());
  const [activeMode, setActiveMode] = useState<'list' | 'single' | 'bulk'>('list');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedClass, setSelectedClass] = useState<string>('all');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Single Student Form State
  const [singleName, setSingleName] = useState('');
  const [singleNis, setSingleNis] = useState('');
  const [singleClass, setSingleClass] = useState('X MIPA 1');
  const [singleGender, setSingleGender] = useState<'L' | 'P'>('L');
  const [singleNotes, setSingleNotes] = useState('');

  // Bulk Student Form State
  const [bulkText, setBulkText] = useState('');
  const [bulkDefaultClass, setBulkDefaultClass] = useState('X MIPA 1');

  // Edit Student Modal State
  const [editingStudent, setEditingStudent] = useState<StudentRosterItem | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const handleRefresh = () => {
    setStudents(loadStudents());
  };

  const handleSaveSingleStudent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!singleName.trim() || !singleNis.trim()) {
      showToast('Nama dan NIS wajib diisi.');
      return;
    }

    // Check duplicate NIS
    const exists = students.some(
      (s) => s.nis.trim().toLowerCase() === singleNis.trim().toLowerCase()
    );
    if (exists) {
      showToast(`NIS ${singleNis} sudah terdaftar. Gunakan nomor NIS yang unik.`);
      return;
    }

    addStudent({
      name: singleName.trim(),
      nis: singleNis.trim(),
      classRoom: singleClass.trim() || 'X MIPA 1',
      gender: singleGender,
      notes: singleNotes.trim(),
    });

    setSingleName('');
    setSingleNis('');
    setSingleNotes('');
    handleRefresh();
    setActiveMode('list');
    showToast('Siswa baru berhasil ditambahkan!');
  };

  const handleParseBulkData = () => {
    if (!bulkText.trim()) return [];

    const lines = bulkText.split('\n');
    const parsed: Array<{ nis: string; name: string; classRoom: string; gender?: 'L' | 'P'; notes?: string }> = [];

    for (const rawLine of lines) {
      const line = rawLine.trim();
      if (!line) continue;

      // Split by comma, semicolon, or tab
      const parts = line.includes('\t')
        ? line.split('\t')
        : line.includes(';')
        ? line.split(';')
        : line.split(',');

      if (parts.length >= 2) {
        const nis = parts[0].trim();
        const name = parts[1].trim();
        const classRoom = parts[2] ? parts[2].trim() : bulkDefaultClass;
        const genderRaw = parts[3] ? parts[3].trim().toUpperCase() : 'L';
        const gender: 'L' | 'P' = genderRaw === 'P' || genderRaw === 'PEREMPUAN' ? 'P' : 'L';
        const notes = parts[4] ? parts[4].trim() : '';

        if (nis && name) {
          parsed.push({ nis, name, classRoom, gender, notes });
        }
      } else if (parts.length === 1 && parts[0].includes(' ')) {
        // Fallback: NIS first word, remainder is name
        const tokens = parts[0].trim().split(/\s+/);
        const nis = tokens[0];
        const name = tokens.slice(1).join(' ');
        if (nis && name) {
          parsed.push({ nis, name, classRoom: bulkDefaultClass, gender: 'L' });
        }
      }
    }

    return parsed;
  };

  const handleSaveBulkStudents = () => {
    const parsed = handleParseBulkData();
    if (parsed.length === 0) {
      showToast('Tidak ada data siswa yang valid untuk diimpor. Periksa format teks.');
      return;
    }

    const res = bulkAddStudents(parsed);
    handleRefresh();
    setBulkText('');
    setActiveMode('list');
    showToast(
      `Berhasil menambahkan ${res.count} siswa baru! ${
        res.duplicates > 0 ? `(${res.duplicates} dilewati karena NIS sudah terdaftar)` : ''
      }`
    );
  };

  const handleFillSampleBulk = () => {
    const samples = [
      `2026/0115, Muhammad Rizky Ramadhan, X MIPA 1, L, Siswa pindahan`,
      `2026/0116, Siti Nurhaliza Putri, X MIPA 1, P, Juara OSN`,
      `2026/0117, Aditya Pratama Wijaya, X MIPA 1, L, Pengurus OSIS`,
      `2026/0118, Bella Anindya, X MIPA 1, P, Aktif PMR`,
      `2026/0119, Calvin Jonathan, X MIPA 1, L, Anggota Pramuka`,
      `2026/0120, Dewi Sartika Maharani, X MIPA 1, P, Regu Paskibra`,
    ].join('\n');
    setBulkText(samples);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        setBulkText(content);
        showToast('Berkas CSV/teks berhasil dimuat ke editor impor.');
      }
    };
    reader.readAsText(file);
  };

  const handleExportStudentsCSV = () => {
    const headers = ['No', 'NIS', 'Nama Siswa', 'Kelas', 'Jenis Kelamin', 'Catatan'];
    const rows = filteredStudents.map((s, idx) => [
      idx + 1,
      `"${s.nis}"`,
      `"${s.name}"`,
      `"${s.classRoom}"`,
      `"${s.gender || 'L'}"`,
      `"${s.notes || ''}"`,
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Data_Siswa_${selectedClass}_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Data siswa berhasil diekspor ke CSV.');
  };

  const handleExportStudents = async (format: ExportFormat) => {
    if (filteredStudents.length === 0) {
      showToast('Tidak ada data siswa untuk diekspor.');
      return;
    }
    const profile = loadTeacherProfile();
    try {
      if (format === 'word') {
        const res = await exportStudentsToWord(filteredStudents, selectedClass, profile);
        showToast(res.message);
      } else if (format === 'excel') {
        const res = await exportStudentsToExcel(filteredStudents, selectedClass, profile);
        showToast(res.message);
      } else {
        const res = await exportStudentsToWord(filteredStudents, selectedClass, profile);
        showToast(res.message);
      }
    } catch (e: any) {
      showToast('Gagal mengekspor data siswa.');
    }
  };

  const handleUpdateStudentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStudent) return;

    updateStudent(editingStudent.id, editingStudent);
    handleRefresh();
    setEditingStudent(null);
    showToast('Data siswa berhasil diperbarui!');
  };

  const handleDeleteStudent = (id: string) => {
    deleteStudent(id);
    handleRefresh();
    setDeleteConfirmId(null);
    showToast('Siswa berhasil dihapus dari rombel.');
  };

  const classList = Array.from(new Set(students.map((s) => s.classRoom))).filter(Boolean);

  const filteredStudents = students.filter((s) => {
    const matchClass = selectedClass === 'all' || s.classRoom === selectedClass;
    const matchQuery =
      searchQuery === '' ||
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.nis.toLowerCase().includes(searchQuery.toLowerCase());
    return matchClass && matchQuery;
  });

  const parsedBulkPreview = handleParseBulkData();

  return (
    <div className="flex flex-col min-h-[calc(100vh-4.5rem)] pb-24 bg-slate-50 dark:bg-slate-950">
      {/* Top Header */}
      <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-4 py-3.5 sticky top-0 z-30 shadow-xs">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
              <Users className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              Data Siswa & Rombel
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Kelola Rombel Belajar (Satuan & Impor Massal)
            </p>
          </div>

          <div className="flex items-center gap-1.5">
            <ExportFormatMenu
              onExport={handleExportStudents}
              buttonLabel="Ekspor"
              size="sm"
            />

            <button
              type="button"
              onClick={handleExportStudentsCSV}
              className="px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold flex items-center gap-1 transition"
              title="Ekspor CSV"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">CSV</span>
            </button>

            {onBackToResults && (
              <button
                type="button"
                onClick={onBackToResults}
                className="px-3 py-1.5 rounded-xl bg-indigo-600 text-white text-xs font-bold hover:bg-indigo-700 transition"
              >
                Kembali
              </button>
            )}
          </div>
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

        {/* Action Mode Switcher */}
        <div className="flex items-center gap-2 mt-3 pt-1 border-t border-slate-100 dark:border-slate-800 text-xs">
          <button
            type="button"
            onClick={() => setActiveMode('list')}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-xl font-bold transition ${
              activeMode === 'list'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Daftar Siswa ({students.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveMode('single')}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-xl font-bold transition ${
              activeMode === 'single'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
            }`}
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>Tambah Satu per Satu</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveMode('bulk')}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-xl font-bold transition ${
              activeMode === 'bulk'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300'
            }`}
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>Impor Massal</span>
          </button>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* MODE 1: TAMBAH SATU SISWA */}
        {activeMode === 'single' && (
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm animate-in fade-in">
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100 dark:border-slate-800">
              <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <UserPlus className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                Formulir Tambah Siswa Baru
              </h2>
              <button
                type="button"
                onClick={() => setActiveMode('list')}
                className="text-xs text-slate-400 hover:text-slate-600"
              >
                Batal
              </button>
            </div>

            <form onSubmit={handleSaveSingleStudent} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">
                  Nama Lengkap Siswa *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Muhammad Fathan Al-Ghifari"
                  value={singleName}
                  onChange={(e) => setSingleName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:text-white font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">
                    NIS / NISN *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: 2026/0125"
                    value={singleNis}
                    onChange={(e) => setSingleNis(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-indigo-500 font-mono text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">
                    Kelas / Rombel *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: X MIPA 1"
                    value={singleClass}
                    onChange={(e) => setSingleClass(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">
                    Jenis Kelamin
                  </label>
                  <select
                    value={singleGender}
                    onChange={(e) => setSingleGender(e.target.value as 'L' | 'P')}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:text-white"
                  >
                    <option value="L">Laki-laki (L)</option>
                    <option value="P">Perempuan (P)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">
                    Catatan Siswa (Opsional)
                  </label>
                  <input
                    type="text"
                    placeholder="Contoh: Jalur Afirmasi / Pindahan"
                    value={singleNotes}
                    onChange={(e) => setSingleNotes(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setActiveMode('list')}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold shadow-md active:scale-95 transition"
                >
                  Simpan Siswa
                </button>
              </div>
            </form>
          </div>
        )}

        {/* MODE 2: TAMBAH SISWA MASSAL (BULK IMPORT) */}
        {activeMode === 'bulk' && (
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4 animate-in fade-in">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <FileSpreadsheet className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  Impor Siswa Secara Massal (Banyak Sekaligus)
                </h2>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Salin & tempel daftar siswa atau unggah berkas teks / CSV
                </p>
              </div>

              <button
                type="button"
                onClick={handleFillSampleBulk}
                className="px-3 py-1 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 text-xs font-semibold hover:bg-indigo-100 flex items-center gap-1 border border-indigo-200 dark:border-indigo-800"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                Isi Contoh Data
              </button>
            </div>

            {/* Instruction Card */}
            <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl text-xs space-y-1.5 border border-slate-200 dark:border-slate-700">
              <span className="font-bold text-slate-800 dark:text-slate-200 block">
                Format Baris Teks (Pemisah Koma atau Tab):
              </span>
              <p className="font-mono text-[11px] text-indigo-600 dark:text-indigo-400">
                NIS, Nama Siswa, Kelas, Jenis Kelamin (L/P), Catatan
              </p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Contoh: <code>2026/0115, Muhammad Rizky, X MIPA 1, L</code>
              </p>
            </div>

            {/* Default Class Selector & File Upload */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">
                  Kelas Bawaan (jika kolom kelas kosong):
                </label>
                <input
                  type="text"
                  value={bulkDefaultClass}
                  onChange={(e) => setBulkDefaultClass(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-medium"
                />
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">
                  Unggah Berkas CSV / Teks:
                </label>
                <label className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 border border-dashed border-slate-300 dark:border-slate-600 cursor-pointer hover:bg-slate-200 text-slate-700 dark:text-slate-200 font-semibold">
                  <Upload className="w-3.5 h-3.5" />
                  <span>Pilih File .CSV atau .TXT</span>
                  <input
                    type="file"
                    accept=".csv,.txt"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </label>
              </div>
            </div>

            {/* Textarea Input */}
            <div>
              <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1 text-xs">
                Tempel (Paste) Daftar Siswa di Sini:
              </label>
              <textarea
                rows={6}
                value={bulkText}
                onChange={(e) => setBulkText(e.target.value)}
                placeholder="2026/0115, Muhammad Rizky, X MIPA 1, L&#10;2026/0116, Siti Nurhaliza, X MIPA 1, P"
                className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-emerald-500 font-mono text-xs text-slate-900 dark:text-white"
              />
            </div>

            {/* Live Parsing Preview */}
            {parsedBulkPreview.length > 0 && (
              <div className="space-y-2 border-t border-slate-100 dark:border-slate-800 pt-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                    <Check className="w-4 h-4 text-emerald-500" />
                    Terdeteksi {parsedBulkPreview.length} Siswa Siap Diimpor:
                  </span>
                  <span className="text-[11px] text-slate-400">
                    Pratinjau sebelum menyimpan
                  </span>
                </div>

                <div className="max-h-48 overflow-y-auto rounded-xl border border-slate-200 dark:border-slate-800">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 sticky top-0">
                      <tr>
                        <th className="p-2 w-8">No</th>
                        <th className="p-2">NIS</th>
                        <th className="p-2">Nama Siswa</th>
                        <th className="p-2">Kelas</th>
                        <th className="p-2 w-12">L/P</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-800 dark:text-slate-200">
                      {parsedBulkPreview.map((item, idx) => (
                        <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                          <td className="p-2 font-mono text-slate-400">{idx + 1}</td>
                          <td className="p-2 font-mono font-semibold">{item.nis}</td>
                          <td className="p-2 font-medium">{item.name}</td>
                          <td className="p-2">{item.classRoom}</td>
                          <td className="p-2 font-bold">{item.gender || 'L'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setActiveMode('list')}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold text-xs"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleSaveBulkStudents}
                disabled={parsedBulkPreview.length === 0}
                className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold text-xs shadow-md active:scale-95 transition flex items-center gap-1.5"
              >
                <FileSpreadsheet className="w-4 h-4" />
                <span>Simpan {parsedBulkPreview.length} Siswa Massal</span>
              </button>
            </div>
          </div>
        )}

        {/* MODE 3: DAFTAR SISWA (ROSTER LIST) */}
        {activeMode === 'list' && (
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
            {/* Search and Filter Bar */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Cari berdasarkan nama murid atau nomor NIS..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 border-none text-xs text-slate-900 dark:text-white placeholder:text-slate-400 font-medium"
                />
              </div>

              <div className="flex items-center gap-2">
                <span className="text-[11px] text-slate-400 font-semibold shrink-0">Filter Kelas:</span>
                <select
                  value={selectedClass}
                  onChange={(e) => setSelectedClass(e.target.value)}
                  className="px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-xs font-semibold border-none"
                >
                  <option value="all">Semua Kelas ({students.length})</option>
                  {classList.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Students Table */}
            {filteredStudents.length === 0 ? (
              <div className="text-center py-10 space-y-2">
                <Users className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto" />
                <h3 className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Tidak Ada Data Siswa Ditemukan
                </h3>
                <p className="text-[11px] text-slate-400 max-w-xs mx-auto">
                  Gunakan tombol &quot;Tambah Satu per Satu&quot; atau &quot;Impor Massal&quot; di atas untuk mendaftarkan murid.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                {filteredStudents.map((st, idx) => (
                  <div
                    key={st.id}
                    className="py-2.5 flex items-center justify-between hover:bg-slate-50/70 dark:hover:bg-slate-800/40 px-2 rounded-xl transition"
                  >
                    <div className="flex items-center gap-3">
                      <span className="w-7 h-7 rounded-full bg-indigo-50 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 font-mono font-bold flex items-center justify-center text-xs">
                        {idx + 1}
                      </span>

                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900 dark:text-white">
                            {st.name}
                          </span>
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                            {st.gender === 'P' ? 'Perempuan' : 'Laki-laki'}
                          </span>
                        </div>
                        <span className="text-[11px] text-slate-400 font-mono block">
                          NIS: {st.nis} • Kelas: {st.classRoom} {st.notes ? `• ${st.notes}` : ''}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => setEditingStudent(st)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950 transition"
                        title="Edit Data Siswa"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>

                      <button
                        type="button"
                        onClick={() => setDeleteConfirmId(st.id)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950 transition"
                        title="Hapus Siswa"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* MODAL: EDIT DATA SISWA */}
      {editingStudent && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 max-w-sm w-full space-y-4 shadow-2xl border border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Edit Data Murid
              </h3>
              <button
                type="button"
                onClick={() => setEditingStudent(null)}
                className="p-1 text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleUpdateStudentSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">
                  Nama Lengkap Siswa
                </label>
                <input
                  type="text"
                  required
                  value={editingStudent.name}
                  onChange={(e) =>
                    setEditingStudent({ ...editingStudent, name: e.target.value })
                  }
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">
                  NIS / NISN
                </label>
                <input
                  type="text"
                  required
                  value={editingStudent.nis}
                  onChange={(e) =>
                    setEditingStudent({ ...editingStudent, nis: e.target.value })
                  }
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono text-slate-900 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">
                    Kelas
                  </label>
                  <input
                    type="text"
                    required
                    value={editingStudent.classRoom}
                    onChange={(e) =>
                      setEditingStudent({ ...editingStudent, classRoom: e.target.value })
                    }
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">
                    Jenis Kelamin
                  </label>
                  <select
                    value={editingStudent.gender || 'L'}
                    onChange={(e) =>
                      setEditingStudent({
                        ...editingStudent,
                        gender: e.target.value as 'L' | 'P',
                      })
                    }
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                  >
                    <option value="L">Laki-laki</option>
                    <option value="P">Perempuan</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">
                  Catatan
                </label>
                <input
                  type="text"
                  value={editingStudent.notes || ''}
                  onChange={(e) =>
                    setEditingStudent({ ...editingStudent, notes: e.target.value })
                  }
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingStudent(null)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold"
                >
                  Perbarui
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: KONFIRMASI HAPUS SISWA */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 max-w-xs w-full space-y-3 text-center shadow-2xl border border-slate-200 dark:border-slate-800">
            <div className="w-10 h-10 rounded-full bg-rose-100 dark:bg-rose-950/60 text-rose-600 flex items-center justify-center mx-auto">
              <AlertCircle className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Hapus Siswa dari Rombel?
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Siswa ini akan dihapus dari daftar rombel kelas. Data asesmen nilai historis yang sudah tersimpan di Buku Nilai tetap aman.
            </p>
            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={() => setDeleteConfirmId(null)}
                className="flex-1 px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={() => handleDeleteStudent(deleteConfirmId)}
                className="flex-1 px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-md"
              >
                Hapus
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
