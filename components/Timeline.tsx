'use client';

import React, { useState } from 'react';
import { motion, Reorder, useDragControls } from 'motion/react';
import { Calendar, GripVertical, Trash2, Milestone, ImagePlus, MessageCircle, History, ChevronDown, ChevronUp } from 'lucide-react';
import type { LifeEvent, EventComment, EventPhoto, Correction } from '@/lib/types';
import { generateId } from '@/lib/types';

interface TimelineProps {
  events: LifeEvent[];
  onReorder: (newEvents: LifeEvent[]) => void;
  onDelete: (id: string) => void;
  onUpdate: (event: LifeEvent) => void;
  onAddComment?: (eventId: string, comment: EventComment) => void;
  onAddPhoto?: (eventId: string, photo: EventPhoto) => void;
  onAddCorrection?: (eventId: string, correction: Correction) => void;
  contributorName?: string;
  contributorColor?: string;
}

export default function Timeline({ 
  events, onReorder, onDelete, onUpdate, 
  onAddComment, onAddPhoto, onAddCorrection,
  contributorName, contributorColor 
}: TimelineProps) {
  return (
    <div className="relative h-full overflow-y-auto px-4 py-8">
      {/* Central Line */}
      <div className="absolute left-1/2 top-0 bottom-0 w-0.5 timeline-line -translate-x-1/2 hidden md:block" />

      <div className="max-w-4xl mx-auto relative">
        {events.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-muted-foreground space-y-4">
            <Milestone className="w-12 h-12 opacity-20" />
            <p className="font-serif text-lg italic text-center">
              Your story is waiting to be told.<br/>
              Share a memory with the biographer to start your timeline.
            </p>
          </div>
        ) : (
          <Reorder.Group 
            axis="y" 
            values={events} 
            onReorder={onReorder}
            className="space-y-8"
          >
            {events.map((event, index) => (
              <TimelineItem 
                key={event.id} 
                event={event} 
                index={index} 
                onDelete={onDelete}
                onUpdate={onUpdate}
                onAddComment={onAddComment}
                onAddPhoto={onAddPhoto}
                onAddCorrection={onAddCorrection}
                contributorName={contributorName}
                contributorColor={contributorColor}
              />
            ))}
          </Reorder.Group>
        )}
      </div>
    </div>
  );
}

function TimelineItem({ 
  event, index, onDelete, onUpdate,
  onAddComment, onAddPhoto, onAddCorrection,
  contributorName, contributorColor
}: { 
  event: LifeEvent; 
  index: number; 
  onDelete: (id: string) => void; 
  onUpdate: (event: LifeEvent) => void;
  onAddComment?: (eventId: string, comment: EventComment) => void;
  onAddPhoto?: (eventId: string, photo: EventPhoto) => void;
  onAddCorrection?: (eventId: string, correction: Correction) => void;
  contributorName?: string;
  contributorColor?: string;
}) {
  const controls = useDragControls();
  const isEven = index % 2 === 0;
  const [isEditingDate, setIsEditingDate] = useState(false);
  const [tempDate, setTempDate] = useState(event.date);
  const [showComments, setShowComments] = useState(false);
  const [commentInput, setCommentInput] = useState('');
  const [isCorrection, setIsCorrection] = useState(false);

  const correctionCount = event.corrections?.length || 0;
  const commentCount = event.comments?.length || 0;
  const photoCount = event.photos?.length || 0;

  const handleDateSubmit = () => {
    setIsEditingDate(false);
    if (tempDate !== event.date) {
      // Track correction
      if (onAddCorrection && contributorName) {
        onAddCorrection(event.id, {
          contributorName,
          contributorColor: contributorColor || '#888',
          field: 'date',
          oldValue: event.date,
          newValue: tempDate,
          timestamp: Date.now(),
        });
      }
      onUpdate({ ...event, date: tempDate });
    }
  };

  const handleAddComment = () => {
    if (!commentInput.trim() || !onAddComment || !contributorName) return;
    
    const comment: EventComment = {
      id: generateId(),
      contributorName,
      contributorColor: contributorColor || '#888',
      content: commentInput.trim(),
      timestamp: Date.now(),
      isCorrection,
    };
    onAddComment(event.id, comment);
    setCommentInput('');
    setIsCorrection(false);
  };

  const handlePhotoUpload = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file || !onAddPhoto || !contributorName) return;
      
      const reader = new FileReader();
      reader.onloadend = () => {
        const photo: EventPhoto = {
          id: generateId(),
          dataUrl: reader.result as string,
          uploadedBy: contributorName,
          uploadedByColor: contributorColor || '#888',
          timestamp: Date.now(),
        };
        onAddPhoto(event.id, photo);
      };
      reader.readAsDataURL(file);
    };
    input.click();
  };

  return (
    <Reorder.Item
      value={event}
      dragListener={false}
      dragControls={controls}
      initial={{ opacity: 0, x: isEven ? -50 : 50 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, scale: 0.8 }}
      className="relative w-full flex md:justify-center"
    >
      {/* Connector Dot */}
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-primary border-4 border-background z-10 hidden md:block" />

      <div className={`w-full md:w-5/12 ${isEven ? 'md:mr-auto md:pr-8' : 'md:ml-auto md:pl-8'}`}>
        <motion.div 
          whileHover={{ scale: 1.02 }}
          className="glass-card p-6 relative group"
        >
          {/* Header: date + actions */}
          <div className="flex justify-between items-start mb-2">
            <div className="flex items-center gap-2 text-accent font-medium text-sm">
              <Calendar className="w-4 h-4" />
              {isEditingDate ? (
                <input
                  type="text"
                  value={tempDate}
                  onChange={(e) => setTempDate(e.target.value)}
                  onBlur={handleDateSubmit}
                  onKeyDown={(e) => e.key === 'Enter' && handleDateSubmit()}
                  className="bg-background border border-border rounded px-1 py-0.5 text-xs focus:outline-none focus:ring-1 focus:ring-primary w-24"
                  autoFocus
                />
              ) : (
                <span 
                  onClick={() => { setIsEditingDate(true); setTempDate(event.date); }}
                  className="cursor-pointer hover:underline decoration-dotted underline-offset-4"
                  title="Click to edit date"
                >
                  {event.date}
                </span>
              )}

              {/* Correction count badge */}
              {correctionCount > 0 && (
                <span 
                  className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/20"
                  title={`This event has been corrected ${correctionCount} time${correctionCount !== 1 ? 's' : ''}`}
                >
                  <History className="w-2.5 h-2.5" />
                  {correctionCount}
                </span>
              )}
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={handlePhotoUpload}
                className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:text-primary text-muted-foreground"
                title="Add photo evidence"
              >
                <ImagePlus className="w-4 h-4" />
              </button>
              <button
                onClick={() => setShowComments(!showComments)}
                className={`p-1 transition-all ${showComments || commentCount > 0 ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'} ${showComments ? 'text-primary' : 'hover:text-primary text-muted-foreground'}`}
                title={`${commentCount} comment${commentCount !== 1 ? 's' : ''}`}
              >
                <div className="relative">
                  <MessageCircle className="w-4 h-4" />
                  {commentCount > 0 && (
                    <span className="absolute -top-1.5 -right-1.5 w-3.5 h-3.5 rounded-full bg-primary text-primary-foreground text-[8px] font-bold flex items-center justify-center">
                      {commentCount}
                    </span>
                  )}
                </div>
              </button>
              <button
                onClick={() => onDelete(event.id)}
                className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:text-red-400"
              >
                <Trash2 className="w-4 h-4" />
              </button>
              <div 
                onPointerDown={(e) => controls.start(e)}
                className="cursor-grab active:cursor-grabbing p-1 text-muted-foreground hover:text-foreground"
              >
                <GripVertical className="w-4 h-4" />
              </div>
            </div>
          </div>
          
          {/* Contributor badge */}
          {event.contributedBy && (
            <div className="flex items-center gap-1.5 mb-2">
              <span 
                className="w-2.5 h-2.5 rounded-full shrink-0"
                style={{ backgroundColor: event.contributorColor || '#888' }}
              />
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                {event.contributedBy}
              </span>
            </div>
          )}

          <h3 className="font-serif text-xl font-bold mb-2 text-primary">{event.title}</h3>
          <p className="text-sm text-muted-foreground leading-relaxed">
            {event.description}
          </p>

          {/* Photo strip */}
          {photoCount > 0 && (
            <div className="flex items-center gap-2 mt-3 pt-3 border-t border-border/50">
              {event.photos!.slice(0, 3).map((photo) => (
                <div 
                  key={photo.id}
                  className="w-14 h-14 rounded-lg overflow-hidden border border-border bg-secondary shrink-0 cursor-pointer hover:scale-105 transition-transform"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img 
                    src={photo.dataUrl} 
                    alt={photo.caption || 'Event photo'} 
                    className="w-full h-full object-cover"
                  />
                </div>
              ))}
              {photoCount > 3 && (
                <span className="text-xs text-muted-foreground font-medium">
                  +{photoCount - 3} more
                </span>
              )}
            </div>
          )}

          {/* Comments section */}
          {showComments && (
            <div className="mt-3 pt-3 border-t border-border/50 space-y-2">
              {/* Correction history */}
              {correctionCount > 0 && (
                <div className="space-y-1 mb-2">
                  <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider flex items-center gap-1">
                    <History className="w-3 h-3" />
                    Correction History
                  </span>
                  {event.corrections!.map((c, i) => (
                    <div key={i} className="text-[11px] text-muted-foreground pl-4 border-l-2 border-amber-500/30">
                      <span className="font-bold" style={{ color: c.contributorColor }}>
                        {c.contributorName}
                      </span>
                      {' '}changed {c.field} from &ldquo;{c.oldValue}&rdquo; to &ldquo;{c.newValue}&rdquo;
                    </div>
                  ))}
                </div>
              )}

              {/* Comment thread */}
              {event.comments?.map((comment) => (
                <div key={comment.id} className={`text-sm p-2 rounded-lg ${comment.isCorrection ? 'bg-amber-500/10 border border-amber-500/20' : 'bg-secondary/50'}`}>
                  <div className="flex items-center gap-1.5 mb-1">
                    <span 
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: comment.contributorColor }}
                    />
                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                      {comment.contributorName}
                    </span>
                    {comment.isCorrection && (
                      <span className="text-[9px] font-bold text-amber-600 dark:text-amber-400 uppercase">correction</span>
                    )}
                  </div>
                  <p className="text-sm text-foreground">{comment.content}</p>
                </div>
              ))}

              {/* Add comment form */}
              {contributorName && (
                <div className="space-y-2 pt-1">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={commentInput}
                      onChange={(e) => setCommentInput(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleAddComment()}
                      placeholder="Add a comment..."
                      className="flex-1 bg-background border border-border rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-primary/50"
                    />
                    <button
                      onClick={handleAddComment}
                      disabled={!commentInput.trim()}
                      className="px-3 py-1.5 bg-primary text-primary-foreground rounded-lg text-xs font-medium disabled:opacity-50 hover:scale-105 active:scale-95 transition-all"
                    >
                      Post
                    </button>
                  </div>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isCorrection}
                      onChange={(e) => setIsCorrection(e.target.checked)}
                      className="rounded accent-amber-500"
                    />
                    <span className="text-[11px] text-muted-foreground">This is a correction</span>
                  </label>
                </div>
              )}
            </div>
          )}

          {/* Mobile indicator */}
          <div className="absolute -left-3 top-1/2 -translate-y-1/2 w-1.5 h-8 bg-primary rounded-full md:hidden" />
        </motion.div>
      </div>
    </Reorder.Item>
  );
}

// Re-export the type for backward compatibility
export type { LifeEvent } from '@/lib/types';
