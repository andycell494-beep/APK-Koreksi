import { GradedSubmission } from './gradingLogic';

export type ExportFormat = 'pdf' | 'word' | 'excel';

export interface TeacherProfile {
  name: string;
  nip: string;
  schoolName: string;
  gradeLevel: string;
  defaultKkm: number;
  anonymizeStudentData: boolean;
  imageQuality: number; // 0.5 to 0.95
  defaultExportFormat?: ExportFormat;
  includeOfficialKop?: boolean;
  includeSignatures?: boolean;
  paperSize?: 'A4' | 'F4';

  // Data Kepala Sekolah & Pejabat Penandatangan
  principalName?: string; // Nama Lengkap & Gelar Kepala Sekolah
  principalNip?: string; // NIP Kepala Sekolah
  principalRank?: string; // Pangkat / Golongan Ruang (e.g. Pembina Utama Muda, IV/c)
  schoolCity?: string; // Kota / Kabupaten kedudukan sekolah (e.g. Kota Semarang)
  schoolNpsn?: string; // NPSN Sekolah (e.g. 20328901)
  schoolAddress?: string; // Alamat Sekolah (e.g. Jl. Pendidikan No. 45)
}

export interface ExamPreset {
  id: string;
  title: string;
  subject: string;
  classRoom: string;
  kkm: number;
  rubricType: 'pilihan_ganda' | 'campuran' | 'esai';
  answerKey: {
    number: number;
    correctOption?: string;
    maxScore: number;
    criteria?: string;
  }[];
}

export interface StudentRosterItem {
  id: string;
  nis: string;
  name: string;
  classRoom: string;
  gender?: 'L' | 'P';
  notes?: string;
  createdAt: number;
}

const STORAGE_KEYS = {
  SUBMISSIONS: 'smartgrade_submissions_v2',
  PROFILE: 'smartgrade_profile_v2',
  PRESETS: 'smartgrade_presets_v2',
  THEME: 'smartgrade_theme_v2',
  STUDENTS: 'smartgrade_students_v2',
  BUKU_NILAI: 'smartgrade_buku_nilai_archive_v2',
};

const DEFAULT_PROFILE: TeacherProfile = {
  name: 'Ibu Ratna Dewi, S.Pd.',
  nip: '19880415 201201 2 003',
  schoolName: 'SMA Negeri 1 Prestasi',
  gradeLevel: 'SMA / MA',
  defaultKkm: 75,
  anonymizeStudentData: false,
  imageQuality: 0.8,
  defaultExportFormat: 'pdf',
  includeOfficialKop: true,
  includeSignatures: true,
  paperSize: 'A4',

  // Data Kepala Sekolah Bawaan
  principalName: 'Drs. H. Mulyadi, M.Pd.',
  principalNip: '19750820 199903 1 004',
  principalRank: 'Pembina Utama Muda, IV/c',
  schoolCity: 'Kota Semarang',
  schoolNpsn: '20328901',
  schoolAddress: 'Jl. Pendidikan No. 45',
};

const DEFAULT_PRESETS: ExamPreset[] = [
  {
    id: 'preset-1',
    title: 'Penilaian Sumatif Matematika - Trigonometri',
    subject: 'Matematika',
    classRoom: 'X MIPA 1',
    kkm: 75,
    rubricType: 'campuran',
    answerKey: [
      { number: 1, correctOption: 'B', maxScore: 10, criteria: 'Nilai sin 30 derajat' },
      { number: 2, correctOption: 'D', maxScore: 10, criteria: 'Konsep kuadran II' },
      { number: 3, correctOption: 'A', maxScore: 10, criteria: 'Aturan sinus' },
      { number: 4, correctOption: 'C', maxScore: 10, criteria: 'Identitas trigonometri' },
      { number: 5, correctOption: 'B', maxScore: 10, criteria: 'Relasi sudut berelasi' },
      { number: 6, correctOption: 'Esai', maxScore: 25, criteria: 'Penyelesaian segitiga sembarang dengan aturan kosinus' },
      { number: 7, correctOption: 'Esai', maxScore: 25, criteria: 'Aplikasi tinggi tiang bendera menggunakan sudut elevasi' },
    ],
  },
  {
    id: 'preset-2',
    title: 'Kuis Harian Biologi - Ekosistem & Biosfer',
    subject: 'Biologi',
    classRoom: 'X MIPA 2',
    kkm: 78,
    rubricType: 'pilihan_ganda',
    answerKey: [
      { number: 1, correctOption: 'C', maxScore: 20, criteria: 'Rantai makanan' },
      { number: 2, correctOption: 'A', maxScore: 20, criteria: 'Komponen abiotik' },
      { number: 3, correctOption: 'E', maxScore: 20, criteria: 'Simbiosis mutualisme' },
      { number: 4, correctOption: 'B', maxScore: 20, criteria: 'Daur biogeokimia' },
      { number: 5, correctOption: 'D', maxScore: 20, criteria: 'Piramida energi' },
    ],
  },
];

const INITIAL_SUBMISSIONS: GradedSubmission[] = [
  {
    id: 'sub-001',
    studentName: 'Ahmad Fauzi Pratama',
    studentId: '2026/0101',
    classRoom: 'X MIPA 1',
    examTitle: 'Penilaian Sumatif Matematika - Trigonometri',
    subject: 'Matematika',
    date: '2026-03-08',
    totalScore: 92,
    maxTotalScore: 100,
    scorePercentage: 92,
    gradeLetter: 'A',
    isPassed: true,
    kkm: 75,
    summaryFeedback: 'Pemahaman konsep trigonometri luar biasa. Langkah penyelesaian pada soal esai ditulis secara sistematis.',
    strengths: ['Identifikasi rumus trigonometri sangat akurat', 'Diagram segitiga digambar dengan jelas'],
    improvements: ['Perjelas satuan sudut derajat di akhir perhitungan'],
    remedialTopics: [],
    items: [
      { number: 1, type: 'mcq', studentAnswer: 'B', correctAnswer: 'B', isCorrect: true, score: 10, maxScore: 10, feedback: 'Tepat' },
      { number: 2, type: 'mcq', studentAnswer: 'D', correctAnswer: 'D', isCorrect: true, score: 10, maxScore: 10, feedback: 'Tepat' },
      { number: 3, type: 'mcq', studentAnswer: 'A', correctAnswer: 'A', isCorrect: true, score: 10, maxScore: 10, feedback: 'Tepat' },
      { number: 4, type: 'mcq', studentAnswer: 'C', correctAnswer: 'C', isCorrect: true, score: 10, maxScore: 10, feedback: 'Tepat' },
      { number: 5, type: 'mcq', studentAnswer: 'A', correctAnswer: 'B', isCorrect: false, score: 2, maxScore: 10, feedback: 'Keliru tanda minus pada kuadran II' },
      { number: 6, type: 'essay', studentAnswer: 'Menggunakan aturan kosinus c^2 = a^2 + b^2 - 2ab cos C, diperoleh c = 14 cm', correctAnswer: 'c = 14 cm', isCorrect: true, score: 25, maxScore: 25, feedback: 'Langkah lengkap dan benar' },
      { number: 7, type: 'essay', studentAnswer: 'tan 45 = h / 20 => h = 20 + 1.6 = 21.6 meter', correctAnswer: 'Tinggi total = 21.6 m', isCorrect: true, score: 25, maxScore: 25, feedback: 'Memperhitungkan tinggi pengamat' },
    ],
    verifiedByTeacher: true,
    createdAt: Date.now() - 86400000 * 2,
  },
  {
    id: 'sub-002',
    studentName: 'Cut Nadhira Az-Zahra',
    studentId: '2026/0104',
    classRoom: 'X MIPA 1',
    examTitle: 'Penilaian Sumatif Matematika - Trigonometri',
    subject: 'Matematika',
    date: '2026-03-08',
    totalScore: 78,
    maxTotalScore: 100,
    scorePercentage: 78,
    gradeLetter: 'B',
    isPassed: true,
    kkm: 75,
    summaryFeedback: 'Mencapai target KKM dengan baik. Perlu latihan lebih pada soal pemodelan sudut elevasi.',
    strengths: ['Pilihan ganda dijawab dengan percaya diri', 'Tulisan tangan rapi'],
    improvements: ['Lupa menambahkan tinggi mata pengamat pada soal nomor 7'],
    remedialTopics: [],
    items: [
      { number: 1, type: 'mcq', studentAnswer: 'B', correctAnswer: 'B', isCorrect: true, score: 10, maxScore: 10, feedback: 'Tepat' },
      { number: 2, type: 'mcq', studentAnswer: 'D', correctAnswer: 'D', isCorrect: true, score: 10, maxScore: 10, feedback: 'Tepat' },
      { number: 3, type: 'mcq', studentAnswer: 'C', correctAnswer: 'A', isCorrect: false, score: 0, maxScore: 10, feedback: 'Salah memilih opsi' },
      { number: 4, type: 'mcq', studentAnswer: 'C', correctAnswer: 'C', isCorrect: true, score: 10, maxScore: 10, feedback: 'Tepat' },
      { number: 5, type: 'mcq', studentAnswer: 'B', correctAnswer: 'B', isCorrect: true, score: 10, maxScore: 10, feedback: 'Tepat' },
      { number: 6, type: 'essay', studentAnswer: 'Aturan kosinus c^2 = 196, c = 14 cm', correctAnswer: 'c = 14 cm', isCorrect: true, score: 23, maxScore: 25, feedback: 'Jawaban benar' },
      { number: 7, type: 'essay', studentAnswer: 'h = 20 meter (hanya menghitung jarak horizontal x tan 45)', correctAnswer: 'Tinggi total = 21.6 m', isCorrect: false, score: 15, maxScore: 25, feedback: 'Kurang menambahkan tinggi pengamat' },
    ],
    verifiedByTeacher: true,
    createdAt: Date.now() - 86400000 * 1,
  },
  {
    id: 'sub-003',
    studentName: 'Dimas Bagas Nugraha',
    studentId: '2026/0107',
    classRoom: 'X MIPA 1',
    examTitle: 'Penilaian Sumatif Matematika - Trigonometri',
    subject: 'Matematika',
    date: '2026-03-09',
    totalScore: 64,
    maxTotalScore: 100,
    scorePercentage: 64,
    gradeLetter: 'D',
    isPassed: false,
    kkm: 75,
    summaryFeedback: 'Belum tuntas KKM. Memerlukan bimbingan remedial pada materi aturan kosinus dan tanda kuadran.',
    strengths: ['Menguasai sudut istimewa 30 dan 45 derajat'],
    improvements: ['Pahami kembali rumus aturan kosinus', 'Perbanyak latihan soal aplikasi cerita'],
    remedialTopics: ['Aturan Kosinus', 'Aplikasi Trigonometri Nyata'],
    items: [
      { number: 1, type: 'mcq', studentAnswer: 'B', correctAnswer: 'B', isCorrect: true, score: 10, maxScore: 10, feedback: 'Tepat' },
      { number: 2, type: 'mcq', studentAnswer: 'A', correctAnswer: 'D', isCorrect: false, score: 0, maxScore: 10, feedback: 'Salah tanda' },
      { number: 3, type: 'mcq', studentAnswer: 'A', correctAnswer: 'A', isCorrect: true, score: 10, maxScore: 10, feedback: 'Tepat' },
      { number: 4, type: 'mcq', studentAnswer: 'B', correctAnswer: 'C', isCorrect: false, score: 0, maxScore: 10, feedback: 'Keliru identitas' },
      { number: 5, type: 'mcq', studentAnswer: 'B', correctAnswer: 'B', isCorrect: true, score: 10, maxScore: 10, feedback: 'Tepat' },
      { number: 6, type: 'essay', studentAnswer: 'c^2 = a^2 + b^2 = 100 + 64 = 164', correctAnswer: 'c = 14 cm', isCorrect: false, score: 14, maxScore: 25, feedback: 'Lupa bagian -2ab cos C' },
      { number: 7, type: 'essay', studentAnswer: 'h = 20 meter', correctAnswer: 'Tinggi total = 21.6 m', isCorrect: false, score: 20, maxScore: 25, feedback: 'Sebagian benar' },
    ],
    verifiedByTeacher: false,
    createdAt: Date.now() - 3600000 * 4,
  },
  {
    id: 'sub-004',
    studentName: 'Zaskia Putri Maharani',
    studentId: '2026/0112',
    classRoom: 'X MIPA 1',
    examTitle: 'Penilaian Sumatif Matematika - Trigonometri',
    subject: 'Matematika',
    date: '2026-03-09',
    totalScore: 86,
    maxTotalScore: 100,
    scorePercentage: 86,
    gradeLetter: 'B',
    isPassed: true,
    kkm: 75,
    summaryFeedback: 'Pekerjaan rapi dan memuaskan. Langkah esai sangat sistematis dengan notasi matematika tepat.',
    strengths: ['Analisis segitiga cermat', 'Semua nomor pilihan ganda dijawab benar'],
    improvements: ['Tingkatkan kecepatan mengerjakan soal uraian'],
    remedialTopics: [],
    items: [
      { number: 1, type: 'mcq', studentAnswer: 'B', correctAnswer: 'B', isCorrect: true, score: 10, maxScore: 10, feedback: 'Tepat' },
      { number: 2, type: 'mcq', studentAnswer: 'D', correctAnswer: 'D', isCorrect: true, score: 10, maxScore: 10, feedback: 'Tepat' },
      { number: 3, type: 'mcq', studentAnswer: 'A', correctAnswer: 'A', isCorrect: true, score: 10, maxScore: 10, feedback: 'Tepat' },
      { number: 4, type: 'mcq', studentAnswer: 'C', correctAnswer: 'C', isCorrect: true, score: 10, maxScore: 10, feedback: 'Tepat' },
      { number: 5, type: 'mcq', studentAnswer: 'B', correctAnswer: 'B', isCorrect: true, score: 10, maxScore: 10, feedback: 'Tepat' },
      { number: 6, type: 'essay', studentAnswer: 'c^2 = a^2+b^2-2ab cos C = 100+64 - 160*(-0.5) = 196 => c = 14', correctAnswer: 'c = 14 cm', isCorrect: true, score: 24, maxScore: 25, feedback: 'Sangat baik' },
      { number: 7, type: 'essay', studentAnswer: 'tan 45 = x/20 => x=20. Tinggi = 20 + 1.2 = 21.2 m', correctAnswer: '21.6 m', isCorrect: false, score: 12, maxScore: 25, feedback: 'Tinggi pengamat tercatat 1.6m di soal' },
    ],
    verifiedByTeacher: false,
    createdAt: Date.now() - 3600000 * 2,
  },
];

export function loadSubmissions(): GradedSubmission[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.SUBMISSIONS);
    if (!raw) {
      saveSubmissions(INITIAL_SUBMISSIONS);
      return INITIAL_SUBMISSIONS;
    }
    return JSON.parse(raw);
  } catch (err) {
    console.error('Failed to load submissions from localStorage:', err);
    return INITIAL_SUBMISSIONS;
  }
}

export function saveSubmissions(submissions: GradedSubmission[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.SUBMISSIONS, JSON.stringify(submissions));
  } catch (err) {
    console.error('Failed to save submissions to localStorage:', err);
  }
}

export function addSubmission(submission: GradedSubmission): void {
  const current = loadSubmissions();
  const updated = [submission, ...current];
  saveSubmissions(updated);
}

export function updateSubmission(id: string, updates: Partial<GradedSubmission>): GradedSubmission | null {
  const current = loadSubmissions();
  const index = current.findIndex((s) => s.id === id);
  if (index === -1) return null;

  const updatedItem = { ...current[index], ...updates };
  current[index] = updatedItem;
  saveSubmissions(current);
  return updatedItem;
}

export function deleteSubmission(id: string): boolean {
  const current = loadSubmissions();
  const filtered = current.filter((s) => s.id !== id);
  saveSubmissions(filtered);
  return filtered.length !== current.length;
}

export function loadTeacherProfile(): TeacherProfile {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.PROFILE);
    if (!raw) return DEFAULT_PROFILE;
    return { ...DEFAULT_PROFILE, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_PROFILE;
  }
}

export function saveTeacherProfile(profile: TeacherProfile): void {
  try {
    localStorage.setItem(STORAGE_KEYS.PROFILE, JSON.stringify(profile));
  } catch (err) {
    console.error('Failed to save profile:', err);
  }
}

export function loadExamPresets(): ExamPreset[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.PRESETS);
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.PRESETS, JSON.stringify(DEFAULT_PRESETS));
      return DEFAULT_PRESETS;
    }
    return JSON.parse(raw);
  } catch {
    return DEFAULT_PRESETS;
  }
}

export function saveExamPreset(preset: ExamPreset): void {
  const presets = loadExamPresets();
  const index = presets.findIndex((p) => p.id === preset.id);
  if (index >= 0) {
    presets[index] = preset;
  } else {
    presets.push(preset);
  }
  localStorage.setItem(STORAGE_KEYS.PRESETS, JSON.stringify(presets));
}

export function loadTheme(): 'light' | 'dark' {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.THEME);
    if (raw === 'dark' || raw === 'light') return raw;
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return 'dark';
    }
  } catch {
    // fallback
  }
  return 'light';
}

export function saveTheme(theme: 'light' | 'dark'): void {
  try {
    localStorage.setItem(STORAGE_KEYS.THEME, theme);
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  } catch (err) {
    console.error('Failed to save theme:', err);
  }
}

export const DEFAULT_STUDENTS: StudentRosterItem[] = [
  { id: 'st-01', nis: '2026/0101', name: 'Ahmad Fauzi Pratama', classRoom: 'X MIPA 1', gender: 'L', createdAt: Date.now() - 86400000 * 5 },
  { id: 'st-02', nis: '2026/0102', name: 'Bayu Adi Pratama', classRoom: 'X MIPA 1', gender: 'L', createdAt: Date.now() - 86400000 * 5 },
  { id: 'st-03', nis: '2026/0103', name: 'Cantika Dewi Lestari', classRoom: 'X MIPA 1', gender: 'P', createdAt: Date.now() - 86400000 * 5 },
  { id: 'st-04', nis: '2026/0104', name: 'Cut Nadhira Az-Zahra', classRoom: 'X MIPA 1', gender: 'P', createdAt: Date.now() - 86400000 * 5 },
  { id: 'st-05', nis: '2026/0105', name: 'Daffa Raditya', classRoom: 'X MIPA 1', gender: 'L', createdAt: Date.now() - 86400000 * 5 },
  { id: 'st-06', nis: '2026/0106', name: 'Dinda Aulia Putri', classRoom: 'X MIPA 1', gender: 'P', createdAt: Date.now() - 86400000 * 5 },
  { id: 'st-07', nis: '2026/0107', name: 'Dimas Bagas Nugraha', classRoom: 'X MIPA 1', gender: 'L', createdAt: Date.now() - 86400000 * 5 },
  { id: 'st-08', nis: '2026/0108', name: 'Fajar Hidayat', classRoom: 'X MIPA 1', gender: 'L', createdAt: Date.now() - 86400000 * 5 },
  { id: 'st-09', nis: '2026/0109', name: 'Gita Safitri', classRoom: 'X MIPA 1', gender: 'P', createdAt: Date.now() - 86400000 * 5 },
  { id: 'st-10', nis: '2026/0112', name: 'Zaskia Putri Maharani', classRoom: 'X MIPA 1', gender: 'P', createdAt: Date.now() - 86400000 * 5 },
];

export function loadStudents(): StudentRosterItem[] {
  try {
    if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
      return DEFAULT_STUDENTS;
    }
    const raw = localStorage.getItem(STORAGE_KEYS.STUDENTS);
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.STUDENTS, JSON.stringify(DEFAULT_STUDENTS));
      return DEFAULT_STUDENTS;
    }
    return JSON.parse(raw);
  } catch {
    return DEFAULT_STUDENTS;
  }
}

export function saveStudents(students: StudentRosterItem[]): void {
  try {
    if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
      return;
    }
    localStorage.setItem(STORAGE_KEYS.STUDENTS, JSON.stringify(students));
  } catch (err) {
    console.error('Failed to save students:', err);
  }
}

export function addStudent(studentData: Omit<StudentRosterItem, 'id' | 'createdAt'>): StudentRosterItem {
  const students = loadStudents();
  const newStudent: StudentRosterItem = {
    ...studentData,
    id: `st-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    createdAt: Date.now(),
  };
  const updated = [newStudent, ...students];
  saveStudents(updated);
  return newStudent;
}

export function bulkAddStudents(
  newStudentsList: Array<{ nis: string; name: string; classRoom: string; gender?: 'L' | 'P'; notes?: string }>
): { count: number; duplicates: number } {
  const existing = loadStudents();
  const existingNisSet = new Set(existing.map((s) => s.nis.trim().toLowerCase()));

  let count = 0;
  let duplicates = 0;
  const toAdd: StudentRosterItem[] = [];

  for (const item of newStudentsList) {
    const cleanNis = (item.nis || '').trim();
    const cleanName = (item.name || '').trim();
    const cleanClass = (item.classRoom || '').trim();

    if (!cleanName || !cleanNis) continue;

    if (existingNisSet.has(cleanNis.toLowerCase())) {
      duplicates++;
      continue;
    }

    existingNisSet.add(cleanNis.toLowerCase());
    toAdd.push({
      id: `st-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      nis: cleanNis,
      name: cleanName,
      classRoom: cleanClass || 'X MIPA 1',
      gender: item.gender || 'L',
      notes: item.notes || '',
      createdAt: Date.now(),
    });
    count++;
  }

  if (toAdd.length > 0) {
    saveStudents([...toAdd, ...existing]);
  }

  return { count, duplicates };
}

export function updateStudent(id: string, updates: Partial<StudentRosterItem>): StudentRosterItem | null {
  const students = loadStudents();
  const index = students.findIndex((s) => s.id === id);
  if (index === -1) return null;

  students[index] = { ...students[index], ...updates };
  saveStudents(students);
  return students[index];
}

export function deleteStudent(id: string): void {
  const students = loadStudents();
  const filtered = students.filter((s) => s.id !== id);
  saveStudents(filtered);
}

