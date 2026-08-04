'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { EventComment, Correction } from '@/lib/types';
import { MessageSquare, AlertCircle, ChevronDown, ChevronUp, Send, History } from 'lucide-react';

interface EventCommentsProps {
  comments?: EventComment[];
  corrections?: Correction[];
  onAddComment: (content: string, isCorrection: boolean) => void;
  contributorName: string;
  contributorColor: string;
}

export function EventComments({
  comments = [],
  corrections = [],
  onAddComment,
  contributorName,
  contributorColor
}: EventCommentsProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [isCorrectionToggle, setIsCorrectionToggle] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    onAddComment(newComment.trim(), isCorrectionToggle);
    setNewComment('');
    setIsCorrectionToggle(false);
  };

  const hasContent = comments.length > 0 || corrections.length > 0;
  
  return (
    <div className="mt-4 border-t border-border/50 pt-3">
      <button 
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center text-xs font-medium text-muted-foreground hover:text-foreground transition-colors group"
      >
        <MessageSquare className="w-3.5 h-3.5 mr-1.5 group-hover:text-primary transition-colors" />
        {comments.length} {comments.length === 1 ? 'comment' : 'comments'}
        {corrections.length > 0 && (
          <span className="flex items-center ml-3 text-amber-600/80 dark:text-amber-400/80">
            <History className="w-3.5 h-3.5 mr-1" />
            Corrected {corrections.length} {corrections.length === 1 ? 'time' : 'times'}
          </span>
        )}
        {isExpanded ? (
          <ChevronUp className="w-3.5 h-3.5 ml-1.5 opacity-50" />
        ) : (
          <ChevronDown className="w-3.5 h-3.5 ml-1.5 opacity-50" />
        )}
      </button>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="pt-4 space-y-4">
              {hasContent && (
                <div className="space-y-3 max-h-60 overflow-y-auto pr-2">
                  {[...comments, ...corrections]
                    .sort((a, b) => a.timestamp - b.timestamp)
                    .map((item, i) => {
                      const isCorrection = 'field' in item || item.isCorrection;
                      const name = item.contributorName;
                      const color = item.contributorColor;
                      
                      return (
                        <div 
                          key={'id' in item ? item.id : `corr-${i}`} 
                          className={`text-sm p-3 rounded-lg flex space-x-3 ${isCorrection ? 'bg-amber-500/10 border border-amber-500/20' : 'bg-secondary/50'}`}
                        >
                          <div 
                            className="w-6 h-6 rounded-full shrink-0 flex items-center justify-center text-[10px] text-white font-medium shadow-sm mt-0.5"
                            style={{ backgroundColor: color }}
                          >
                            {name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="flex items-center space-x-2 mb-1">
                              <span className="font-medium text-foreground">{name}</span>
                              {isCorrection && (
                                <span className="flex items-center text-[10px] text-amber-600 dark:text-amber-400 uppercase tracking-wide font-semibold">
                                  <AlertCircle className="w-3 h-3 mr-0.5" />
                                  Correction
                                </span>
                              )}
                            </div>
                            <p className="text-muted-foreground">
                              {'content' in item ? item.content : `Changed ${item.field} from "${item.oldValue}" to "${item.newValue}"`}
                            </p>
                          </div>
                        </div>
                      );
                  })}
                </div>
              )}

              <form onSubmit={handleSubmit} className="flex items-start space-x-2 mt-2">
                <div className="flex-1">
                  <input
                    type="text"
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Add a comment..."
                    className="w-full text-sm px-3 py-2 rounded-lg bg-background border border-border text-foreground focus:outline-none focus:ring-1 focus:ring-primary/50 transition-all placeholder:text-muted-foreground/60"
                  />
                  <div className="flex items-center mt-2 ml-1">
                    <input
                      id="isCorrectionToggle"
                      type="checkbox"
                      checked={isCorrectionToggle}
                      onChange={(e) => setIsCorrectionToggle(e.target.checked)}
                      className="w-3.5 h-3.5 rounded border-border text-amber-500 focus:ring-amber-500/50"
                    />
                    <label htmlFor="isCorrectionToggle" className="text-xs text-muted-foreground ml-1.5 cursor-pointer">
                      Mark as correction/dispute
                    </label>
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={!newComment.trim()}
                  className="p-2 rounded-lg bg-primary text-primary-foreground hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
