import { test } from 'node:test';
import assert from 'node:assert/strict';
import { generatePrintableReportHtml } from './printUtils';
import { calculateClassAnalytics, GradedSubmission } from './gradingLogic';

test('generatePrintableReportHtml outputs full Kurikulum Merdeka official report', () => {
  const dummySubmissions: GradedSubmission[] = [
    {
      id: 'sub-1',
      studentName: 'Ahmad Fauzi',
      studentId: '1001',
      classRoom: 'X MIPA 1',
      subject: 'Matematika',
      examTitle: 'Penilaian Sumatif Tengah Semester',
      date: '2026-11-10',
      totalScore: 85,
      maxTotalScore: 100,
      scorePercentage: 85,
      gradeLetter: 'B',
      isPassed: true,
      kkm: 75,
      summaryFeedback: 'Bagus',
      strengths: ['Trigonometri'],
      improvements: [],
      remedialTopics: [],
      verifiedByTeacher: true,
      createdAt: Date.now(),
      items: [
        { number: 1, type: 'mcq', studentAnswer: 'B', correctAnswer: 'B', isCorrect: true, score: 10, maxScore: 10 },
        { number: 2, type: 'essay', studentAnswer: 'Cara benar', isCorrect: true, score: 25, maxScore: 25 },
      ],
    },
    {
      id: 'sub-2',
      studentName: 'Budi Santoso',
      studentId: '1002',
      classRoom: 'X MIPA 1',
      subject: 'Matematika',
      examTitle: 'Penilaian Sumatif Tengah Semester',
      date: '2026-11-10',
      totalScore: 60,
      maxTotalScore: 100,
      scorePercentage: 60,
      gradeLetter: 'D',
      isPassed: false,
      kkm: 75,
      summaryFeedback: 'Perlu latihan',
      strengths: [],
      improvements: ['Aturan cosinus'],
      remedialTopics: ['Aturan sinus'],
      verifiedByTeacher: false,
      createdAt: Date.now(),
      items: [
        { number: 1, type: 'mcq', studentAnswer: 'A', correctAnswer: 'B', isCorrect: false, score: 0, maxScore: 10 },
        { number: 2, type: 'essay', studentAnswer: 'Kurang lengkap', isCorrect: false, score: 10, maxScore: 25 },
      ],
    },
  ];

  const analytics = calculateClassAnalytics(dummySubmissions, 75);

  const html = generatePrintableReportHtml({
    analytics,
    submissions: dummySubmissions,
    selectedClass: 'X MIPA 1',
    kkmReference: 75,
    subjectName: 'Matematika',
    examTitle: 'Penilaian Sumatif Tengah Semester',
    teacherProfile: {
      name: 'Ibu Ratna Dewi, S.Pd.',
      nip: '19880415 201201 2 003',
      schoolName: 'SMA Negeri 1 Prestasi',
      gradeLevel: 'SMA / MA',
      defaultKkm: 75,
      anonymizeStudentData: false,
      imageQuality: 0.8,
    },
    anonymizeEnabled: false,
  });

  // Verify key government report sections exist
  assert.ok(html.includes('DINAS PENDIDIKAN DAN KEBUDAYAAN'));
  assert.ok(html.includes('SMA Negeri 1 Prestasi'));
  assert.ok(html.includes('LAPORAN ANALISIS HASIL PENILAIAN'));
  assert.ok(html.includes('Ahmad Fauzi'));
  assert.ok(html.includes('Budi Santoso'));
  assert.ok(html.includes('TUNTAS'));
  assert.ok(html.includes('REMEDIAL'));
  assert.ok(html.includes('Drs. H. Mulyadi, M.Pd.'));
  assert.ok(html.includes('Ibu Ratna Dewi, S.Pd.'));
});

test('generatePrintableReportHtml uses custom principal and school data when provided', () => {
  const dummySubmissions: GradedSubmission[] = [
    {
      id: 'sub-1',
      studentName: 'Ahmad Fauzi',
      studentId: '1001',
      classRoom: 'X MIPA 1',
      subject: 'Matematika',
      examTitle: 'Penilaian Sumatif Tengah Semester',
      date: '2026-11-10',
      totalScore: 90,
      maxTotalScore: 100,
      scorePercentage: 90,
      gradeLetter: 'A',
      isPassed: true,
      kkm: 75,
      summaryFeedback: 'Luar biasa',
      strengths: ['Semua topik'],
      improvements: [],
      remedialTopics: [],
      verifiedByTeacher: true,
      createdAt: Date.now(),
      items: [
        { number: 1, type: 'mcq', studentAnswer: 'B', correctAnswer: 'B', isCorrect: true, score: 10, maxScore: 10 },
      ],
    },
  ];

  const analytics = calculateClassAnalytics(dummySubmissions, 75);

  const html = generatePrintableReportHtml({
    analytics,
    submissions: dummySubmissions,
    selectedClass: 'X MIPA 1',
    kkmReference: 75,
    subjectName: 'Matematika',
    examTitle: 'Penilaian Sumatif Tengah Semester',
    teacherProfile: {
      name: 'Bambang Irawan, S.Pd.',
      nip: '19850101 201001 1 005',
      schoolName: 'SMA Negeri Unggulan Nusantara',
      gradeLevel: 'SMA / MA',
      defaultKkm: 75,
      anonymizeStudentData: false,
      imageQuality: 0.8,
      principalName: 'Prof. Dr. Ir. H. Sudirman, M.Ed.',
      principalNip: '19650315 199003 1 002',
      principalRank: 'Pembina Utama Madya, IV/d',
      schoolCity: 'Kota Bandung',
      schoolNpsn: '20409988',
      schoolAddress: 'Jl. Merdeka No. 100 Bandung',
    },
    anonymizeEnabled: false,
  });

  assert.ok(html.includes('Prof. Dr. Ir. H. Sudirman, M.Ed.'));
  assert.ok(html.includes('19650315 199003 1 002'));
  assert.ok(html.includes('Pembina Utama Madya, IV/d'));
  assert.ok(html.includes('Ditetapkan di Kota Bandung'));
  assert.ok(html.includes('20409988'));
  assert.ok(html.includes('Jl. Merdeka No. 100 Bandung'));
});

