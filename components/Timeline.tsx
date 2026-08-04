'use client';

import React, { useState } from 'react';
import { motion, Reorder, useDragControls } from 'motion/react';
import { Calendar, GripVertical, Trash2, Milestone } from 'lucide-react';

export interface LifeEvent {
  id: string;
  title: string;
  description: string;
  date: string;
}

interface TimelineProps {
  events: LifeEvent[];
  onReorder: (newEvents: LifeEvent[]) => void;
  onDelete: (id: string) => void;
  onUpdate: (event: LifeEvent) => void;
}

export default function Timeline({ events, onReorder, onDelete, onUpdate }: TimelineProps) {
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
              />
            ))}
          </Reorder.Group>
        )}
      </div>
    </div>
  );
}

function TimelineItem({ event, index, onDelete, onUpdate }: { event: LifeEvent; index: number; onDelete: (id: string) => void; onUpdate: (event: LifeEvent) => void }) {
  const controls = useDragControls();
  const isEven = index % 2 === 0;
  const [isEditingDate, setIsEditingDate] = useState(false);
  const [tempDate, setTempDate] = useState(event.date);

  const handleDateSubmit = () => {
    setIsEditingDate(false);
    if (tempDate !== event.date) {
      onUpdate({ ...event, date: tempDate });
    }
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
                  onClick={() => setIsEditingDate(true)}
                  className="cursor-pointer hover:underline decoration-dotted underline-offset-4"
                  title="Click to edit date"
                >
                  {event.date}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
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
          
          <h3 className="font-serif text-xl font-bold mb-2 text-primary">{event.title}</h3>
          <p className="text-sm text-muted-foreground leading-relaxed">
            {event.description}
          </p>

          {/* Mobile indicator */}
          <div className="absolute -left-3 top-1/2 -translate-y-1/2 w-1.5 h-8 bg-primary rounded-full md:hidden" />
        </motion.div>
      </div>
    </Reorder.Item>
  );
}
