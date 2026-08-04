'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { EventPhoto } from '@/lib/types';
import { X, ChevronLeft, ChevronRight, Plus, Image as ImageIcon } from 'lucide-react';

interface PhotoStripProps {
  photos?: EventPhoto[];
  onAddPhoto?: () => void;
}

export function PhotoStrip({ photos = [], onAddPhoto }: PhotoStripProps) {
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [initialIndex, setInitialIndex] = useState(0);

  if (photos.length === 0 && !onAddPhoto) return null;

  const displayPhotos = photos.slice(0, 3);
  const remaining = photos.length - 3;

  return (
    <>
      <div className="flex items-center gap-2 mt-3 flex-wrap">
        {displayPhotos.map((photo, idx) => (
          <button
            key={photo.id}
            onClick={() => {
              setInitialIndex(idx);
              setLightboxOpen(true);
            }}
            className="relative w-16 h-16 rounded-lg overflow-hidden border border-border group focus:outline-none focus:ring-2 focus:ring-primary/50 shrink-0"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img 
              src={photo.dataUrl} 
              alt={photo.caption || "Event photo"} 
              className="w-full h-full object-cover transition-transform group-hover:scale-110"
            />
            {idx === 2 && remaining > 0 && (
              <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                <span className="text-white text-xs font-medium">+{remaining}</span>
              </div>
            )}
          </button>
        ))}
        
        {onAddPhoto && (
          <button
            onClick={onAddPhoto}
            className="w-16 h-16 rounded-lg border border-dashed border-border flex flex-col items-center justify-center text-muted-foreground hover:bg-secondary/50 hover:text-foreground transition-colors focus:outline-none focus:ring-2 focus:ring-primary/50 shrink-0"
          >
            <Plus className="w-4 h-4 mb-0.5" />
            <span className="text-[10px] font-medium">Photo</span>
          </button>
        )}
      </div>

      <PhotoLightbox 
        photos={photos}
        isOpen={lightboxOpen}
        onClose={() => setLightboxOpen(false)}
        initialIndex={initialIndex}
      />
    </>
  );
}

interface PhotoLightboxProps {
  photos: EventPhoto[];
  isOpen: boolean;
  onClose: () => void;
  initialIndex?: number;
}

export function PhotoLightbox({ photos, isOpen, onClose, initialIndex = 0 }: PhotoLightboxProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);

  useEffect(() => {
    if (isOpen) {
      setCurrentIndex(initialIndex);
    }
  }, [isOpen, initialIndex]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft') handlePrev();
      if (e.key === 'ArrowRight') handleNext();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, currentIndex]);

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : photos.length - 1));
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev < photos.length - 1 ? prev + 1 : 0));
  };

  if (!isOpen || photos.length === 0) return null;

  const currentPhoto = photos[currentIndex];

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] flex items-center justify-center bg-background/95 backdrop-blur-xl"
      >
        <button
          onClick={onClose}
          className="absolute top-6 right-6 p-2 text-muted-foreground hover:text-foreground rounded-full hover:bg-secondary/50 transition-colors z-10"
        >
          <X className="w-6 h-6" />
        </button>

        {photos.length > 1 && (
          <>
            <button
              onClick={handlePrev}
              className="absolute left-6 p-3 text-muted-foreground hover:text-foreground rounded-full hover:bg-secondary/50 transition-colors z-10"
            >
              <ChevronLeft className="w-8 h-8" />
            </button>
            <button
              onClick={handleNext}
              className="absolute right-6 p-3 text-muted-foreground hover:text-foreground rounded-full hover:bg-secondary/50 transition-colors z-10"
            >
              <ChevronRight className="w-8 h-8" />
            </button>
          </>
        )}

        <div className="relative max-w-4xl max-h-[85vh] w-full flex flex-col items-center px-16">
          <motion.div
            key={currentPhoto.id}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="relative"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={currentPhoto.dataUrl}
              alt={currentPhoto.caption || "Full screen photo"}
              className="max-w-full max-h-[70vh] object-contain rounded-lg shadow-2xl"
            />
          </motion.div>

          <div className="mt-6 flex flex-col items-center text-center space-y-2">
            {currentPhoto.caption && (
              <p className="text-foreground text-lg font-serif">
                {currentPhoto.caption}
              </p>
            )}
            <div className="flex items-center text-sm text-muted-foreground space-x-2">
              <ImageIcon className="w-4 h-4" />
              <span>Added by</span>
              <div className="flex items-center space-x-1.5 ml-1">
                <div 
                  className="w-4 h-4 rounded-full"
                  style={{ backgroundColor: currentPhoto.uploadedByColor }}
                />
                <span className="font-medium text-foreground">{currentPhoto.uploadedBy}</span>
              </div>
            </div>
            
            {photos.length > 1 && (
              <div className="text-xs text-muted-foreground/60 mt-4">
                {currentIndex + 1} of {photos.length}
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
