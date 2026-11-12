import test from 'node:test';
import assert from 'node:assert/strict';
import {
  determineGradeLetter,
  calculateTotalScore,
  checkPassingStatus,
  calculateClassAnalytics,
  anonymizeStudentData,
  exportSubmissionsToCSV,
  GradedSubmission,
} from './gradingLogic.js';

test('determineGradeLetter converts percentage correctly to Indonesian standard', () => {
  assert.equal(determineGradeLetter(95), 'A');
  assert.equal(determineGradeLetter(90), 'A');
  assert.equal(determineGradeLetter(85), 'B');
  assert.equal(determineGradeLetter(80), 'B');
  assert.equal(determineGradeLetter(74), 'C');
  assert.equal(determineGradeLetter(65), 'D');
  assert.equal(determineGradeLetter(50), 'E');
  assert.equal(determineGradeLetter(0), 'E');
});

test('calculateTotalScore handles scoring aggregation properly', () => {
  const items = [
    { score: 10, maxScore: 10 },
    { score: 5, maxScore: 10 },
    { score: 20, maxScore: 20 },
  ];
  const res = calculateTotalScore(items);
  assert.equal(res.totalScore, 35);
  assert.equal(res.maxTotalScore, 40);
  assert.equal(res.percentage, 88);
});

test('checkPassingStatus verifies KKM compliance', () => {
  assert.equal(checkPassingStatus(80, 75), true);
  assert.equal(checkPassingStatus(75, 75), true);
  assert.equal(checkPassingStatus(74, 75), false);
  assert.equal(checkPassingStatus(60, 70), false);
});

test('calculateClassAnalytics provides accurate classroom metrics and item difficulty', () => {
  const mockSubmissions: GradedSubmission[] = [
    {
      id: 'sub-1',
      studentName: 'Budi Santoso',
      studentId: '1001',
      classRoom: 'X-1',
      examTitle: 'UTS Fisika',
      subject: 'Fisika',
      date: '2026-03-01',
      totalScore: 90,
      maxTotalScore: 100,
      scorePercentage: 90,
      gradeLetter: 'A',
      isPassed: true,
      kkm: 75,
      summaryFeedback: 'Bagus',
      strengths: ['Analisis kuat'],
      improvements: [],
      remedialTopics: [],
      items: [
        { number: 1, score: 10, maxScore: 10, studentAnswer: 'A', isCorrect: true },
        { number: 2, score: 0, maxScore: 10, studentAnswer: 'B', isCorrect: false },
      ],
      verifiedByTeacher: true,
      createdAt: Date.now(),
    },
    {
      id: 'sub-2',
      studentName: 'Siti Aminah',
      studentId: '1002',
      classRoom: 'X-1',
      examTitle: 'UTS Fisika',
      subject: 'Fisika',
      date: '2026-03-01',
      totalScore: 60,
      maxTotalScore: 100,
      scorePercentage: 60,
      gradeLetter: 'D',
      isPassed: false,
      kkm: 75,
      summaryFeedback: 'Perlu latihan lagi',
      strengths: [],
      improvements: ['Kaji ulang konsep'],
      remedialTopics: ['Kinematika'],
      items: [
        { number: 1, score: 10, maxScore: 10, studentAnswer: 'A', isCorrect: true },
        { number: 2, score: 0, maxScore: 10, studentAnswer: 'C', isCorrect: false },
      ],
      verifiedByTeacher: false,
      createdAt: Date.now(),
    },
  ];

  const analytics = calculateClassAnalytics(mockSubmissions, 75);
  assert.equal(analytics.totalStudents, 2);
  assert.equal(analytics.averageScore, 75);
  assert.equal(analytics.highestScore, 90);
  assert.equal(analytics.lowestScore, 60);
  assert.equal(analytics.passedCount, 1);
  assert.equal(analytics.failedCount, 1);
  assert.equal(analytics.passRatePercentage, 50);
  assert.equal(analytics.gradeDistribution.A, 1);
  assert.equal(analytics.gradeDistribution.D, 1);
  assert.deepEqual(analytics.remedialStudentNames, ['Siti Aminah']);

  // Question 1: 2/2 answered correctly => 100% correct => 'Mudah'
  // Question 2: 0/2 answered correctly => 0% correct => 'Sukar'
  assert.equal(analytics.itemDifficulty[0].questionNumber, 1);
  assert.equal(analytics.itemDifficulty[0].difficultyCategory, 'Mudah');
  assert.equal(analytics.itemDifficulty[1].questionNumber, 2);
  assert.equal(analytics.itemDifficulty[1].difficultyCategory, 'Sukar');

  // Psychometric and ranking assertions
  assert.equal(analytics.medianScore, 75);
  assert.equal(analytics.standardDeviation, 15);
  assert.equal(analytics.studentRankings.length, 2);
  assert.equal(analytics.studentRankings[0].rank, 1);
  assert.equal(analytics.studentRankings[0].studentName, 'Budi Santoso');
  assert.equal(analytics.studentRankings[1].rank, 2);
  assert.equal(analytics.studentRankings[1].studentName, 'Siti Aminah');
  assert.equal(typeof analytics.itemDifficulty[0].discriminationIndex, 'number');
});

test('anonymizeStudentData protects student privacy', () => {
  const result = anonymizeStudentData('Budi Santoso', '12345678');
  assert.equal(result.maskedName, 'B**i S*****o');
  assert.equal(result.maskedId, '12****78');
});

test('exportSubmissionsToCSV generates formatted CSV with headers', () => {
  const mockSubmissions: GradedSubmission[] = [
    {
      id: 'sub-1',
      studentName: 'Dewi Lestari',
      studentId: '1003',
      classRoom: 'X-2',
      examTitle: 'Kuis Biologi',
      subject: 'Biologi',
      date: '2026-03-02',
      totalScore: 85,
      maxTotalScore: 100,
      scorePercentage: 85,
      gradeLetter: 'B',
      isPassed: true,
      kkm: 75,
      summaryFeedback: 'Sangat baik',
      strengths: [],
      improvements: [],
      remedialTopics: [],
      items: [],
      verifiedByTeacher: true,
      createdAt: Date.now(),
    },
  ];

  const csv = exportSubmissionsToCSV(mockSubmissions);
  assert.ok(csv.includes('No,Nama Siswa,NIS,Kelas,Mata Pelajaran,Nilai Akhir,Predikat,Status KKM,Status Verifikasi,Tanggal'));
  assert.ok(csv.includes('"Dewi Lestari"'));
  assert.ok(csv.includes('85,B,Tuntas,Terverifikasi'));
});
