import React, { useState } from 'react';
import {
  FileText,
  FileSpreadsheet,
  Download,
  Check,
  Sparkles,
  Printer,
  ChevronDown,
} from 'lucide-react';
import { ExportFormat, TeacherProfile, loadTeacherProfile } from '../utils/storage';

interface ExportFormatMenuProps {
  onExport: (format: ExportFormat) => Promise<void> | void;
  isExporting?: boolean;
  buttonLabel?: string;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'split' | 'pills' | 'dropdown';
  className?: string;
}

export const ExportFormatMenu: React.FC<ExportFormatMenuProps> = ({
  onExport,
  isExporting = false,
  buttonLabel = 'Cetak / Unduh',
  size = 'md',
  variant = 'split',
  className = '',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const profile: TeacherProfile = loadTeacherProfile();
  const defaultFormat: ExportFormat = profile.defaultExportFormat || 'pdf';

  const formatDetails = {
    pdf: {
      label: 'PDF (.pdf)',
      short: 'PDF',
      desc: 'Dokumen siap cetak A4/F4',
      icon: Printer,
      color: 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800',
      activeBadge: 'bg-rose-600 text-white',
    },
    word: {
      label: 'Word (.doc)',
      short: 'Word',
      desc: 'Microsoft Word (Bisa Diedit)',
      icon: FileText,
      color: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800',
      activeBadge: 'bg-blue-600 text-white',
    },
    excel: {
      label: 'Excel (.xls)',
      short: 'Excel',
      desc: 'Spreadsheet & Rekap Data',
      icon: FileSpreadsheet,
      color: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800',
      activeBadge: 'bg-emerald-600 text-white',
    },
  };

  const handleSelect = (fmt: ExportFormat) => {
    setIsOpen(false);
    onExport(fmt);
  };

  if (variant === 'pills') {
    return (
      <div className={`flex items-center gap-1.5 ${className}`}>
        <button
          type="button"
          disabled={isExporting}
          onClick={() => handleSelect('pdf')}
          className="px-2.5 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/50 dark:hover:bg-rose-900/50 text-rose-700 dark:text-rose-300 font-bold text-xs flex items-center gap-1 border border-rose-200 dark:border-rose-800 transition active:scale-95 disabled:opacity-50"
          title="Unduh Berkas PDF Resmi"
        >
          <Printer className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
          <span>PDF</span>
          {defaultFormat === 'pdf' && (
            <span className="w-1.5 h-1.5 rounded-full bg-rose-600 ml-0.5" />
          )}
        </button>

        <button
          type="button"
          disabled={isExporting}
          onClick={() => handleSelect('word')}
          className="px-2.5 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/50 dark:hover:bg-blue-900/50 text-blue-700 dark:text-blue-300 font-bold text-xs flex items-center gap-1 border border-blue-200 dark:border-blue-800 transition active:scale-95 disabled:opacity-50"
          title="Unduh Berkas Word (.doc)"
        >
          <FileText className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
          <span>Word</span>
          {defaultFormat === 'word' && (
            <span className="w-1.5 h-1.5 rounded-full bg-blue-600 ml-0.5" />
          )}
        </button>

        <button
          type="button"
          disabled={isExporting}
          onClick={() => handleSelect('excel')}
          className="px-2.5 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/50 dark:hover:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300 font-bold text-xs flex items-center gap-1 border border-emerald-200 dark:border-emerald-800 transition active:scale-95 disabled:opacity-50"
          title="Unduh Berkas Excel (.xls)"
        >
          <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
          <span>Excel</span>
          {defaultFormat === 'excel' && (
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 ml-0.5" />
          )}
        </button>
      </div>
    );
  }

  return (
    <div className={`relative inline-block text-left ${className}`}>
      <div className="inline-flex rounded-xl shadow-sm">
        {/* Main Default Format Action Button */}
        <button
          type="button"
          disabled={isExporting}
          onClick={() => handleSelect(defaultFormat)}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-l-xl bg-indigo-600 text-white font-bold text-xs hover:bg-indigo-700 active:scale-95 transition disabled:opacity-50"
          title={`Unduh dalam Format Utama (${formatDetails[defaultFormat].label})`}
        >
          {defaultFormat === 'pdf' && <Printer className="w-3.5 h-3.5" />}
          {defaultFormat === 'word' && <FileText className="w-3.5 h-3.5" />}
          {defaultFormat === 'excel' && <FileSpreadsheet className="w-3.5 h-3.5" />}
          <span>
            {isExporting ? 'Memproses...' : `${buttonLabel} (${formatDetails[defaultFormat].short})`}
          </span>
        </button>

        {/* Dropdown toggle to pick any format */}
        <button
          type="button"
          disabled={isExporting}
          onClick={() => setIsOpen(!isOpen)}
          aria-label="Pilih format cetak Word, PDF, atau Excel"
          className="inline-flex items-center px-2 py-2 rounded-r-xl bg-indigo-700 text-white hover:bg-indigo-800 border-l border-indigo-500 transition active:scale-95 disabled:opacity-50"
        >
          <ChevronDown className={`w-3.5 h-3.5 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </button>
      </div>

      {/* Floating format picker popup */}
      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 mt-2 w-56 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl z-50 p-2 space-y-1 animate-in fade-in zoom-in-95">
            <div className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Pilih Format Berkas:
            </div>

            {(['pdf', 'word', 'excel'] as ExportFormat[]).map((fmt) => {
              const item = formatDetails[fmt];
              const Icon = item.icon;
              const isDefault = defaultFormat === fmt;

              return (
                <button
                  key={fmt}
                  type="button"
                  onClick={() => handleSelect(fmt)}
                  className="w-full text-left p-2 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center justify-between transition group"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <div className={`p-1.5 rounded-lg border ${item.color}`}>
                      <Icon className="w-3.5 h-3.5" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1 truncate">
                        <span>{item.label}</span>
                        {isDefault && (
                          <span className="text-[9px] px-1 py-0.2 rounded bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300 font-bold">
                            Utama
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] text-slate-400 block truncate">
                        {item.desc}
                      </span>
                    </div>
                  </div>
                  <Download className="w-3.5 h-3.5 text-slate-300 group-hover:text-indigo-600 transition" />
                </button>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
};
