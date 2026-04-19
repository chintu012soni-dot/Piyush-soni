/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Upload, 
  Sparkles, 
  RefreshCcw, 
  Download, 
  Image as ImageIcon,
  CheckCircle2,
  AlertCircle,
  ChevronRight,
  ShieldCheck
} from 'lucide-react';
import { GoogleGenAI } from "@google/genai";
import ComparisonSlider from './components/ComparisonSlider';

// Initialize Gemini
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY as string });

const LOADING_MESSAGES = [
  "Analyzing image texture...",
  "Identifying damaged pixels...",
  "Applying AI restoration...",
  "Enhancing facial details...",
  "Denoising and color correcting...",
  "Polishing final result...",
];

export default function App() {
  const [originalFile, setOriginalFile] = useState<File | null>(null);
  const [originalUrl, setOriginalUrl] = useState<string | null>(null);
  const [restoredUrl, setRestoredUrl] = useState<string | null>(null);
  const [isRestoring, setIsRestoring] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const base64String = (reader.result as string).split(',')[1];
        resolve(base64String);
      };
      reader.onerror = error => reject(error);
    });
  };

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (file) {
      setOriginalFile(file);
      setOriginalUrl(URL.createObjectURL(file));
      setRestoredUrl(null);
      setError(null);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: (acceptedFiles: File[]) => onDrop(acceptedFiles),
    accept: { 'image/*': [] },
    multiple: false
  } as any);

  const handleRestore = async () => {
    if (!originalFile) return;

    setIsRestoring(true);
    setError(null);
    let interval = setInterval(() => {
      setLoadingStep(prev => (prev + 1) % LOADING_MESSAGES.length);
    }, 2000);

    try {
      const base64 = await fileToBase64(originalFile);
      
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: {
          parts: [
            {
              inlineData: {
                data: base64,
                mimeType: originalFile.type,
              },
            },
            {
              text: "Restore this photo to perfect, brand-new quality. Remove all scratches, dust, noise, and physical damage. Significantly enhance sharpness, depth, and color while strictly preserving the identity of people, the composition, and all original details. The goal is a professional, high-definition version of the original. Output only the restored image part.",
            },
          ],
        },
      });

      const candidate = response.candidates?.[0];
      const imagePart = candidate?.content?.parts?.find(p => p.inlineData);

      if (imagePart?.inlineData?.data) {
        setRestoredUrl(`data:${imagePart.inlineData.mimeType};base64,${imagePart.inlineData.data}`);
      } else {
        throw new Error("Could not generate restored image. Please try again with a clearer photo.");
      }
    } catch (err: any) {
      console.error(err);
      setError(err?.message || "Restoration failed. Please check your connection or try again.");
    } finally {
      clearInterval(interval);
      setIsRestoring(false);
    }
  };

  const handleDownload = () => {
    if (!restoredUrl) return;
    const link = document.createElement('a');
    link.href = restoredUrl;
    link.download = `restored-${originalFile?.name || 'photo.png'}`;
    link.click();
  };

  const handleReset = () => {
    setOriginalFile(null);
    setOriginalUrl(null);
    setRestoredUrl(null);
    setError(null);
  };

  return (
    <div className="min-h-screen bg-[#050505] text-zinc-100 font-sans selection:bg-indigo-500/30">
      {/* Background Glow */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-[20%] -left-[10%] w-[50%] h-[50%] bg-indigo-500/10 blur-[120px] rounded-full" />
        <div className="absolute top-[40%] -right-[10%] w-[40%] h-[40%] bg-purple-500/10 blur-[120px] rounded-full" />
      </div>

      <main className="relative max-w-6xl mx-auto px-6 py-12 md:py-20 flex flex-col items-center">
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-semibold uppercase tracking-widest mb-6">
            <Sparkles className="w-3 h-3" />
            AI Restoration Pro
          </div>
          <h1 className="text-5xl md:text-7xl font-display font-bold tracking-tight mb-6 bg-gradient-to-b from-white to-zinc-400 bg-clip-text text-transparent">
            Revive Your <span className="text-indigo-400">Memories</span>
          </h1>
          <p className="text-zinc-400 text-lg md:text-xl max-w-2xl mx-auto leading-relaxed">
            Transform old, damaged, or blurry photos into high-definition brand-new images. 
            One click to bring the past back to life.
          </p>
        </motion.div>

        {/* Action Area */}
        <div className="w-full">
          <AnimatePresence mode="wait">
            {!originalUrl ? (
              <motion.div
                key="upload"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                {...getRootProps()}
                className={`
                  relative group cursor-pointer w-full aspect-[16/9] md:aspect-[21/9] 
                  flex flex-col items-center justify-center rounded-3xl border-2 border-dashed
                  transition-all duration-300 overflow-hidden
                  ${isDragActive ? 'border-indigo-500 bg-indigo-500/5' : 'border-zinc-800 hover:border-zinc-700 bg-zinc-900/30'}
                `}
              >
                <input {...getInputProps()} />
                <div className="relative z-10 flex flex-col items-center gap-6 p-12 text-center">
                  <div className="w-20 h-20 rounded-2xl bg-zinc-800 flex items-center justify-center group-hover:bg-indigo-600 group-hover:text-white transition-all duration-300 shadow-2xl">
                    <Upload className="w-10 h-10" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-semibold mb-2">Drop your photo here</h3>
                    <p className="text-zinc-500">Supports JPG, PNG, WEBP (Max 10MB)</p>
                  </div>
                  <div className="flex items-center gap-2 px-6 py-3 rounded-full bg-white text-black font-semibold shadow-xl group-hover:bg-indigo-50 hover:scale-105 transition-all">
                    Select from device
                    <ChevronRight className="w-4 h-4" />
                  </div>
                </div>
                {/* Decorative Grid */}
                <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:20px_20px]" />
              </motion.div>
            ) : (
              <motion.div
                key="workspace"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="w-full space-y-8"
              >
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 items-start">
                  {/* Sidebar Info */}
                  <div className="lg:col-span-1 space-y-6">
                    <div className="p-6 rounded-2xl bg-zinc-900/50 border border-zinc-800/50 backdrop-blur-sm">
                      <h4 className="text-sm font-semibold text-zinc-300 uppercase tracking-wider mb-4 flex items-center gap-2">
                        <Upload className="w-4 h-4 text-indigo-400" />
                        Original File
                      </h4>
                      <div className="flex items-center gap-4 mb-6">
                        <div className="w-12 h-12 rounded-lg overflow-hidden bg-zinc-800 flex-shrink-0">
                          <img src={originalUrl} alt="Snippet" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium truncate text-zinc-200">{originalFile?.name}</p>
                          <p className="text-xs text-zinc-500">{(originalFile?.size || 0 / 1024 / 1024).toFixed(2)} MB</p>
                        </div>
                      </div>
                      
                      <div className="space-y-4">
                        <div className="flex items-center gap-2 text-sm text-zinc-400">
                          <ShieldCheck className="w-4 h-4 text-green-500" />
                          Privacy Protected
                        </div>
                        <div className="flex items-center gap-2 text-sm text-zinc-400">
                          <CheckCircle2 className="w-4 h-4 text-green-500" />
                          Face Restoration Enabled
                        </div>
                      </div>
                    </div>

                    {!restoredUrl && !isRestoring && (
                      <button
                        onClick={handleRestore}
                        className="w-full group relative flex items-center justify-center gap-3 py-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-bold shadow-[0_0_40px_-10px_rgba(79,70,229,0.4)] transition-all"
                      >
                        <Sparkles className="w-5 h-5 group-hover:rotate-12 transition-transform" />
                        Restore Now
                      </button>
                    )}

                    {restoredUrl && (
                      <div className="flex flex-col gap-3">
                        <button
                          onClick={handleDownload}
                          className="w-full flex items-center justify-center gap-3 py-4 bg-white text-black hover:bg-zinc-200 rounded-2xl font-bold transition-all shadow-xl"
                        >
                          <Download className="w-5 h-5" />
                          Download Result
                        </button>
                        <button
                          onClick={handleReset}
                          className="w-full flex items-center justify-center gap-3 py-4 bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-2xl font-semibold transition-all"
                        >
                          <RefreshCcw className="w-5 h-5" />
                          Try Another
                        </button>
                      </div>
                    )}

                    {error && (
                      <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm flex items-start gap-3">
                        <AlertCircle className="w-5 h-5 flex-shrink-0" />
                        <p>{error}</p>
                      </div>
                    )}
                  </div>

                  {/* Main Viewer */}
                  <div className="lg:col-span-3">
                    <div className="relative">
                      {isRestoring ? (
                        <div className="w-full aspect-square md:aspect-video rounded-3xl bg-zinc-900 border border-zinc-800 flex flex-col items-center justify-center gap-8 p-12 overflow-hidden">
                          <div className="relative">
                            <div className="absolute inset-0 bg-indigo-500/20 blur-3xl rounded-full animate-pulse" />
                            <RefreshCcw className="w-16 h-16 text-indigo-500 animate-spin transition-all" />
                          </div>
                          <div className="text-center space-y-2">
                            <motion.p 
                              key={loadingStep}
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              className="text-2xl font-semibold text-white"
                            >
                              {LOADING_MESSAGES[loadingStep]}
                            </motion.p>
                            <p className="text-zinc-500">This usually takes about 10-20 seconds...</p>
                          </div>
                          {/* Progress Bar Mock */}
                          <div className="w-full max-w-sm h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                            <motion.div 
                              className="h-full bg-indigo-500"
                              initial={{ width: "0%" }}
                              animate={{ width: "100%" }}
                              transition={{ duration: 15, ease: "linear" }}
                            />
                          </div>
                        </div>
                      ) : restoredUrl ? (
                        <ComparisonSlider beforeImage={originalUrl} afterImage={restoredUrl} />
                      ) : (
                        <div className="relative w-full aspect-square md:aspect-video rounded-3xl overflow-hidden group">
                           <img 
                            src={originalUrl} 
                            alt="Preview" 
                            className="w-full h-full object-contain bg-zinc-900 blur-[2px] transition-all duration-700 group-hover:blur-0"
                            referrerPolicy="no-referrer"
                          />
                          <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                             <div className="bg-white/10 backdrop-blur-xl border border-white/20 p-8 rounded-3xl text-center">
                               <ImageIcon className="w-12 h-12 text-white/50 mx-auto mb-4" />
                               <p className="text-xl font-semibold text-white">Photo Ready</p>
                               <p className="text-white/60 mb-6 font-medium">Click "Restore Now" to see the magic</p>
                               <button
                                  onClick={handleRestore}
                                  className="px-8 py-3 bg-white text-black font-bold rounded-xl hover:scale-105 transition-all shadow-2xl"
                                >
                                  Begin Restoration
                                </button>
                             </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Feature Grid */}
        <section className="mt-32 w-full grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="p-8 rounded-3xl bg-zinc-900/40 border border-zinc-800 hover:bg-zinc-900/60 transition-colors">
              <div className="w-12 h-12 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-400 mb-6">
                <Sparkles className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold mb-3">AI Defector Reconstruction</h3>
              <p className="text-zinc-500 leading-relaxed">
                Advanced neural networks reconstruct missing parts of photos damaged by time, light, or water.
              </p>
            </div>
            <div className="p-8 rounded-3xl bg-zinc-900/40 border border-zinc-800 hover:bg-zinc-900/60 transition-colors">
              <div className="w-12 h-12 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-400 mb-6">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold mb-3">Face Restoration</h3>
              <p className="text-zinc-500 leading-relaxed">
                Specifically optimized for portraits. Blurry or low-res faces become sharp and detailed effortlessly.
              </p>
            </div>
            <div className="p-8 rounded-3xl bg-zinc-900/40 border border-zinc-800 hover:bg-zinc-900/60 transition-colors">
              <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-400 mb-6">
                <RefreshCcw className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold mb-3">Color Revival</h3>
              <p className="text-zinc-500 leading-relaxed">
                Faded blacks and whites or sepia tones are enhanced to rich, vibrant, modern color palettes.
              </p>
            </div>
        </section>

        {/* Footer */}
        <footer className="mt-40 pt-12 border-t border-zinc-900 w-full text-center text-zinc-600">
          <p>© 2026 Revive AI. All rights reserved. Powered by Gemini 2.5 Flash.</p>
        </footer>
      </main>
    </div>
  );
}
