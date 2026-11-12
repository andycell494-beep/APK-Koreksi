import React from 'react';
import { Home, Camera, FileCheck2, BarChart3, Settings } from 'lucide-react';

export type TabType = 'home' | 'scan' | 'results' | 'analytics' | 'settings';

interface BottomNavProps {
  activeTab: TabType;
  onChangeTab: (tab: TabType) => void;
  unverifiedCount?: number;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  activeTab,
  onChangeTab,
  unverifiedCount = 0,
}) => {
  const tabs = [
    {
      id: 'home' as TabType,
      label: 'Beranda',
      icon: Home,
    },
    {
      id: 'scan' as TabType,
      label: 'Periksa',
      icon: Camera,
      isSpecial: true,
    },
    {
      id: 'results' as TabType,
      label: 'Hasil Nilai',
      icon: FileCheck2,
      badge: unverifiedCount > 0 ? unverifiedCount : undefined,
    },
    {
      id: 'analytics' as TabType,
      label: 'Analisis',
      icon: BarChart3,
    },
    {
      id: 'settings' as TabType,
      label: 'Pengaturan',
      icon: Settings,
    },
  ];

  return (
    <nav
      aria-label="Navigasi Menu Utama"
      className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-lg border-t border-slate-200/80 dark:bg-slate-900/95 dark:border-slate-800 transition-colors"
      style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 0.35rem)' }}
    >
      <div className="max-w-md mx-auto px-2 flex items-center justify-around">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          const Icon = tab.icon;

          if (tab.isSpecial) {
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => onChangeTab(tab.id)}
                aria-label="Periksa Lembar Jawaban dengan Kamera"
                className="group relative -top-3 flex flex-col items-center focus:outline-none"
              >
                <div
                  className={`w-14 h-14 rounded-full flex items-center justify-center shadow-lg transition-transform duration-200 active:scale-90 ${
                    isActive
                      ? 'bg-gradient-to-tr from-indigo-600 via-indigo-500 to-violet-500 text-white ring-4 ring-indigo-200 dark:ring-indigo-950 scale-105'
                      : 'bg-gradient-to-tr from-indigo-600 to-violet-600 text-white hover:scale-105'
                  }`}
                >
                  <Icon className="w-6 h-6 animate-pulse" />
                </div>
                <span
                  className={`mt-1 text-[11px] font-bold tracking-tight transition-colors ${
                    isActive ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-600 dark:text-slate-400'
                  }`}
                >
                  {tab.label}
                </span>
              </button>
            );
          }

          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onChangeTab(tab.id)}
              aria-label={`Menu ${tab.label}`}
              className={`relative flex flex-col items-center justify-center py-2 px-2.5 min-w-[56px] min-h-[50px] rounded-xl transition-all duration-150 active:scale-95 ${
                isActive
                  ? 'text-indigo-600 dark:text-indigo-400 font-semibold'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <div className="relative">
                <Icon className={`w-5 h-5 transition-transform duration-150 ${isActive ? 'scale-110' : ''}`} />
                {tab.badge !== undefined && (
                  <span className="absolute -top-1 -right-2 min-w-[16px] h-4 px-1 rounded-full bg-rose-500 text-[10px] font-bold text-white flex items-center justify-center ring-2 ring-white dark:ring-slate-900">
                    {tab.badge}
                  </span>
                )}
              </div>
              <span className={`text-[11px] mt-1 tracking-tight ${isActive ? 'font-bold' : 'font-medium'}`}>
                {tab.label}
              </span>
              {isActive && (
                <span className="absolute bottom-1 w-1 h-1 rounded-full bg-indigo-600 dark:bg-indigo-400" />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
};
