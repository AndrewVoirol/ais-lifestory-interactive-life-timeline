'use client';

import { motion, AnimatePresence } from 'motion/react';
import { Contributor } from '@/lib/types';
import { X, Star, Circle } from 'lucide-react';

interface ContributorPanelProps {
  isOpen: boolean;
  onClose: () => void;
  contributors: Contributor[];
  currentUserId: string;
}

export function ContributorPanel({
  isOpen,
  onClose,
  contributors,
  currentUserId
}: ContributorPanelProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-40 bg-background/50 backdrop-blur-sm"
          />
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed inset-y-0 right-0 z-50 w-full max-w-sm glass-card border-r-0 rounded-r-none border-t-0 border-b-0 shadow-2xl flex flex-col"
          >
            <div className="flex items-center justify-between p-6 border-b border-border/50">
              <h2 className="text-2xl font-serif font-semibold text-foreground">
                Contributors
              </h2>
              <button
                onClick={onClose}
                className="p-2 rounded-full hover:bg-secondary transition-colors text-muted-foreground hover:text-foreground"
                aria-label="Close panel"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {contributors.length === 0 ? (
                <p className="text-muted-foreground text-sm text-center py-8">
                  No other contributors yet.
                </p>
              ) : (
                <ul className="space-y-4">
                  {contributors.map((contributor) => {
                    const isMe = contributor.id === currentUserId;
                    return (
                      <li key={contributor.id} className="flex items-center space-x-4">
                        <div className="relative">
                          <div 
                            className="w-10 h-10 rounded-full flex items-center justify-center text-white font-medium shadow-sm"
                            style={{ backgroundColor: contributor.color }}
                          >
                            {contributor.name.charAt(0).toUpperCase()}
                          </div>
                          <div 
                            className={`absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full border-2 border-card ${contributor.isOnline ? 'bg-green-500' : 'bg-muted'}`}
                            title={contributor.isOnline ? 'Online' : 'Offline'}
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-2">
                            <span className="font-medium text-foreground truncate">
                              {contributor.name}
                            </span>
                            {isMe && (
                              <span className="px-2 py-0.5 rounded-full bg-secondary text-secondary-foreground text-[10px] font-medium uppercase tracking-wider">
                                You
                              </span>
                            )}
                          </div>
                          {contributor.isSubject && (
                            <div className="flex items-center text-xs text-muted-foreground mt-0.5">
                              <Star className="w-3 h-3 mr-1 fill-amber-400 text-amber-400" />
                              Subject
                            </div>
                          )}
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
