'use client';

import React, { useState, useCallback, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import Chat from '@/components/Chat';
import Timeline from '@/components/Timeline';
import ImageAnalyzer from '@/components/ImageAnalyzer';
import ThemeToggle from '@/components/ThemeToggle';
import { ContributorIdentity } from '@/components/ContributorIdentity';
import { ContributorPanel } from '@/components/ContributorPanel';
import { BookOpen, History, Sparkles, Download, Users, Wifi, WifiOff, Share2, Copy, Check } from 'lucide-react';
import type { LifeEvent, Contributor, EventComment, EventPhoto, Correction } from '@/lib/types';
import { generateId } from '@/lib/types';
import { use } from 'react';

interface RoomPageProps {
  params: Promise<{ roomId: string }>;
}

export default function RoomPage({ params }: RoomPageProps) {
  const { roomId } = use(params);
  
  const [events, setEvents] = useState<LifeEvent[]>([]);
  const [isImageAnalyzerOpen, setIsImageAnalyzerOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'chat' | 'timeline'>('chat');
  const [connectedUsers, setConnectedUsers] = useState(1);
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'connecting' | 'disconnected'>('connecting');
  const [retryTrigger, setRetryTrigger] = useState(0);
  const [contributors, setContributors] = useState<Contributor[]>([]);
  const [contributor, setContributor] = useState<Contributor | null>(null);
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  
  const retryCountRef = useRef(0);
  const eventSourceRef = useRef<EventSource | null>(null);

  // Chunk load error recovery
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

  // SSE connection (room-scoped)
  useEffect(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }

    const eventSource = new EventSource(`/api/rooms/${roomId}/events`);
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
          if (data.users) {
            setContributors(data.users);
          }
        } else if (data.type === 'user-count') {
          setConnectedUsers(data.count);
        } else if (data.type === 'presence') {
          setContributors(data.users);
        }
      } catch {
        // Ignore non-JSON messages like keep-alive
      }
    };

    eventSource.onerror = () => {
      eventSource.close();
      setConnectionStatus('disconnected');
      
      const timeout = Math.min(1000 * Math.pow(2, retryCountRef.current), 30000);
      retryCountRef.current += 1;
      
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
  }, [retryTrigger, roomId]);

  // Join room when contributor is set
  useEffect(() => {
    if (contributor && connectionStatus === 'connected') {
      syncEvent('join', contributor);
    }
    
    // Leave on unmount
    return () => {
      if (contributor) {
        // Fire and forget leave
        fetch(`/api/rooms/${roomId}/events`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ type: 'leave', payload: contributor.id }),
        }).catch(() => {});
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [contributor, connectionStatus]);

  const syncEvent = async (type: string, payload: any) => {
    try {
      await fetch(`/api/rooms/${roomId}/events`, {
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
      id: generateId(),
      contributedBy: contributor?.name,
      contributorColor: contributor?.color,
      contributorId: contributor?.id,
    };
    syncEvent('add', newEvent);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [contributor, roomId]);

  const handleReorder = (newEvents: LifeEvent[]) => {
    setEvents(newEvents);
    syncEvent('reorder', newEvents.map(e => e.id));
  };

  const handleEventUpdate = (updatedEvent: LifeEvent) => {
    setEvents(prev => prev.map(e => e.id === updatedEvent.id ? updatedEvent : e));
    syncEvent('update', updatedEvent);
  };

  const handleDelete = (id: string) => {
    syncEvent('delete', id);
  };

  const handleAddComment = (eventId: string, comment: EventComment) => {
    syncEvent('add-comment', { eventId, comment });
  };

  const handleAddPhoto = (eventId: string, photo: EventPhoto) => {
    syncEvent('add-photo', { eventId, photo });
  };

  const handleAddCorrection = (eventId: string, correction: Correction) => {
    syncEvent('add-correction', { eventId, correction });
  };

  const handleContributorReady = useCallback((c: Contributor) => {
    setContributor(c);
  }, []);

  const exportTimeline = () => {
    const content = events.map(e => {
      let entry = `${e.date}: ${e.title}\n${e.description}`;
      if (e.contributedBy) entry += `\n(Contributed by ${e.contributedBy})`;
      if (e.corrections && e.corrections.length > 0) {
        entry += `\n[Corrected ${e.corrections.length} time${e.corrections.length !== 1 ? 's' : ''}]`;
      }
      return entry;
    }).join('\n\n---\n\n');
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `lifestory-${roomId}.txt`;
    a.click();
  };

  const copyRoomLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <main className="min-h-screen bg-background text-foreground flex flex-col">
      {/* Contributor identity modal (shows on first visit) */}
      <ContributorIdentity onComplete={handleContributorReady} />
      
      {/* Contributor panel */}
      <ContributorPanel
        isOpen={isPanelOpen}
        onClose={() => setIsPanelOpen(false)}
        contributors={contributors}
        currentUserId={contributor?.id || ''}
      />

      {/* Header */}
      <header className="p-4 md:p-6 border-b border-border flex justify-between items-center bg-background/50 backdrop-blur-md sticky top-0 z-40">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center shadow-lg shadow-primary/20">
            <BookOpen className="text-primary-foreground w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl md:text-2xl font-serif font-bold tracking-tight">LifeStory</h1>
            <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-widest">
              {roomId.replace(/-/g, ' ')}
            </p>
          </div>

          {/* Room share button */}
          <button
            onClick={copyRoomLink}
            className="hidden sm:flex items-center gap-1.5 px-3 py-1 bg-secondary/50 rounded-full border border-border text-[10px] font-bold text-muted-foreground uppercase tracking-tighter hover:bg-secondary transition-colors"
          >
            {copied ? <Check className="w-3 h-3 text-green-500" /> : <Share2 className="w-3 h-3" />}
            {copied ? 'Copied!' : 'Share Room'}
          </button>
          
          {/* Collaborators badge */}
          <button 
            onClick={() => setIsPanelOpen(true)}
            className="hidden sm:flex items-center gap-2 px-3 py-1 bg-primary/10 rounded-full border border-primary/20 hover:bg-primary/20 transition-colors"
          >
            <div className="relative">
              <Users className="w-3 h-3 text-primary" />
              {connectedUsers > 1 && (
                <span className="absolute -top-1 -right-1 w-2 h-2 bg-green-500 rounded-full animate-pulse border border-background" />
              )}
            </div>
            {/* Show contributor avatars */}
            <div className="flex -space-x-1.5">
              {contributors.slice(0, 4).map(c => (
                <div
                  key={c.id}
                  className="w-4 h-4 rounded-full border border-background text-[7px] font-bold text-white flex items-center justify-center"
                  style={{ backgroundColor: c.color }}
                  title={c.name}
                >
                  {c.name[0].toUpperCase()}
                </div>
              ))}
              {contributors.length > 4 && (
                <div className="w-4 h-4 rounded-full border border-background bg-secondary text-[7px] font-bold text-muted-foreground flex items-center justify-center">
                  +{contributors.length - 4}
                </div>
              )}
            </div>
            <span className="text-[10px] font-bold text-primary uppercase tracking-tighter">
              {connectedUsers > 1 ? `${connectedUsers} online` : 'Live'}
            </span>
          </button>
          
          {/* Connection Status */}
          <div className={`flex items-center gap-1.5 px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-tighter transition-colors ${
            connectionStatus === 'connected' ? 'text-green-500 bg-green-500/10' : 
            connectionStatus === 'connecting' ? 'text-yellow-500 bg-yellow-500/10' : 
            'text-red-500 bg-red-500/10'
          }`}>
            {connectionStatus === 'connected' ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
            <span className="hidden md:inline">{connectionStatus}</span>
          </div>
        </div>

        <div className="flex items-center gap-2 md:gap-4">
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
              contributorName={contributor?.name}
              contributorColor={contributor?.color}
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
              onAddComment={handleAddComment}
              onAddPhoto={handleAddPhoto}
              onAddCorrection={handleAddCorrection}
              contributorName={contributor?.name}
              contributorColor={contributor?.color}
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
                  contributorName={contributor?.name}
                  contributorColor={contributor?.color}
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
                  onAddComment={handleAddComment}
                  onAddPhoto={handleAddPhoto}
                  onAddCorrection={handleAddCorrection}
                  contributorName={contributor?.name}
                  contributorColor={contributor?.color}
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
          onClick={() => setIsPanelOpen(true)}
          className="flex flex-col items-center gap-1 text-muted-foreground"
        >
          <div className="relative">
            <Users className="w-6 h-6" />
            {connectedUsers > 1 && (
              <span className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full text-[7px] text-white font-bold flex items-center justify-center border border-background">
                {connectedUsers}
              </span>
            )}
          </div>
          <span className="text-[10px] font-bold uppercase tracking-tighter">People</span>
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
