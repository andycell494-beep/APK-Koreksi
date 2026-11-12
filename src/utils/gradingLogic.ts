/**
 * Core pure calculation and transformation logic for AI Smart Grading
 */

export interface QuestionResultItem {
  number: number;
  type?: 'mcq' | 'essay';
  studentAnswer: string;
  correctAnswer?: string;
  isCorrect?: boolean;
  score: number;
  maxScore: number;
  feedback?: string;
}

export interface GradedSubmission {
  id: string;
  studentName: string;
  studentId: string;
  classRoom: string;
  examTitle: string;
  subject: string;
  date: string;
  totalScore: number;
  maxTotalScore: number;
  scorePercentage: number;
  gradeLetter: string;
  isPassed: boolean;
  kkm: number;
  summaryFeedback: string;
  strengths: string[];
  improvements: string[];
  remedialTopics: string[];
  items: QuestionResultItem[];
  verifiedByTeacher: boolean;
  imageUrl?: string;
  createdAt: number;
}

export function determineGradeLetter(percentage: number): 'A' | 'B' | 'C' | 'D' | 'E' {
  if (percentage >= 90) return 'A';
  if (percentage >= 80) return 'B';
  if (percentage >= 70) return 'C';
  if (percentage >= 60) return 'D';
  return 'E';
}

export function calculateTotalScore(items: { score: number; maxScore: number }[]): {
  totalScore: number;
  maxTotalScore: number;
  percentage: number;
} {
  if (!items || items.length === 0) {
    return { totalScore: 0, maxTotalScore: 0, percentage: 0 };
  }
  const totalScore = items.reduce((acc, curr) => acc + (Number(curr.score) || 0), 0);
  const maxTotalScore = items.reduce((acc, curr) => acc + (Number(curr.maxScore) || 0), 0);
  const percentage = maxTotalScore > 0 ? Math.round((totalScore / maxTotalScore) * 100) : 0;
  return {
    totalScore: Math.round(totalScore * 10) / 10,
    maxTotalScore: Math.round(maxTotalScore * 10) / 10,
    percentage: Math.min(100, Math.max(0, percentage)),
  };
}

export function checkPassingStatus(percentage: number, kkm: number = 75): boolean {
  return percentage >= kkm;
}

export interface ItemAnalysisDetail {
  questionNumber: number;
  type?: 'mcq' | 'essay';
  correctRate: number; // 0 to 100%
  difficultyCategory: 'Mudah' | 'Sedang' | 'Sukar';
  correctCount: number;
  incorrectCount: number;
  discriminationIndex: number; // -1.0 to 1.0
  discriminationCategory: 'Sangat Baik' | 'Baik' | 'Cukup' | 'Jelek';
  recommendation: 'Diterima Baik' | 'Revisi Soal' | 'Ditolak / Dibuang';
}

export interface StudentRankItem {
  rank: number;
  studentName: string;
  studentId: string;
  classRoom: string;
  scorePercentage: number;
  gradeLetter: string;
  isPassed: boolean;
  verifiedByTeacher: boolean;
}

export interface ClassAnalyticsResult {
  totalStudents: number;
  averageScore: number;
  medianScore: number;
  highestScore: number;
  lowestScore: number;
  scoreRange: number;
  standardDeviation: number;
  passedCount: number;
  failedCount: number;
  passRatePercentage: number;
  gradeDistribution: {
    A: number;
    B: number;
    C: number;
    D: number;
    E: number;
  };
  itemDifficulty: ItemAnalysisDetail[];
  studentRankings: StudentRankItem[];
  remedialStudentNames: string[];
}

export function calculateClassAnalytics(submissions: GradedSubmission[], kkm: number = 75): ClassAnalyticsResult {
  if (!submissions || submissions.length === 0) {
    return {
      totalStudents: 0,
      averageScore: 0,
      medianScore: 0,
      highestScore: 0,
      lowestScore: 0,
      scoreRange: 0,
      standardDeviation: 0,
      passedCount: 0,
      failedCount: 0,
      passRatePercentage: 0,
      gradeDistribution: { A: 0, B: 0, C: 0, D: 0, E: 0 },
      itemDifficulty: [],
      studentRankings: [],
      remedialStudentNames: [],
    };
  }

  const scores = submissions.map((s) => s.scorePercentage).sort((a, b) => a - b);
  const totalStudents = submissions.length;
  const highestScore = Math.max(...scores);
  const lowestScore = Math.min(...scores);
  const scoreRange = highestScore - lowestScore;
  const averageScore = Math.round((scores.reduce((a, b) => a + b, 0) / totalStudents) * 10) / 10;

  // Median
  const mid = Math.floor(scores.length / 2);
  const medianScore = scores.length % 2 !== 0
    ? scores[mid]
    : Math.round(((scores[mid - 1] + scores[mid]) / 2) * 10) / 10;

  // Standard Deviation
  const variance = scores.reduce((sum, score) => sum + Math.pow(score - averageScore, 2), 0) / totalStudents;
  const standardDeviation = Math.round(Math.sqrt(variance) * 10) / 10;

  const passedCount = submissions.filter((s) => s.scorePercentage >= kkm).length;
  const failedCount = totalStudents - passedCount;
  const passRatePercentage = Math.round((passedCount / totalStudents) * 100);

  const gradeDistribution = { A: 0, B: 0, C: 0, D: 0, E: 0 };
  const remedialStudentNames: string[] = [];

  for (const sub of submissions) {
    const letter = determineGradeLetter(sub.scorePercentage);
    gradeDistribution[letter]++;
    if (sub.scorePercentage < kkm) {
      remedialStudentNames.push(sub.studentName);
    }
  }

  // Student Rankings (Sorted Descending)
  const sortedSubmissions = [...submissions].sort((a, b) => b.scorePercentage - a.scorePercentage);
  const studentRankings: StudentRankItem[] = sortedSubmissions.map((sub, idx) => ({
    rank: idx + 1,
    studentName: sub.studentName,
    studentId: sub.studentId,
    classRoom: sub.classRoom,
    scorePercentage: sub.scorePercentage,
    gradeLetter: sub.gradeLetter,
    isPassed: sub.isPassed,
    verifiedByTeacher: sub.verifiedByTeacher,
  }));

  // Upper Group (Top 50%) and Lower Group (Bottom 50%) for Item Discrimination
  const half = Math.max(1, Math.floor(sortedSubmissions.length / 2));
  const upperGroup = sortedSubmissions.slice(0, half);
  const lowerGroup = sortedSubmissions.slice(-half);

  // Psychometric Item Analysis
  const questionMap = new Map<number, { correct: number; total: number; upperCorrect: number; lowerCorrect: number; type?: 'mcq' | 'essay' }>();
  for (const sub of submissions) {
    const isUpper = upperGroup.includes(sub);
    const isLower = lowerGroup.includes(sub);
    for (const it of (sub.items || [])) {
      const entry = questionMap.get(it.number) || { correct: 0, total: 0, upperCorrect: 0, lowerCorrect: 0, type: it.type };
      entry.total++;
      if (it.type) entry.type = it.type;
      const isCorrectItem = it.isCorrect || it.score >= (it.maxScore * 0.75);
      if (isCorrectItem) {
        entry.correct++;
        if (isUpper) entry.upperCorrect++;
        if (isLower) entry.lowerCorrect++;
      }
      questionMap.set(it.number, entry);
    }
  }

  const itemDifficulty: ItemAnalysisDetail[] = Array.from(questionMap.entries())
    .sort(([a], [b]) => a - b)
    .map(([num, data]) => {
      const correctRate = Math.round((data.correct / (data.total || 1)) * 100);
      let difficultyCategory: 'Mudah' | 'Sedang' | 'Sukar' = 'Sedang';
      if (correctRate >= 70) difficultyCategory = 'Mudah';
      else if (correctRate <= 30) difficultyCategory = 'Sukar';

      // Discrimination Index: D = (UpperCorrect - LowerCorrect) / half
      const dRaw = half > 0 ? (data.upperCorrect - data.lowerCorrect) / half : 0;
      const discriminationIndex = Math.round(dRaw * 100) / 100;

      let discriminationCategory: 'Sangat Baik' | 'Baik' | 'Cukup' | 'Jelek' = 'Cukup';
      let recommendation: 'Diterima Baik' | 'Revisi Soal' | 'Ditolak / Dibuang' = 'Revisi Soal';

      if (discriminationIndex >= 0.40) {
        discriminationCategory = 'Sangat Baik';
        recommendation = 'Diterima Baik';
      } else if (discriminationIndex >= 0.30) {
        discriminationCategory = 'Baik';
        recommendation = 'Diterima Baik';
      } else if (discriminationIndex >= 0.20) {
        discriminationCategory = 'Cukup';
        recommendation = 'Revisi Soal';
      } else {
        discriminationCategory = 'Jelek';
        recommendation = 'Ditolak / Dibuang';
      }

      return {
        questionNumber: num,
        type: data.type,
        correctRate,
        difficultyCategory,
        correctCount: data.correct,
        incorrectCount: Math.max(0, data.total - data.correct),
        discriminationIndex,
        discriminationCategory,
        recommendation,
      };
    });

  return {
    totalStudents,
    averageScore,
    medianScore,
    highestScore,
    lowestScore,
    scoreRange,
    standardDeviation,
    passedCount,
    failedCount,
    passRatePercentage,
    gradeDistribution,
    itemDifficulty,
    studentRankings,
    remedialStudentNames,
  };
}

export function anonymizeStudentData(name: string, id: string): { maskedName: string; maskedId: string } {
  const parts = name.trim().split(' ');
  const maskedName = parts
    .map((p) => (p.length > 2 ? `${p[0]}${'*'.repeat(Math.max(1, p.length - 2))}${p[p.length - 1]}` : p))
    .join(' ');
  const maskedId = id.length > 4 ? `${id.slice(0, 2)}****${id.slice(-2)}` : '****';
  return { maskedName, maskedId };
}

export function exportSubmissionsToCSV(submissions: GradedSubmission[]): string {
  const headers = ['No', 'Nama Siswa', 'NIS', 'Kelas', 'Mata Pelajaran', 'Nilai Akhir', 'Predikat', 'Status KKM', 'Status Verifikasi', 'Tanggal'];
  const rows = submissions.map((s, index) => [
    index + 1,
    `"${s.studentName.replace(/"/g, '""')}"`,
    `"${s.studentId}"`,
    `"${s.classRoom}"`,
    `"${s.subject}"`,
    s.scorePercentage,
    s.gradeLetter,
    s.isPassed ? 'Tuntas' : 'Belum Tuntas',
    s.verifiedByTeacher ? 'Terverifikasi' : 'Perlu Tinjauan',
    s.date,
  ]);

  return [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
}
