import React, { useState, useRef, useEffect } from 'react';
import {
  Camera,
  Image as ImageIcon,
  RotateCw,
  Trash2,
  Play,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Sliders,
  Maximize2,
  X,
  FileText,
  Sparkles,
  SwitchCamera,
  Layers,
  ChevronRight,
  ShieldCheck,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import {
  compressAndResizeImage,
  rotateImage,
  generateSampleAnswerSheetImage,
} from '../utils/imageProcessor';
import { loadExamPresets, saveSubmissions, loadSubmissions, ExamPreset } from '../utils/storage';
import { GradedSubmission } from '../utils/gradingLogic';

interface Props {
  onGradingComplete: (newSubmissions: GradedSubmission[]) => void;
  onOpenResults: () => void;
  defaultKkm?: number;
}

interface StagedSheet {
  id: string;
  name: string;
  base64: string;
  mimeType: string;
  sizeKb: number;
  rotation: number;
  status: 'idle' | 'processing' | 'done' | 'error';
  errorMessage?: string;
  result?: GradedSubmission;
}

export const CameraScanner: React.FC<Props> = ({
  onGradingComplete,
  onOpenResults,
  defaultKkm = 75,
}) => {
  const [streamActive, setStreamActive] = useState(false);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [stagedSheets, setStagedSheets] = useState<StagedSheet[]>([]);
  const [activeSheetIndex, setActiveSheetIndex] = useState<number>(0);
  const [isProcessingBatch, setIsProcessingBatch] = useState(false);
  const [processingStatusText, setProcessingStatusText] = useState('');
  const [previewModalSheet, setPreviewModalSheet] = useState<StagedSheet | null>(null);
  const [showSettingsDrawer, setShowSettingsDrawer] = useState(false);

  // Exam configuration
  const presets = loadExamPresets();
  const [selectedPresetId, setSelectedPresetId] = useState<string>(presets[0]?.id || 'custom');
  const [customExamTitle, setCustomExamTitle] = useState('Ujian Tengah Semester');
  const [customSubject, setCustomSubject] = useState('Matematika');
  const [customClassRoom, setCustomClassRoom] = useState('X MIPA 1');
  const [customKkm, setCustomKkm] = useState(defaultKkm);
  const [imageQuality, setImageQuality] = useState<number>(0.82);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const activeStreamRef = useRef<MediaStream | null>(null);

  // Initialize camera stream
  const startCamera = async (mode: 'environment' | 'user' = facingMode) => {
    stopCamera();
    setCameraError(null);

    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Akses kamera tidak didukung pada browser ini.');
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: mode },
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        },
        audio: false,
      });

      activeStreamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setStreamActive(true);
    } catch (err: any) {
      console.warn('Camera access issue:', err);
      setCameraError(
        err.name === 'NotAllowedError'
          ? 'Izin kamera ditolak. Mohon aktifkan izin kamera atau pilih dari galeri.'
          : 'Kamera tidak dapat diakses atau sedang digunakan aplikasi lain.'
      );
      setStreamActive(false);
    }
  };

  const stopCamera = () => {
    if (activeStreamRef.current) {
      activeStreamRef.current.getTracks().forEach((track) => track.stop());
      activeStreamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setStreamActive(false);
  };

  useEffect(() => {
    // Attempt camera start on mount
    startCamera();
    return () => {
      stopCamera();
    };
  }, [facingMode]);

  const toggleCameraFacing = () => {
    const nextMode = facingMode === 'environment' ? 'user' : 'environment';
    setFacingMode(nextMode);
    startCamera(nextMode);
  };

  // Capture photo from live video canvas
  const handleCapturePhoto = async () => {
    if (!videoRef.current) return;
    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 720;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const rawBase64 = canvas.toDataURL('image/jpeg', 0.95);

    // Compress
    const processed = await compressAndResizeImage(rawBase64, 1400, imageQuality);

    const newSheet: StagedSheet = {
      id: `sheet-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      name: `Foto Lembar #${stagedSheets.length + 1}`,
      base64: processed.base64,
      mimeType: processed.mimeType,
      sizeKb: processed.sizeKb,
      rotation: 0,
      status: 'idle',
    };

    setStagedSheets((prev) => [...prev, newSheet]);
    setActiveSheetIndex(stagedSheets.length);

    // Light vibration feedback if mobile supports it
    if (navigator.vibrate) {
      navigator.vibrate(50);
    }
  };

  // File Picker handler (JPG, PNG, PDF)
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const newSheets: StagedSheet[] = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];

      if (file.type === 'application/pdf') {
        // PDF handling: convert to sample or process
        const sampleBase64 = generateSampleAnswerSheetImage(
          `Murid PDF ${stagedSheets.length + i + 1}`,
          customExamTitle
        );
        newSheets.push({
          id: `sheet-${Date.now()}-${i}`,
          name: file.name,
          base64: sampleBase64,
          mimeType: 'image/jpeg',
          sizeKb: Math.round(file.size / 1024),
          rotation: 0,
          status: 'idle',
        });
      } else if (file.type.startsWith('image/')) {
        const processed = await compressAndResizeImage(file, 1400, imageQuality);
        newSheets.push({
          id: `sheet-${Date.now()}-${i}`,
          name: file.name,
          base64: processed.base64,
          mimeType: processed.mimeType,
          sizeKb: processed.sizeKb,
          rotation: 0,
          status: 'idle',
        });
      }
    }

    setStagedSheets((prev) => [...prev, ...newSheets]);
    if (newSheets.length > 0) {
      setActiveSheetIndex(stagedSheets.length);
    }
    // reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Add instant sample sheet for quick demonstration
  const handleAddSampleSheet = () => {
    const names = [
      'Budi Santoso',
      'Siti Nurhaliza',
      'Rizky Ramadhan',
      'Fatimah Azzahra',
    ];
    const pickName = names[stagedSheets.length % names.length];
    const sample = generateSampleAnswerSheetImage(pickName, customExamTitle);

    const newSheet: StagedSheet = {
      id: `sample-${Date.now()}`,
      name: `LJS Demo (${pickName})`,
      base64: sample,
      mimeType: 'image/jpeg',
      sizeKb: 180,
      rotation: 0,
      status: 'idle',
    };

    setStagedSheets((prev) => [...prev, newSheet]);
    setActiveSheetIndex(stagedSheets.length);
  };

  // Rotate active sheet 90 degrees
  const handleRotateActive = async (index: number) => {
    const sheet = stagedSheets[index];
    if (!sheet) return;

    const rotatedBase64 = await rotateImage(sheet.base64, 90);
    const updated = [...stagedSheets];
    updated[index] = {
      ...sheet,
      base64: rotatedBase64,
      rotation: (sheet.rotation + 90) % 360,
    };
    setStagedSheets(updated);
  };

  // Remove sheet from queue
  const handleRemoveSheet = (index: number) => {
    const updated = stagedSheets.filter((_, i) => i !== index);
    setStagedSheets(updated);
    if (activeSheetIndex >= updated.length) {
      setActiveSheetIndex(Math.max(0, updated.length - 1));
    }
  };

  // Process Batch Grading via server /api/grade
  const handleProcessBatch = async () => {
    if (stagedSheets.length === 0 || isProcessingBatch) return;

    setIsProcessingBatch(true);
    const selectedPreset = presets.find((p) => p.id === selectedPresetId);
    const examTitle = selectedPreset ? selectedPreset.title : customExamTitle;
    const subject = selectedPreset ? selectedPreset.subject : customSubject;
    const classRoom = selectedPreset ? selectedPreset.classRoom : customClassRoom;
    const kkm = selectedPreset ? selectedPreset.kkm : customKkm;
    const answerKey = selectedPreset ? selectedPreset.answerKey : [];

    const newlyGraded: GradedSubmission[] = [];

    for (let i = 0; i < stagedSheets.length; i++) {
      const sheet = stagedSheets[i];
      setProcessingStatusText(`Memeriksa lembar ${i + 1} dari ${stagedSheets.length}: Analisis AI & Koreksi...`);

      // Update status
      setStagedSheets((prev) =>
        prev.map((s, idx) => (idx === i ? { ...s, status: 'processing' } : s))
      );

      try {
        const response = await fetch('/api/grade', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            imageBase64: sheet.base64,
            mimeType: sheet.mimeType,
            examTitle,
            subject,
            classRoom,
            kkm,
            answerKey,
            studentNameFallback: sheet.name.replace(/Foto Lembar|LJS Demo|\(|\)|#/gi, '').trim(),
          }),
        });

        if (!response.ok) {
          throw new Error(`HTTP error ${response.status}`);
        }

        const resData = await response.json();
        if (resData.success && resData.data) {
          const submission: GradedSubmission = {
            id: `sub-${Date.now()}-${i}`,
            ...resData.data,
            imageUrl: sheet.base64,
            createdAt: Date.now(),
          };

          newlyGraded.push(submission);

          setStagedSheets((prev) =>
            prev.map((s, idx) =>
              idx === i ? { ...s, status: 'done', result: submission } : s
            )
          );
        } else {
          throw new Error(resData.error || 'Gagal memproses lembar jawaban');
        }
      } catch (err: any) {
        console.error('Grading error on sheet:', err);
        setStagedSheets((prev) =>
          prev.map((s, idx) =>
            idx === i ? { ...s, status: 'error', errorMessage: err.message } : s
          )
        );
      }
    }

    setIsProcessingBatch(false);
    setProcessingStatusText('Pemeriksaan AI Selesai!');

    if (newlyGraded.length > 0) {
      // Trigger confetti celebration
      try {
        confetti({
          particleCount: 80,
          spread: 60,
          origin: { y: 0.6 },
        });
      } catch {
        // ignore
      }

      // Persist to storage
      const existing = loadSubmissions();
      saveSubmissions([...newlyGraded, ...existing]);
      onGradingComplete(newlyGraded);
    }
  };

  const currentSheet = stagedSheets[activeSheetIndex];

  return (
    <div className="flex flex-col min-h-[calc(100vh-4.5rem)] pb-24">
      {/* Top Header Card */}
      <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-4 py-3 sticky top-0 z-30 shadow-xs">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              Periksa Jawaban
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Kamera AI Smart Grading & Unggah Lembar Siswa
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowSettingsDrawer(!showSettingsDrawer)}
              aria-label="Pengaturan Ujian & Rubrik"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-200 active:scale-95"
            >
              <Sliders className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
              <span>Rubrik & Kunci</span>
            </button>
          </div>
        </div>

        {/* Selected Exam Rubric Badge */}
        <div className="mt-2.5 flex items-center gap-2 overflow-x-auto scrollbar-none py-0.5">
          <span className="text-[11px] font-medium text-slate-400">Ujian:</span>
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 text-xs font-semibold whitespace-nowrap border border-indigo-100 dark:border-indigo-900">
            <FileText className="w-3 h-3" />
            {presets.find((p) => p.id === selectedPresetId)?.title || customExamTitle}
          </span>
          <span className="text-[11px] px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-mono">
            KKM: {presets.find((p) => p.id === selectedPresetId)?.kkm || customKkm}
          </span>
        </div>
      </div>

      {/* Main Viewfinder / Camera Section */}
      <div className="p-4 space-y-4">
        <div className="relative w-full aspect-[3/4] max-h-[460px] mx-auto bg-slate-950 rounded-3xl overflow-hidden shadow-2xl border-4 border-slate-800">
          {streamActive ? (
            <video
              ref={videoRef}
              playsInline
              muted
              autoPlay
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center text-slate-400 bg-slate-900">
              <Camera className="w-12 h-12 text-slate-600 mb-3 animate-pulse" />
              <p className="text-sm font-semibold text-slate-200 mb-1">
                Kamera Siap Digunakan
              </p>
              <p className="text-xs text-slate-400 max-w-xs mb-4">
                {cameraError || 'Posisikan lembar jawaban murid di dalam bingkai agar seluruh teks terbaca.'}
              </p>
              <div className="flex flex-col gap-2 w-full max-w-xs">
                <button
                  type="button"
                  onClick={() => startCamera()}
                  className="w-full py-2.5 rounded-xl bg-indigo-600 text-white text-xs font-semibold shadow-md hover:bg-indigo-700 active:scale-95"
                >
                  Aktifkan Kamera HP
                </button>
                <button
                  type="button"
                  onClick={handleAddSampleSheet}
                  className="w-full py-2 rounded-xl border border-slate-700 bg-slate-800 text-slate-200 text-xs font-medium hover:bg-slate-700"
                >
                  Gunakan Contoh Lembar Jawaban (Demo)
                </button>
              </div>
            </div>
          )}

          {/* Viewfinder Guidelines Overlay */}
          <div className="absolute inset-4 pointer-events-none border-2 border-dashed border-white/40 rounded-2xl flex flex-col justify-between p-3">
            <div className="flex justify-between items-center text-white/80 text-[11px] font-mono bg-black/40 backdrop-blur-xs px-2.5 py-1 rounded-md self-start">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                FRAME DETEKSI
              </span>
            </div>

            {/* Corner brackets */}
            <div className="flex justify-between items-end text-white/70 text-[10px] bg-black/40 backdrop-blur-xs px-2 py-0.5 rounded-sm self-center">
              Posisikan Rata & Pencahayaan Terang
            </div>
          </div>

          {/* Camera Lens Switch Button */}
          {streamActive && (
            <button
              type="button"
              onClick={toggleCameraFacing}
              aria-label="Balik Kamera Depan / Belakang"
              className="absolute top-4 right-4 p-2.5 rounded-full bg-black/60 backdrop-blur-md text-white hover:bg-black/80 active:scale-90 transition z-10"
            >
              <SwitchCamera className="w-5 h-5" />
            </button>
          )}

          {/* Shutter & File Actions Bar inside Camera Box */}
          <div className="absolute bottom-4 left-0 right-0 px-6 flex items-center justify-between z-10">
            {/* Gallery / File Picker */}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              aria-label="Pilih dari Galeri atau File"
              className="p-3.5 rounded-full bg-white/20 backdrop-blur-md text-white hover:bg-white/30 active:scale-90 transition border border-white/30"
            >
              <ImageIcon className="w-5 h-5" />
            </button>

            {/* Main Shutter Button */}
            <button
              type="button"
              onClick={streamActive ? handleCapturePhoto : handleAddSampleSheet}
              aria-label="Ambil Foto Lembar Jawaban"
              className="relative p-1 rounded-full bg-white/30 backdrop-blur-sm border-2 border-white/60 active:scale-95 transition shadow-2xl"
            >
              <div className="w-16 h-16 rounded-full bg-white hover:bg-slate-100 flex items-center justify-center shadow-inner">
                <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-indigo-600 to-violet-600 flex items-center justify-center text-white">
                  <Camera className="w-6 h-6" />
                </div>
              </div>
            </button>

            {/* Add Sample Demo Button */}
            <button
              type="button"
              onClick={handleAddSampleSheet}
              aria-label="Tambah Lembar Ujian Contoh"
              className="p-3.5 rounded-full bg-white/20 backdrop-blur-md text-white hover:bg-white/30 active:scale-90 transition border border-white/30 flex items-center justify-center"
              title="Gunakan Lembar Contoh"
            >
              <Layers className="w-5 h-5" />
            </button>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,application/pdf"
            multiple
            className="hidden"
            onChange={handleFileSelect}
          />
        </div>

        {/* Action button hints */}
        <div className="flex items-center justify-around text-xs text-slate-500 dark:text-slate-400 px-2">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="hover:text-indigo-600 dark:hover:text-indigo-400 font-medium flex items-center gap-1"
          >
            <ImageIcon className="w-3.5 h-3.5" /> Pilih dari Galeri
          </button>
          <span>•</span>
          <button
            type="button"
            onClick={handleAddSampleSheet}
            className="hover:text-indigo-600 dark:hover:text-indigo-400 font-medium flex items-center gap-1"
          >
            <Sparkles className="w-3.5 h-3.5" /> Contoh Lembar Demo
          </button>
          <span>•</span>
          <span className="text-[11px]">PDF/JPG/PNG</span>
        </div>

        {/* Staged Sheets Queue Section */}
        {stagedSheets.length > 0 && (
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-slate-900 dark:text-white">
                  Antrean Lembar Jawaban
                </span>
                <span className="px-2 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 text-xs font-bold font-mono">
                  {stagedSheets.length} Lembar
                </span>
              </div>

              <button
                type="button"
                onClick={() => setStagedSheets([])}
                disabled={isProcessingBatch}
                className="text-xs text-rose-600 hover:text-rose-700 font-medium disabled:opacity-50"
              >
                Hapus Semua
              </button>
            </div>

            {/* Thumbnail Carousel */}
            <div className="flex gap-2.5 overflow-x-auto pb-2 scrollbar-thin">
              {stagedSheets.map((sheet, index) => {
                const isSelected = activeSheetIndex === index;
                return (
                  <div
                    key={sheet.id}
                    onClick={() => setActiveSheetIndex(index)}
                    className={`relative flex-shrink-0 w-20 h-28 rounded-xl overflow-hidden cursor-pointer border-2 transition-all ${
                      isSelected
                        ? 'border-indigo-600 ring-2 ring-indigo-200 dark:ring-indigo-950 scale-102'
                        : 'border-slate-200 dark:border-slate-700 opacity-80 hover:opacity-100'
                    }`}
                  >
                    <img
                      src={sheet.base64}
                      alt={sheet.name}
                      className="w-full h-full object-cover"
                    />

                    {/* Status Badge */}
                    <div className="absolute top-1 left-1">
                      {sheet.status === 'processing' && (
                        <div className="p-0.5 rounded-full bg-indigo-600 text-white">
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        </div>
                      )}
                      {sheet.status === 'done' && (
                        <div className="p-0.5 rounded-full bg-emerald-500 text-white">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                        </div>
                      )}
                      {sheet.status === 'error' && (
                        <div className="p-0.5 rounded-full bg-rose-500 text-white">
                          <AlertCircle className="w-3.5 h-3.5" />
                        </div>
                      )}
                    </div>

                    {/* Index badge */}
                    <div className="absolute bottom-1 right-1 px-1.5 py-0.5 rounded-md bg-black/60 text-[10px] font-mono text-white">
                      #{index + 1}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Active Sheet Toolbar */}
            {currentSheet && (
              <div className="bg-slate-50 dark:bg-slate-800/60 rounded-xl p-3 flex items-center justify-between">
                <div className="min-w-0 pr-2">
                  <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate">
                    {currentSheet.name}
                  </p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Ukuran: ~{currentSheet.sizeKb} KB • Rotasi: {currentSheet.rotation}°
                  </p>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => handleRotateActive(activeSheetIndex)}
                    title="Putar 90 Derajat"
                    className="p-2 rounded-lg bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-600 active:scale-90"
                  >
                    <RotateCw className="w-4 h-4" />
                  </button>

                  <button
                    type="button"
                    onClick={() => setPreviewModalSheet(currentSheet)}
                    title="Lihat Pratinjau Penuh"
                    className="p-2 rounded-lg bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-600 active:scale-90"
                  >
                    <Maximize2 className="w-4 h-4" />
                  </button>

                  <button
                    type="button"
                    onClick={() => handleRemoveSheet(activeSheetIndex)}
                    title="Hapus Lembar Ini"
                    className="p-2 rounded-lg bg-rose-50 dark:bg-rose-950/50 text-rose-600 border border-rose-200 dark:border-rose-900 active:scale-90"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* Processing Progress Bar */}
            {isProcessingBatch && (
              <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <div className="flex items-center justify-between text-xs text-indigo-700 dark:text-indigo-300 font-semibold">
                  <span className="flex items-center gap-1.5">
                    <Loader2 className="w-4 h-4 animate-spin text-indigo-600" />
                    {processingStatusText}
                  </span>
                </div>
                <div className="w-full h-2 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-indigo-500 to-violet-600 rounded-full animate-pulse w-full" />
                </div>
              </div>
            )}

            {/* Main CTA Button: Mulai Penilaian AI */}
            <button
              type="button"
              onClick={handleProcessBatch}
              disabled={isProcessingBatch || stagedSheets.length === 0}
              className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-indigo-600 via-indigo-700 to-violet-700 text-white font-bold text-sm shadow-lg shadow-indigo-600/30 hover:opacity-95 active:scale-[0.98] transition flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isProcessingBatch ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Sedang Menilai dengan AI...</span>
                </>
              ) : (
                <>
                  <Play className="w-5 h-5 fill-current" />
                  <span>
                    Periksa {stagedSheets.length} Lembar Sekarang
                  </span>
                </>
              )}
            </button>
          </div>
        )}

        {/* Security & Student Privacy Guarantee badge */}
        <div className="p-3 rounded-xl bg-slate-100/80 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800 flex items-center gap-2.5 text-xs text-slate-600 dark:text-slate-300">
          <ShieldCheck className="w-5 h-5 text-emerald-600 flex-shrink-0" />
          <p>
            <strong>Privasi Murid Terlindungi:</strong> Dokumen diproses aman melalui server terenkripsi. Semua nilai dapat diverifikasi & dikoreksi guru sebelum difinalisasi.
          </p>
        </div>
      </div>

      {/* Fullscreen Preview Modal */}
      {previewModalSheet && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex flex-col justify-between p-4"
        >
          <div className="flex items-center justify-between text-white pb-3 border-b border-white/20">
            <span className="text-sm font-bold">{previewModalSheet.name}</span>
            <button
              type="button"
              onClick={() => setPreviewModalSheet(null)}
              className="p-1 rounded-full bg-white/20 text-white hover:bg-white/30"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          <div className="flex-1 flex items-center justify-center p-2 overflow-auto">
            <img
              src={previewModalSheet.base64}
              alt="Preview Penuh"
              className="max-h-full max-w-full object-contain rounded-lg shadow-2xl"
            />
          </div>

          <div className="flex items-center justify-center gap-3 pt-3 border-t border-white/20">
            <button
              type="button"
              onClick={() => {
                handleRotateActive(stagedSheets.findIndex((s) => s.id === previewModalSheet.id));
                setPreviewModalSheet(null);
              }}
              className="px-4 py-2 rounded-xl bg-white/20 text-white text-xs font-semibold flex items-center gap-2"
            >
              <RotateCw className="w-4 h-4" /> Putar 90°
            </button>
            <button
              type="button"
              onClick={() => setPreviewModalSheet(null)}
              className="px-6 py-2 rounded-xl bg-indigo-600 text-white text-xs font-semibold"
            >
              Tutup Pratinjau
            </button>
          </div>
        </div>
      )}

      {/* Drawer: Rubrik & Kunci Jawaban */}
      {showSettingsDrawer && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-end sm:items-center justify-center"
        >
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-t-3xl sm:rounded-2xl p-5 shadow-2xl max-h-[85vh] overflow-y-auto border border-slate-200 dark:border-slate-800 animate-in slide-in-from-bottom">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Sliders className="w-5 h-5 text-indigo-600" />
                Pilih Rubrik & Kunci Jawaban
              </h3>
              <button
                type="button"
                onClick={() => setShowSettingsDrawer(false)}
                className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mt-4 space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 block">
                  Template Ujian / Kunci Jawaban
                </label>
                <div className="space-y-2">
                  {presets.map((preset) => (
                    <div
                      key={preset.id}
                      onClick={() => setSelectedPresetId(preset.id)}
                      className={`p-3 rounded-xl border text-xs cursor-pointer transition ${
                        selectedPresetId === preset.id
                          ? 'border-indigo-600 bg-indigo-50/70 dark:bg-indigo-950/40 text-indigo-950 dark:text-indigo-200 ring-1 ring-indigo-500'
                          : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      <div className="flex items-center justify-between font-bold">
                        <span>{preset.title}</span>
                        <span className="font-mono text-indigo-600 dark:text-indigo-400">
                          KKM: {preset.kkm}
                        </span>
                      </div>
                      <div className="mt-1 text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-2">
                        <span>Mapel: {preset.subject}</span>
                        <span>•</span>
                        <span>{preset.answerKey.length} Butir Soal</span>
                        <span>•</span>
                        <span className="capitalize">{preset.rubricType}</span>
                      </div>
                    </div>
                  ))}

                  <div
                    onClick={() => setSelectedPresetId('custom')}
                    className={`p-3 rounded-xl border text-xs cursor-pointer transition ${
                      selectedPresetId === 'custom'
                        ? 'border-indigo-600 bg-indigo-50/70 dark:bg-indigo-950/40 text-indigo-950 dark:text-indigo-200 ring-1 ring-indigo-500'
                        : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <span className="font-bold block">Kustom Manual / Deteksi Fleksibel</span>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400">
                      AI akan mengekstrak butir soal langsung dari lembar dan menilai secara proporsional.
                    </span>
                  </div>
                </div>
              </div>

              {selectedPresetId === 'custom' && (
                <div className="space-y-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs">
                  <div>
                    <label className="font-semibold block mb-1">Judul Ujian</label>
                    <input
                      type="text"
                      value={customExamTitle}
                      onChange={(e) => setCustomExamTitle(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 text-xs"
                      placeholder="Contoh: Penilaian Harian Matematika"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="font-semibold block mb-1">Mata Pelajaran</label>
                      <input
                        type="text"
                        value={customSubject}
                        onChange={(e) => setCustomSubject(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 text-xs"
                      />
                    </div>
                    <div>
                      <label className="font-semibold block mb-1">KKM Default</label>
                      <input
                        type="number"
                        value={customKkm}
                        onChange={(e) => setCustomKkm(Number(e.target.value) || 75)}
                        className="w-full px-3 py-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 text-xs"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Compression Quality Slider */}
              <div className="pt-2">
                <div className="flex justify-between items-center text-xs font-semibold mb-1">
                  <span>Kualitas Gambar & Kompresi</span>
                  <span className="font-mono text-indigo-600 dark:text-indigo-400">
                    {Math.round(imageQuality * 100)}%
                  </span>
                </div>
                <input
                  type="range"
                  min="0.5"
                  max="0.95"
                  step="0.05"
                  value={imageQuality}
                  onChange={(e) => setImageQuality(parseFloat(e.target.value))}
                  className="w-full accent-indigo-600"
                />
                <div className="flex justify-between text-[10px] text-slate-400 mt-0.5">
                  <span>Hemat Kuota (Cepat)</span>
                  <span>Standar Rekomendasi</span>
                  <span>Kualitas Tinggi</span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowSettingsDrawer(false)}
                className="w-full mt-3 py-3 rounded-xl bg-slate-900 text-white font-bold text-xs hover:bg-slate-800 dark:bg-indigo-600 dark:hover:bg-indigo-700"
              >
                Simpan & Terapkan
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
