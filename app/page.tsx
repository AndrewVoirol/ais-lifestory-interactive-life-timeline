'use client';

import React, { useState } from 'react';
import { motion } from 'motion/react';
import Image from 'next/image';
import { BookOpen, Plus, ArrowRight, Users, Sparkles, Camera, MessageCircle } from 'lucide-react';
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
    <main className="min-h-screen bg-background text-foreground">
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

      {/* Hero Section */}
      <section className="min-h-[65vh] flex flex-col items-center justify-center px-6 py-16 max-w-3xl mx-auto w-full">
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
          className="grid md:grid-cols-2 gap-6 w-full max-w-2xl"
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
      </section>

      {/* How It Works — Visual Narrative */}
      <section className="px-6 py-20 border-t border-border/50">
        <div className="max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true, margin: '-100px' }}
            transition={{ duration: 0.6 }}
            className="text-center mb-14"
          >
            <p className="text-[11px] font-bold text-primary uppercase tracking-[0.2em] mb-3">How It Works</p>
            <h3 className="text-2xl md:text-3xl font-serif font-bold">Two ways to build your story</h3>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-8">
            {/* Use Case 1: AI Interview */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-80px' }}
              transition={{ duration: 0.5 }}
              className="glass-card p-0 overflow-hidden group"
            >
              <div className="relative aspect-[4/3] overflow-hidden">
                <Image
                  src="/demo-photos/childhood-school-photo.jpg"
                  alt="A school picture day photo from 1998 — the kind of memory an AI biographer helps you rediscover"
                  width={600}
                  height={450}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-5">
                  <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-white/10 backdrop-blur-md rounded-full border border-white/20 mb-3">
                    <Sparkles className="w-3.5 h-3.5 text-green-300" />
                    <span className="text-[10px] font-bold text-white/90 uppercase tracking-wider">AI Biographer</span>
                  </div>
                  <p className="text-white/90 text-sm font-serif italic leading-relaxed">
                    &ldquo;Is that your 3rd grade school photo? Tell me about that day.&rdquo;
                  </p>
                </div>
              </div>
              <div className="p-6">
                <h4 className="font-serif text-xl font-bold mb-2">You tell the story</h4>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  An AI biographer draws out memories you forgot you had — asking warm follow-up questions, 
                  pinning dates, building your timeline as you talk.
                </p>
              </div>
            </motion.div>

            {/* Use Case 2: Friends Join */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-80px' }}
              transition={{ duration: 0.5, delay: 0.15 }}
              className="glass-card p-0 overflow-hidden group"
            >
              <div className="grid grid-cols-2">
                <div className="relative aspect-square overflow-hidden">
                  <Image
                    src="/demo-photos/party-alex-group.jpg"
                    alt="Alex's version of the party — group selfie, string lights, everyone at their best"
                    width={400}
                    height={400}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                  <div className="absolute bottom-0 inset-x-0 p-3">
                    <span className="pov-label">Alex&apos;s version</span>
                  </div>
                </div>
                <div className="relative aspect-square overflow-hidden border-l border-border/30">
                  <Image
                    src="/demo-photos/party-marco-aftermath.jpg"
                    alt="Marco's version — the morning after, kitchen destroyed, broom in hand"
                    width={400}
                    height={400}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                  <div className="absolute bottom-0 inset-x-0 p-3">
                    <span className="pov-label">Marco&apos;s version</span>
                  </div>
                </div>
              </div>
              <div className="p-6">
                <h4 className="font-serif text-xl font-bold mb-2">Your friends remember it differently</h4>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Share the room code. Friends and family jump in with their own photos, 
                  correct the dates you got wrong, and add the parts of the story you conveniently left out.
                </p>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="px-6 py-12 border-t border-border/50">
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-6 w-full max-w-2xl mx-auto"
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
      </section>

      {/* Footer */}
      <footer className="p-6 text-center text-xs text-muted-foreground border-t border-border">
        Built with Gemini 2.5 Flash · Every story is better when someone challenges the details
      </footer>
    </main>
  );
}
