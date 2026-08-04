'use client';

import React, { useState, useCallback, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import Chat from '@/components/Chat';
import Timeline, { LifeEvent } from '@/components/Timeline';
import ImageAnalyzer from '@/components/ImageAnalyzer';
import ThemeToggle from '@/components/ThemeToggle';
import { BookOpen, History, Sparkles, Download, Users, Wifi, WifiOff } from 'lucide-react';
import confetti from 'canvas-confetti';

export default function Page() {
  const [events, setEvents] = useState<LifeEvent[]>([]);
  const [isImageAnalyzerOpen, setIsImageAnalyzerOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'chat' | 'timeline'>('chat');
  const [connectedUsers, setConnectedUsers] = useState(1);
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'connecting' | 'disconnected'>('connecting');
  const [retryTrigger, setRetryTrigger] = useState(0);
  const retryCountRef = useRef(0);
  const eventSourceRef = useRef<EventSource | null>(null);

  useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      if (event.message && event.message.includes('ChunkLoadError')) {
        console.warn('ChunkLoadError detected, reloading page...');
        window.location.reload();
      }
    };

    window.addEventListener('error', handleError);
    return () => window.removeEventListener('error', handleError);
  }, []);

  useEffect(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }

    const eventSource = new EventSource('/api/events');
    eventSourceRef.current = eventSource;

    eventSource.onopen = () => {
      setConnectionStatus('connected');
      retryCountRef.current = 0;
    };

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'init' || data.type === 'update') {
          setEvents(data.events);
        } else if (data.type === 'user-count') {
          setConnectedUsers(data.count);
        }
      } catch (e) {
        // Ignore non-JSON messages like keep-alive
      }
    };

    eventSource.onerror = (err) => {
      // EventSource error events are generic and don't contain detailed error info
      // ReadyState 2 means CLOSED. This is common during reloads or server restarts.
      // ReadyState 0 means CONNECTING. This happens if the connection drops and the browser is retrying.
      if (eventSource.readyState === 2) {
         console.log('SSE connection closed. Reconnecting...');
      } else if (eventSource.readyState === 0) {
         console.log('SSE connection lost. Retrying...');
      } else {
         console.error('SSE connection error. ReadyState:', eventSource.readyState);
      }
      
      eventSource.close();
      setConnectionStatus('disconnected');
      
      // Exponential backoff
      const timeout = Math.min(1000 * Math.pow(2, retryCountRef.current), 30000);
      retryCountRef.current += 1;
      
      console.log(`Reconnecting in ${timeout}ms...`);
      setTimeout(() => {
        setConnectionStatus('connecting');
        setRetryTrigger(prev => prev + 1);
      }, timeout);
    };

    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
    };
  }, [retryTrigger]);

  const syncEvent = async (type: 'add' | 'update' | 'delete' | 'reorder', payload: any) => {
    try {
      await fetch('/api/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, payload }),
      });
    } catch (e) {
      console.error('Failed to sync event', e);
    }
  };

  const handleEventDetected = useCallback((eventData: Omit<LifeEvent, 'id'>) => {
    const newEvent: LifeEvent = {
      ...eventData,
      id: Math.random().toString(36).substr(2, 9)
    };
    
    syncEvent('add', newEvent);

    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#3b82f6', '#f59e0b', '#10b981']
    });
  }, []);

  const handleReorder = (newEvents: LifeEvent[]) => {
    // Optimistic update
    setEvents(newEvents);
    // Send only IDs to server for safe reordering
    syncEvent('reorder', newEvents.map(e => e.id));
  };

  const handleEventUpdate = (updatedEvent: LifeEvent) => {
    // Optimistic update
    setEvents(prev => prev.map(e => e.id === updatedEvent.id ? updatedEvent : e));
    // Sync full list for update (simplest for now, could be optimized)
    const newEvents = events.map(e => e.id === updatedEvent.id ? updatedEvent : e);
    syncEvent('update', newEvents);
  };

  const handleDelete = (id: string) => {
    syncEvent('delete', id);
  };

  const exportTimeline = () => {
    const content = events.map(e => `${e.date}: ${e.title}\n${e.description}\n`).join('\n---\n\n');
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'my-life-story.txt';
    a.click();
  };

  return (
    <main className="min-h-screen bg-background text-foreground flex flex-col">
      {/* Header */}
      <header className="p-6 border-b border-border flex justify-between items-center bg-background/50 backdrop-blur-md sticky top-0 z-40">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center shadow-lg shadow-primary/20">
            <BookOpen className="text-primary-foreground w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-serif font-bold tracking-tight">LifeStory</h1>
            <p className="text-xs text-muted-foreground font-medium uppercase tracking-widest">Interactive Biographer</p>
          </div>
          <div className="hidden sm:flex items-center gap-2 px-3 py-1 bg-primary/10 rounded-full border border-primary/20 ml-4">
            <div className="relative">
              <Users className="w-3 h-3 text-primary" />
              {connectedUsers > 1 && (
                <span className="absolute -top-1 -right-1 w-2 h-2 bg-green-500 rounded-full animate-pulse border border-background" />
              )}
            </div>
            <span className="text-[10px] font-bold text-primary uppercase tracking-tighter">
              {connectedUsers > 1 ? `Collaborating (${connectedUsers} online)` : 'Live Session'}
            </span>
          </div>
          
          {/* Connection Status Indicator */}
          <div className={`flex items-center gap-1.5 px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-tighter transition-colors ${
            connectionStatus === 'connected' ? 'text-green-500 bg-green-500/10' : 
            connectionStatus === 'connecting' ? 'text-yellow-500 bg-yellow-500/10' : 
            'text-red-500 bg-red-500/10'
          }`}>
            {connectionStatus === 'connected' ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
            <span className="hidden md:inline">{connectionStatus}</span>
          </div>
          
          {/* Saved Indicator */}
          {connectionStatus === 'connected' && (
            <div className="flex items-center gap-1.5 px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-tighter text-muted-foreground bg-secondary/50">
              <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/50" />
              <span className="hidden md:inline">Saved</span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-4">
          <div className="hidden md:flex bg-secondary/50 p-1 rounded-full border border-border">
            <button 
              onClick={() => setActiveTab('chat')}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${activeTab === 'chat' ? 'bg-primary text-primary-foreground shadow-sm' : 'hover:text-primary'}`}
            >
              Interview
            </button>
            <button 
              onClick={() => setActiveTab('timeline')}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${activeTab === 'timeline' ? 'bg-primary text-primary-foreground shadow-sm' : 'hover:text-primary'}`}
            >
              Timeline ({events.length})
            </button>
          </div>
          
          {events.length > 0 && (
            <button 
              onClick={exportTimeline}
              className="p-2 hover:bg-secondary rounded-full transition-colors text-muted-foreground hover:text-foreground"
              title="Export Story"
            >
              <Download className="w-5 h-5" />
            </button>
          )}
          <ThemeToggle />
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden relative">
        {/* Desktop Layout: Side by Side */}
        <div className="hidden md:flex flex-1 overflow-hidden">
          <div className="w-1/3 p-6 border-r border-border bg-secondary/5">
            <Chat 
              onEventDetected={handleEventDetected} 
              onImageClick={() => setIsImageAnalyzerOpen(true)} 
              events={events}
              onEventUpdated={handleEventUpdate}
            />
          </div>
          <div className="flex-1 bg-background relative">
            <div className="absolute inset-0 opacity-5 pointer-events-none">
              <div className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, var(--color-border) 1px, transparent 0)', backgroundSize: '40px 40px' }} />
            </div>
            <Timeline 
              events={events} 
              onReorder={handleReorder} 
              onDelete={handleDelete} 
              onUpdate={handleEventUpdate}
            />
          </div>
        </div>

        {/* Mobile Layout: Tabbed */}
        <div className="md:hidden flex-1 flex flex-col overflow-hidden">
          <AnimatePresence mode="wait">
            {activeTab === 'chat' ? (
              <motion.div 
                key="chat"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="flex-1 p-4"
              >
                <Chat 
                  onEventDetected={handleEventDetected} 
                  onImageClick={() => setIsImageAnalyzerOpen(true)} 
                  events={events}
                  onEventUpdated={handleEventUpdate}
                />
              </motion.div>
            ) : (
              <motion.div 
                key="timeline"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="flex-1"
              >
                <Timeline 
                  events={events} 
                  onReorder={handleReorder} 
                  onDelete={handleDelete} 
                  onUpdate={handleEventUpdate}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Footer / Mobile Nav */}
      <div className="md:hidden p-4 border-t border-border bg-background/80 backdrop-blur-md flex justify-around items-center">
        <button 
          onClick={() => setActiveTab('chat')}
          className={`flex flex-col items-center gap-1 transition-colors ${activeTab === 'chat' ? 'text-primary' : 'text-muted-foreground'}`}
        >
          <Sparkles className="w-6 h-6" />
          <span className="text-[10px] font-bold uppercase tracking-tighter">Interview</span>
        </button>
        <button 
          onClick={() => setActiveTab('timeline')}
          className={`flex flex-col items-center gap-1 transition-colors ${activeTab === 'timeline' ? 'text-primary' : 'text-muted-foreground'}`}
        >
          <History className="w-6 h-6" />
          <span className="text-[10px] font-bold uppercase tracking-tighter">Timeline</span>
        </button>
      </div>

      <ImageAnalyzer 
        isOpen={isImageAnalyzerOpen} 
        onClose={() => setIsImageAnalyzerOpen(false)} 
        onResult={handleEventDetected}
      />
    </main>
  );
}
