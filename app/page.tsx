'use client';

import React, { useState } from 'react';
import { motion } from 'motion/react';
import { BookOpen, Plus, ArrowRight, Users, Sparkles, History, Camera, MessageCircle } from 'lucide-react';
import ThemeToggle from '@/components/ThemeToggle';
import { useRouter } from 'next/navigation';

function generateRoomCode(): string {
  const adjectives = ['golden', 'silver', 'warm', 'bright', 'quiet', 'wild', 'gentle', 'bold', 'vivid', 'sweet'];
  const nouns = ['memories', 'stories', 'chapters', 'moments', 'tales', 'echoes', 'roots', 'paths', 'dreams', 'sparks'];
  const adj = adjectives[Math.floor(Math.random() * adjectives.length)];
  const noun = nouns[Math.floor(Math.random() * nouns.length)];
  const num = Math.floor(Math.random() * 900) + 100;
  return `${adj}-${noun}-${num}`;
}

export default function LandingPage() {
  const router = useRouter();
  const [joinCode, setJoinCode] = useState('');

  const handleCreateRoom = () => {
    const roomId = generateRoomCode();
    router.push(`/room/${roomId}`);
  };

  const handleJoinRoom = (e: React.FormEvent) => {
    e.preventDefault();
    if (joinCode.trim()) {
      router.push(`/room/${joinCode.trim().toLowerCase().replace(/\s+/g, '-')}`);
    }
  };

  return (
    <main className="min-h-screen bg-background text-foreground flex flex-col">
      {/* Header */}
      <header className="p-6 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center shadow-lg shadow-primary/20">
            <BookOpen className="text-primary-foreground w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-serif font-bold tracking-tight">LifeStory</h1>
            <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-widest">Collaborative Biographer</p>
          </div>
        </div>
        <ThemeToggle />
      </header>

      {/* Hero */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12 max-w-3xl mx-auto w-full">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <h2 className="text-4xl md:text-5xl font-serif font-bold mb-4 leading-tight">
            Every memory deserves<br />
            <span className="text-primary">more than one witness</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-xl mx-auto leading-relaxed">
            Start telling your story. Invite the people who were there. 
            Upload the photos that prove it. Let AI help you get the details right — together.
          </p>
        </motion.div>

        {/* Action Cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="grid md:grid-cols-2 gap-6 w-full max-w-2xl mb-16"
        >
          {/* Create Room */}
          <button
            onClick={handleCreateRoom}
            className="glass-card p-8 text-left group hover:border-primary/50 transition-all hover:shadow-lg"
          >
            <div className="w-12 h-12 bg-primary/20 rounded-xl flex items-center justify-center mb-4 group-hover:bg-primary/30 transition-colors">
              <Plus className="w-6 h-6 text-primary" />
            </div>
            <h3 className="font-serif text-xl font-bold mb-2">Start a Story</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Create a new room and invite others to contribute their memories.
            </p>
            <span className="text-primary font-medium text-sm flex items-center gap-1 group-hover:gap-2 transition-all">
              Create room <ArrowRight className="w-4 h-4" />
            </span>
          </button>

          {/* Join Room */}
          <div className="glass-card p-8">
            <div className="w-12 h-12 bg-secondary rounded-xl flex items-center justify-center mb-4">
              <Users className="w-6 h-6 text-muted-foreground" />
            </div>
            <h3 className="font-serif text-xl font-bold mb-2">Join a Story</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Enter a room code to contribute to someone else&apos;s timeline.
            </p>
            <form onSubmit={handleJoinRoom} className="flex gap-2">
              <input
                type="text"
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value)}
                placeholder="e.g. golden-memories-42"
                className="flex-1 bg-background border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
              />
              <button
                type="submit"
                disabled={!joinCode.trim()}
                className="bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-50 hover:opacity-90 transition-opacity"
              >
                Join
              </button>
            </form>
          </div>
        </motion.div>

        {/* Features */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-6 w-full max-w-2xl"
        >
          {[
            { icon: Sparkles, label: 'AI Biographer', desc: 'Draws out your story' },
            { icon: Users, label: 'Collaborative', desc: 'Multiple contributors' },
            { icon: Camera, label: 'Photo Evidence', desc: 'Upload proof' },
            { icon: MessageCircle, label: 'Corrections', desc: 'Get the story straight' },
          ].map(({ icon: Icon, label, desc }) => (
            <div key={label} className="text-center">
              <div className="w-10 h-10 rounded-full bg-secondary/50 flex items-center justify-center mx-auto mb-2">
                <Icon className="w-5 h-5 text-muted-foreground" />
              </div>
              <p className="text-xs font-bold text-foreground">{label}</p>
              <p className="text-[10px] text-muted-foreground">{desc}</p>
            </div>
          ))}
        </motion.div>
      </div>

      {/* Footer */}
      <footer className="p-6 text-center text-xs text-muted-foreground border-t border-border">
        Built with Gemini 2.5 Flash · Every story is better when someone challenges the details
      </footer>
    </main>
  );
}
