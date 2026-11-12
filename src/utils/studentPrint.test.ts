import test from 'node:test';
import assert from 'node:assert/strict';

// Setup localStorage polyfill for Node.js test environment
const memoryStore = new Map<string, string>();
(globalThis as any).localStorage = {
  getItem: (k: string) => memoryStore.get(k) ?? null,
  setItem: (k: string, v: string) => memoryStore.set(k, String(v)),
  removeItem: (k: string) => memoryStore.delete(k),
  clear: () => memoryStore.clear(),
};
(globalThis as any).window = globalThis;
(globalThis as any).document = {
  createElement: (tag: string) => ({
    tagName: tag,
    href: '',
    download: '',
    click: () => {},
    setAttribute: () => {},
    style: {},
  }),
  body: {
    appendChild: () => {},
    removeChild: () => {},
  },
};
(globalThis as any).URL = {
  createObjectURL: () => 'blob:mock-url',
  revokeObjectURL: () => {},
};

import {
  generateStudentAssessmentReportHtml,
  generateBukuNilaiHtml,
  exportReportToWord,
  exportReportToExcel,
  exportStudentAssessmentToWord,
  exportStudentAssessmentToExcel,
  exportBukuNilaiToWord,
  exportBukuNilaiToExcel,
  exportStudentsToWord,
  exportStudentsToExcel,
  exportDocumentUniversal,
} from './printUtils';
import {
  loadStudents,
  addStudent,
  bulkAddStudents,
  deleteStudent,
  DEFAULT_STUDENTS,
  TeacherProfile,
} from './storage';
import { GradedSubmission, calculateClassAnalytics } from './gradingLogic';

test('loadStudents returns default list or saved list', () => {
  const students = loadStudents();
  assert.ok(Array.isArray(students));
  assert.ok(students.length >= 6);
  assert.equal(students[0].name, 'Ahmad Fauzi Pratama');
});

test('bulkAddStudents adds new students and skips duplicate NIS', () => {
  const res = bulkAddStudents([
    {
      nis: 'TEST/9991',
      name: 'Budi Santoso',
      classRoom: 'X MIPA 1',
      gender: 'L',
    },
    {
      nis: '2026/0101', // Already exists in DEFAULT_STUDENTS
      name: 'Ahmad Fauzi Duplicate',
      classRoom: 'X MIPA 1',
      gender: 'L',
    },
  ]);

  assert.equal(res.count, 1);
  assert.equal(res.duplicates, 1);

  // Verify it exists in storage
  const students = loadStudents();
  const found = students.find((s) => s.nis === 'TEST/9991');
  assert.ok(found);
  assert.equal(found?.name, 'Budi Santoso');

  // Clean up
  if (found) {
    deleteStudent(found.id);
  }
});

const mockTeacher: TeacherProfile = {
  name: 'Dra. Sri Wahyuni, M.Pd.',
  nip: '19820415 200801 2 012',
  schoolName: 'SMA Negeri 1 Prestasi',
  gradeLevel: 'SMA/MA',
  defaultKkm: 75,
  anonymizeStudentData: false,
  imageQuality: 0.85,
};

test('generateStudentAssessmentReportHtml produces official Kop and clean HTML without oklch', () => {
  const mockSubmission: GradedSubmission = {
    id: 'sub-test-1',
    studentId: '2026/0101',
    studentName: 'Ahmad Fauzi Pratama',
    classRoom: 'X MIPA 1',
    examTitle: 'Penilaian Harian Matematika',
    subject: 'Matematika',
    date: '2026-03-10',
    totalScore: 92,
    maxTotalScore: 100,
    scorePercentage: 92,
    gradeLetter: 'A',
    isPassed: true,
    kkm: 75,
    summaryFeedback: 'Sangat baik dalam menyelesaikan soal geometri analitik.',
    strengths: ['Pemahaman konsep kuat'],
    improvements: ['Perhatikan ketelitian satuan'],
    remedialTopics: [],
    items: [
      {
        number: 1,
        type: 'mcq',
        score: 10,
        maxScore: 10,
        isCorrect: true,
        studentAnswer: 'B',
        correctAnswer: 'B',
        feedback: 'Tepat',
      },
    ],
    verifiedByTeacher: true,
    createdAt: Date.now(),
  };

  const html = generateStudentAssessmentReportHtml(
    mockSubmission,
    mockTeacher,
    false
  );

  assert.ok(html.includes('LEMBAR HASIL PENILAIAN ASESMEN INDIVIDU SISWA'));
  assert.ok(html.includes('Ahmad Fauzi Pratama'));
  assert.ok(html.includes('2026/0101'));
  assert.ok(html.includes('DINAS PENDIDIKAN'));
  assert.ok(!html.includes('oklch'), 'Must not contain oklch color functions for html2canvas compatibility');
});

test('generateBukuNilaiHtml produces official A4 Landscape Grade Ledger', () => {
  const mockSubmissions: GradedSubmission[] = [
    {
      id: 'sub-1',
      studentId: '2026/0101',
      studentName: 'Ahmad Fauzi Pratama',
      classRoom: 'X MIPA 1',
      examTitle: 'Asesmen Sumatif 1',
      subject: 'Matematika',
      date: '2026-03-10',
      totalScore: 88,
      maxTotalScore: 100,
      scorePercentage: 88,
      gradeLetter: 'B',
      isPassed: true,
      kkm: 75,
      summaryFeedback: 'Bagus',
      strengths: [],
      improvements: [],
      remedialTopics: [],
      items: [],
      verifiedByTeacher: true,
      createdAt: Date.now(),
    },
  ];

  const html = generateBukuNilaiHtml(
    mockSubmissions,
    'X MIPA 1',
    'Matematika',
    mockTeacher,
    false
  );

  assert.ok(html.includes('BUKU DAFTAR NILAI &amp; ARSIP HASIL ASESMEN PESERTA DIDIK') || html.includes('BUKU DAFTAR NILAI'));
  assert.ok(html.includes('Ahmad Fauzi Pratama'));
  assert.ok(html.includes('X MIPA 1'));
  assert.ok(!html.includes('oklch'));
});

test('exportReportToWord successfully creates Word document', async () => {
  const mockSubmissions: GradedSubmission[] = [
    {
      id: 'sub-1',
      studentId: '2026/0101',
      studentName: 'Ahmad Fauzi Pratama',
      classRoom: 'X MIPA 1',
      examTitle: 'Asesmen Sumatif 1',
      subject: 'Matematika',
      date: '2026-03-10',
      totalScore: 88,
      maxTotalScore: 100,
      scorePercentage: 88,
      gradeLetter: 'B',
      isPassed: true,
      kkm: 75,
      summaryFeedback: 'Bagus',
      strengths: [],
      improvements: [],
      remedialTopics: [],
      items: [],
      verifiedByTeacher: true,
      createdAt: Date.now(),
    },
  ];

  const analytics = calculateClassAnalytics(mockSubmissions, 75);
  const res = await exportReportToWord({
    analytics,
    submissions: mockSubmissions,
    selectedClass: 'X MIPA 1',
    kkmReference: 75,
    subjectName: 'Matematika',
    examTitle: 'Asesmen Sumatif 1',
    teacherProfile: mockTeacher,
    anonymizeEnabled: false,
  });

  assert.equal(res.success, true);
  assert.ok(res.message.includes('.doc'));
});

test('exportReportToExcel successfully creates Excel spreadsheet', async () => {
  const mockSubmissions: GradedSubmission[] = [
    {
      id: 'sub-1',
      studentId: '2026/0101',
      studentName: 'Ahmad Fauzi Pratama',
      classRoom: 'X MIPA 1',
      examTitle: 'Asesmen Sumatif 1',
      subject: 'Matematika',
      date: '2026-03-10',
      totalScore: 88,
      maxTotalScore: 100,
      scorePercentage: 88,
      gradeLetter: 'B',
      isPassed: true,
      kkm: 75,
      summaryFeedback: 'Bagus',
      strengths: [],
      improvements: [],
      remedialTopics: [],
      items: [],
      verifiedByTeacher: true,
      createdAt: Date.now(),
    },
  ];

  const analytics = calculateClassAnalytics(mockSubmissions, 75);
  const res = await exportReportToExcel({
    analytics,
    submissions: mockSubmissions,
    selectedClass: 'X MIPA 1',
    kkmReference: 75,
    subjectName: 'Matematika',
    examTitle: 'Asesmen Sumatif 1',
    teacherProfile: mockTeacher,
    anonymizeEnabled: false,
  });

  assert.equal(res.success, true);
  assert.ok(res.message.includes('.xls'));
});

test('exportStudentAssessmentToWord and toExcel succeed', async () => {
  const mockSub: GradedSubmission = {
    id: 'sub-1',
    studentId: '2026/0101',
    studentName: 'Ahmad Fauzi Pratama',
    classRoom: 'X MIPA 1',
    examTitle: 'Asesmen Sumatif 1',
    subject: 'Matematika',
    date: '2026-03-10',
    totalScore: 90,
    maxTotalScore: 100,
    scorePercentage: 90,
    gradeLetter: 'A',
    isPassed: true,
    kkm: 75,
    summaryFeedback: 'Luar biasa',
    strengths: ['Analisis kuat'],
    improvements: [],
    remedialTopics: [],
    items: [],
    verifiedByTeacher: true,
    createdAt: Date.now(),
  };

  const wordRes = await exportStudentAssessmentToWord(mockSub, mockTeacher);
  assert.equal(wordRes.success, true);
  assert.ok(wordRes.message.includes('.doc'));

  const excelRes = await exportStudentAssessmentToExcel(mockSub, mockTeacher);
  assert.equal(excelRes.success, true);
  assert.ok(excelRes.message.includes('.xls'));
});

test('exportBukuNilaiToWord and toExcel succeed', async () => {
  const mockSubs: GradedSubmission[] = [
    {
      id: 'sub-1',
      studentId: '2026/0101',
      studentName: 'Ahmad Fauzi Pratama',
      classRoom: 'X MIPA 1',
      examTitle: 'Asesmen Sumatif 1',
      subject: 'Matematika',
      date: '2026-03-10',
      totalScore: 90,
      maxTotalScore: 100,
      scorePercentage: 90,
      gradeLetter: 'A',
      isPassed: true,
      kkm: 75,
      summaryFeedback: 'Luar biasa',
      strengths: [],
      improvements: [],
      remedialTopics: [],
      items: [],
      verifiedByTeacher: true,
      createdAt: Date.now(),
    },
  ];

  const wordRes = await exportBukuNilaiToWord(mockSubs, 'X MIPA 1', 'Matematika', mockTeacher, false);
  assert.equal(wordRes.success, true);
  assert.ok(wordRes.message.includes('.doc'));

  const excelRes = await exportBukuNilaiToExcel(mockSubs, 'X MIPA 1', 'Matematika', mockTeacher, false);
  assert.equal(excelRes.success, true);
  assert.ok(excelRes.message.includes('.xls'));
});

test('exportStudentsToWord and toExcel succeed', async () => {
  const students = loadStudents();
  const wordRes = await exportStudentsToWord(students, 'all', mockTeacher);
  assert.equal(wordRes.success, true);
  assert.ok(wordRes.message.includes('.doc'));

  const excelRes = await exportStudentsToExcel(students, 'all', mockTeacher);
  assert.equal(excelRes.success, true);
  assert.ok(excelRes.message.includes('.xls'));
});

test('exportDocumentUniversal dispatches correctly based on format', async () => {
  const students = loadStudents();
  const resWord = await exportDocumentUniversal('students', 'word', {
    students,
    selectedClass: 'X MIPA 1',
    teacherProfile: mockTeacher,
  });
  assert.equal(resWord.success, true);
  assert.ok(resWord.message.includes('.doc'));

  const resExcel = await exportDocumentUniversal('students', 'excel', {
    students,
    selectedClass: 'X MIPA 1',
    teacherProfile: mockTeacher,
  });
  assert.equal(resExcel.success, true);
  assert.ok(resExcel.message.includes('.xls'));
});
