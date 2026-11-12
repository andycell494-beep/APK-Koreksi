import React, { useState, useEffect } from 'react';
import { BottomNav, TabType } from './components/BottomNav';
import { HomeView } from './components/HomeView';
import { CameraScanner } from './components/CameraScanner';
import { ResultsView } from './components/ResultsView';
import { AnalysisView } from './components/AnalysisView';
import { SettingsView } from './components/SettingsView';
import { OfflineIndicator } from './components/OfflineIndicator';
import {
  loadSubmissions,
  loadTeacherProfile,
  loadTheme,
  saveTheme,
  TeacherProfile,
} from './utils/storage';
import { GradedSubmission } from './utils/gradingLogic';

export default function App() {
  const [activeTab, setActiveTab] = useState<TabType>('home');
  const [resultsSubTab, setResultsSubTab] = useState<'submissions' | 'buku_nilai' | 'students'>('submissions');
  const [submissions, setSubmissions] = useState<GradedSubmission[]>([]);
  const [profile, setProfile] = useState<TeacherProfile>(loadTeacherProfile());
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [anonymizeEnabled, setAnonymizeEnabled] = useState<boolean>(false);
  const [selectedSubForDetail, setSelectedSubForDetail] = useState<GradedSubmission | null>(null);

  // Initialize theme, profile, and submissions
  useEffect(() => {
    const initialTheme = loadTheme();
    setTheme(initialTheme);
    if (initialTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }

    const loadedSubs = loadSubmissions();
    setSubmissions(loadedSubs);

    const loadedProf = loadTeacherProfile();
    setProfile(loadedProf);
    setAnonymizeEnabled(loadedProf.anonymizeStudentData ?? false);
  }, []);

  const handleToggleTheme = () => {
    const next = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    saveTheme(next);
  };

  const handleToggleAnonymize = (enabled: boolean) => {
    setAnonymizeEnabled(enabled);
    setProfile((prev) => ({ ...prev, anonymizeStudentData: enabled }));
  };

  const handleGradingComplete = (newlyGraded: GradedSubmission[]) => {
    // Refresh submissions
    setSubmissions(loadSubmissions());
    // Navigate to results
    setResultsSubTab('submissions');
    setActiveTab('results');
  };

  const handleSubmissionsUpdated = () => {
    setSubmissions(loadSubmissions());
  };

  const handleDataReset = () => {
    setSubmissions(loadSubmissions());
    setProfile(loadTeacherProfile());
  };

  const unverifiedCount = submissions.filter((s) => !s.verifiedByTeacher).length;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans transition-colors duration-200">
      {/* Offline Status Alert Banner */}
      <OfflineIndicator />

      {/* Main Content Area - Responsive Container */}
      <main className="flex-1 w-full max-w-lg mx-auto bg-white dark:bg-slate-900 min-h-screen shadow-xl relative flex flex-col">
        {activeTab === 'home' && (
          <HomeView
            profile={profile}
            submissions={submissions}
            anonymizeEnabled={anonymizeEnabled}
            onNavigateToScan={() => setActiveTab('scan')}
            onNavigateToResults={() => {
              setResultsSubTab('submissions');
              setActiveTab('results');
            }}
            onNavigateToAnalytics={() => setActiveTab('analytics')}
            onNavigateToBukuNilai={() => {
              setResultsSubTab('buku_nilai');
              setActiveTab('results');
            }}
            onNavigateToStudents={() => {
              setResultsSubTab('students');
              setActiveTab('results');
            }}
            onSelectSubmission={(sub) => {
              setSelectedSubForDetail(sub);
              setResultsSubTab('submissions');
              setActiveTab('results');
            }}
          />
        )}

        {activeTab === 'scan' && (
          <CameraScanner
            defaultKkm={profile.defaultKkm}
            onGradingComplete={handleGradingComplete}
            onOpenResults={() => {
              setResultsSubTab('submissions');
              setActiveTab('results');
            }}
          />
        )}

        {activeTab === 'results' && (
          <ResultsView
            key={resultsSubTab}
            initialSubTab={resultsSubTab}
            submissions={submissions}
            onSubmissionsUpdated={handleSubmissionsUpdated}
            anonymizeEnabled={anonymizeEnabled}
            onNavigateToScan={() => setActiveTab('scan')}
          />
        )}

        {activeTab === 'analytics' && (
          <AnalysisView
            submissions={submissions}
            anonymizeEnabled={anonymizeEnabled}
            onNavigateToScan={() => setActiveTab('scan')}
          />
        )}

        {activeTab === 'settings' && (
          <SettingsView
            currentTheme={theme}
            onToggleTheme={handleToggleTheme}
            anonymizeEnabled={anonymizeEnabled}
            onToggleAnonymize={handleToggleAnonymize}
            onDataReset={handleDataReset}
          />
        )}

        {/* Bottom Mobile Navigation Bar */}
        <BottomNav
          activeTab={activeTab}
          onChangeTab={(tab) => {
            setActiveTab(tab);
            if (tab === 'results') {
              setResultsSubTab('submissions');
            }
          }}
          unverifiedCount={unverifiedCount}
        />
      </main>
    </div>
  );
}
