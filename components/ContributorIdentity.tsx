'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CONTRIBUTOR_COLORS, generateId, Contributor } from '@/lib/types';
import { Check } from 'lucide-react';

export function useContributor() {
  const [contributor, setContributor] = useState<Contributor | null>(null);
  
  useEffect(() => {
    const id = localStorage.getItem('contributor-id');
    const name = localStorage.getItem('contributor-name');
    const color = localStorage.getItem('contributor-color');
    const isSubject = localStorage.getItem('contributor-is-subject') === 'true';
    
    if (id && name && color) {
      setContributor({ id, name, color, isSubject, lastSeen: Date.now(), isOnline: true });
    }
  }, []);
  
  return contributor;
}

export function ContributorIdentity({ onComplete }: { onComplete: (c: Contributor) => void }) {
  const [isOpen, setIsOpen] = useState(false);
  const [name, setName] = useState('');
  const [isSubject, setIsSubject] = useState(false);
  const [color, setColor] = useState<string>(CONTRIBUTOR_COLORS[0]);

  useEffect(() => {
    const id = localStorage.getItem('contributor-id');
    const storedName = localStorage.getItem('contributor-name');
    const storedColor = localStorage.getItem('contributor-color');
    const storedIsSubject = localStorage.getItem('contributor-is-subject') === 'true';

    if (id && storedName && storedColor) {
      onComplete({ id, name: storedName, color: storedColor, isSubject: storedIsSubject, lastSeen: Date.now(), isOnline: true });
    } else {
      setIsOpen(true);
    }
  }, [onComplete]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    
    const id = generateId();
    localStorage.setItem('contributor-id', id);
    localStorage.setItem('contributor-name', name);
    localStorage.setItem('contributor-color', color);
    localStorage.setItem('contributor-is-subject', isSubject.toString());
    
    const newContributor: Contributor = { id, name, color, isSubject, lastSeen: Date.now(), isOnline: true };
    setIsOpen(false);
    onComplete(newContributor);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm"
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 20 }}
            className="w-full max-w-md glass-card p-8 shadow-2xl"
          >
            <h2 className="text-3xl font-serif font-semibold text-foreground mb-2">Welcome to the Story</h2>
            <p className="text-muted-foreground mb-6 text-sm">
              Before you join this collaborative memory timeline, please introduce yourself.
            </p>
            
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <label htmlFor="name" className="text-sm font-medium text-foreground">
                  Your Display Name
                </label>
                <input
                  id="name"
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Aunt Sarah"
                  className="w-full px-4 py-2 rounded-lg bg-background border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                />
              </div>

              <div className="space-y-3">
                <label className="text-sm font-medium text-foreground">
                  Pick a Color
                </label>
                <div className="flex flex-wrap gap-3">
                  {CONTRIBUTOR_COLORS.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setColor(c)}
                      className="w-8 h-8 rounded-full flex items-center justify-center transition-transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-background"
                      style={{ backgroundColor: c }}
                      aria-label={`Select color ${c}`}
                    >
                      {color === c && <Check className="w-4 h-4 text-white drop-shadow-md" />}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center space-x-3 pt-2">
                <input
                  id="isSubject"
                  type="checkbox"
                  checked={isSubject}
                  onChange={(e) => setIsSubject(e.target.checked)}
                  className="w-4 h-4 rounded border-border text-primary focus:ring-primary/50"
                />
                <label htmlFor="isSubject" className="text-sm text-foreground">
                  I am the subject of this story
                </label>
              </div>

              <button
                type="submit"
                disabled={!name.trim()}
                className="w-full py-3 px-4 bg-primary text-primary-foreground font-medium rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Join Timeline
              </button>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
