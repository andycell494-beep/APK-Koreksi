import React, { useState } from 'react';
import { Download, Share2, PlusSquare, X } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

interface Props {
  variant?: 'primary' | 'outline' | 'compact';
  className?: string;
}

export const PWAInstallButton: React.FC<Props> = ({ variant = 'primary', className = '' }) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  // If already running in standalone PWA, hide button
  if (isInstalled) {
    return null;
  }

  // Chromium / Android / Desktop flow
  if (isInstallable) {
    if (variant === 'compact') {
      return (
        <button
          type="button"
          onClick={install}
          aria-label="Install Aplikasi AI Smart Grading"
          className={`flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-indigo-700 active:scale-95 transition ${className}`}
        >
          <Download className="w-3.5 h-3.5" />
          <span>Pasang App</span>
        </button>
      );
    }

    return (
      <button
        type="button"
        onClick={install}
        aria-label="Install Aplikasi ke Layar Utama"
        className={`flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-4 py-3 text-sm font-semibold text-white shadow-md hover:from-indigo-700 hover:to-violet-700 active:scale-[0.98] transition ${className}`}
      >
        <Download className="w-4 h-4" />
        <span>Tambahkan ke Layar Utama (PWA)</span>
      </button>
    );
  }

  // iOS Safari flow
  if (isIOS) {
    return (
      <>
        <button
          type="button"
          onClick={() => setShowIOSGuide(true)}
          aria-label="Panduan Pasang di iPhone / iPad"
          className={`flex items-center justify-center gap-2 rounded-xl border border-indigo-200 bg-indigo-50/80 px-4 py-2.5 text-xs font-semibold text-indigo-700 hover:bg-indigo-100 dark:border-indigo-800 dark:bg-indigo-950/50 dark:text-indigo-300 ${className}`}
        >
          <Share2 className="w-3.5 h-3.5" />
          <span>Pasang di iPhone / iPad</span>
        </button>

        {showIOSGuide && (
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="ios-modal-title"
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
          >
            <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl dark:bg-slate-900 border border-slate-100 dark:border-slate-800 animate-in fade-in zoom-in-95">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                <h3 id="ios-modal-title" className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <PlusSquare className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                  Pasang di Layar Utama iOS
                </h3>
                <button
                  type="button"
                  onClick={() => setShowIOSGuide(false)}
                  aria-label="Tutup panduan"
                  className="rounded-full p-1 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="mt-4 space-y-3 text-sm text-slate-600 dark:text-slate-300">
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-indigo-100 text-indigo-600 font-bold text-xs flex items-center justify-center dark:bg-indigo-900 dark:text-indigo-300">
                    1
                  </div>
                  <p>
                    Buka peramban <strong>Safari</strong> dan ketuk tombol <strong>Share</strong> (ikon kotak dengan panah ke atas di bagian bawah).
                  </p>
                </div>

                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-indigo-100 text-indigo-600 font-bold text-xs flex items-center justify-center dark:bg-indigo-900 dark:text-indigo-300">
                    2
                  </div>
                  <p>
                    Gulir ke bawah dan pilih opsi <strong>"Add to Home Screen"</strong> (Tambahkan ke Layar Utama).
                  </p>
                </div>

                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-indigo-100 text-indigo-600 font-bold text-xs flex items-center justify-center dark:bg-indigo-900 dark:text-indigo-300">
                    3
                  </div>
                  <p>
                    Ketuk <strong>Add / Tambah</strong> di pojok kanan atas. Aplikasi siap dibuka seperti aplikasi native!
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowIOSGuide(false)}
                className="mt-6 w-full rounded-xl bg-slate-900 py-3 text-sm font-semibold text-white hover:bg-slate-800 dark:bg-indigo-600 dark:hover:bg-indigo-700"
              >
                Saya Mengerti
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  // Generic fallback install info
  return (
    <button
      type="button"
      onClick={() => alert('Untuk memasang di perangkat ini, gunakan menu peramban Anda lalu pilih "Install App" atau "Tambahkan ke Layar Utama".')}
      className={`flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 ${className}`}
    >
      <Download className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
      <span>Instalasi PWA</span>
    </button>
  );
};
