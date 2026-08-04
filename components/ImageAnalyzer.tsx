'use client';

import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Upload, Loader2, Camera, Sparkles } from 'lucide-react';
import { analyzeImage } from '@/lib/gemini';
import Image from 'next/image';

interface ImageAnalyzerProps {
  isOpen: boolean;
  onClose: () => void;
  onResult: (result: { title: string; description: string; date: string }) => void;
}

export default function ImageAnalyzer({ isOpen, onClose, onResult }: ImageAnalyzerProps) {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64 = (reader.result as string).split(',')[1];
      setPreview(reader.result as string);
      setIsAnalyzing(true);

      try {
        const result = await analyzeImage(base64, file.type);
        onResult({
          title: result.title,
          description: result.description,
          date: result.suggestedDate || 'Unknown Date'
        });
        setTimeout(() => {
          onClose();
          setPreview(null);
        }, 1500);
      } catch (error) {
        console.error("Analysis error:", error);
      } finally {
        setIsAnalyzing(false);
      }
    };
    reader.readAsDataURL(file);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-background/80 backdrop-blur-sm"
          />
          
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="relative w-full max-w-md glass-card p-8 shadow-2xl"
          >
            <button 
              onClick={onClose}
              className="absolute right-4 top-4 p-2 hover:bg-secondary rounded-full transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="text-center space-y-4">
              <div className="w-16 h-16 bg-primary/20 rounded-2xl flex items-center justify-center mx-auto">
                <Camera className="w-8 h-8 text-primary" />
              </div>
              <h2 className="text-2xl font-serif font-bold">Analyze a Memory</h2>
              <p className="text-muted-foreground">
                Upload a photo from your past, and I&apos;ll help you describe it for your timeline.
              </p>

              <div className="mt-8">
                {preview ? (
                  <div className="relative aspect-video rounded-xl overflow-hidden border border-border">
                    <Image 
                      src={preview} 
                      alt="Preview" 
                      fill 
                      className="object-cover"
                      referrerPolicy="no-referrer"
                    />
                    {isAnalyzing && (
                      <div className="absolute inset-0 bg-background/60 backdrop-blur-sm flex flex-col items-center justify-center space-y-2">
                        <Loader2 className="w-8 h-8 animate-spin text-primary" />
                        <p className="text-sm font-medium flex items-center gap-2">
                          <Sparkles className="w-4 h-4 text-accent" />
                          Analyzing memory...
                        </p>
                      </div>
                    )}
                  </div>
                ) : (
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full aspect-video border-2 border-dashed border-border rounded-xl flex flex-col items-center justify-center space-y-2 hover:border-primary/50 hover:bg-primary/5 transition-all group"
                  >
                    <Upload className="w-8 h-8 text-muted-foreground group-hover:text-primary transition-colors" />
                    <span className="text-sm font-medium">Click to upload photo</span>
                  </button>
                )}
              </div>
            </div>

            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept="image/*"
              className="hidden"
            />
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
