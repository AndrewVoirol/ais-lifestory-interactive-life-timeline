'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Send, User, Bot, Volume2, Loader2, ImagePlus, Settings, X, Square, MessageCircle } from 'lucide-react';
import { getAI, INTERVIEW_SYSTEM_PROMPT, generateSpeech, streamChatResponse, extractEventsFromText } from '@/lib/gemini';
import ReactMarkdown from 'react-markdown';
import type { ChatMessage, LifeEvent, Contributor } from '@/lib/types';

interface ChatProps {
  onEventDetected: (event: { title: string; description: string; date: string }) => void;
  onImageClick: () => void;
  events: LifeEvent[];
  onEventUpdated: (event: LifeEvent) => void;
  contributorName?: string;
  contributorColor?: string;
}

const VOICES = ['Puck', 'Charon', 'Kore', 'Fenrir', 'Zephyr'];

export default function Chat({ onEventDetected, onImageClick, events, onEventUpdated, contributorName, contributorColor }: ChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    { 
      role: 'bot', 
      content: "Hello! I'm your personal biographer. I'd love to help you document your journey. Shall we start at the very beginning? Where were you born, or what is your earliest memory?",
      timestamp: Date.now(),
    }
  ]);
  const [input, setInput] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingText, setStreamingText] = useState('');
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [voice, setVoice] = useState('Kore');
  const [speechRate, setSpeechRate] = useState(1.0);
  const [conversationMode, setConversationMode] = useState(false);
  
  const scrollRef = useRef<HTMLDivElement>(null);
  const chatRef = useRef<any>(null);
  const abortRef = useRef(false);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, streamingText]);

  const handleSend = async () => {
    if (!input.trim() || isStreaming) return;

    const userMessage = input.trim();
    setInput('');
    
    const userMsg: ChatMessage = { 
      role: 'user', 
      content: userMessage,
      contributorName,
      contributorColor,
      timestamp: Date.now(),
    };
    setMessages(prev => [...prev, userMsg]);
    setIsStreaming(true);
    setStreamingText('');
    abortRef.current = false;

    try {
      if (!chatRef.current) {
        chatRef.current = getAI().chats.create({
          model: "gemini-2.5-flash",
          config: {
            systemInstruction: INTERVIEW_SYSTEM_PROMPT,
          }
        });
      }

      // Build timeline context
      const timelineContext = events.length > 0 
        ? `\n\n[CURRENT TIMELINE: ${JSON.stringify(events.map(e => ({ title: e.title, date: e.date, id: e.id })))}]`
        : "";

      // Add contributor context
      const contributorContext = contributorName 
        ? `\n\n[CONTRIBUTOR: ${contributorName} is speaking]` 
        : "";

      let fullText = '';

      // Stream the response
      const stream = streamChatResponse(
        chatRef.current,
        userMessage + contributorContext,
        timelineContext,
        conversationMode
      );

      for await (const chunk of stream) {
        if (abortRef.current) break;
        fullText += chunk;
        // Show text but hide event tags while streaming
        const displayText = fullText
          .replace(/\[EVENT_DETECTED:\s*{[^}]*}\]/g, '')
          .replace(/\[EVENT_UPDATED:\s*{[^}]*}\]/g, '')
          .trim();
        setStreamingText(displayText);
      }

      // Extract events from completed text
      const { cleanText, detectedEvents, updatedEvents } = extractEventsFromText(fullText);

      // Add the final bot message
      setMessages(prev => [...prev, { 
        role: 'bot', 
        content: cleanText,
        timestamp: Date.now(),
      }]);
      setStreamingText('');

      // Process detected events
      for (const eventData of detectedEvents) {
        onEventDetected(eventData);
      }

      // Process updates
      for (const updateData of updatedEvents) {
        const eventToUpdate = events.find(e => 
          (updateData.id && e.id === updateData.id) || 
          (updateData.originalTitle && e.title.toLowerCase().includes(updateData.originalTitle.toLowerCase()))
        );
        if (eventToUpdate) {
          onEventUpdated({
            ...eventToUpdate,
            date: updateData.date || eventToUpdate.date,
            description: updateData.description || eventToUpdate.description,
          });
        }
      }
    } catch (error) {
      console.error("Chat error:", error);
      setMessages(prev => [...prev, { 
        role: 'bot', 
        content: "I'm sorry, I encountered an error. Could you try again?",
        timestamp: Date.now(),
      }]);
      setStreamingText('');
    } finally {
      setIsStreaming(false);
    }
  };

  const handleStop = useCallback(() => {
    abortRef.current = true;
  }, []);

  const handleTTS = async (text: string) => {
    if (isSpeaking) return;
    setIsSpeaking(true);
    try {
      const base64 = await generateSpeech(text, voice);
      if (base64) {
        const audio = new Audio(`data:audio/mp3;base64,${base64}`);
        audio.playbackRate = speechRate;
        audio.onended = () => setIsSpeaking(false);
        await audio.play();
      }
    } catch (error) {
      console.error("TTS error:", error);
      setIsSpeaking(false);
    }
  };

  return (
    <div className="flex flex-col h-full glass-card overflow-hidden relative">
      <div className="p-4 border-b border-border flex justify-between items-center bg-secondary/30">
        <h2 className="font-serif text-xl font-bold flex items-center gap-2">
          <Bot className="w-5 h-5 text-primary" />
          Biographer
        </h2>
        <div className="flex items-center gap-2">
          <button 
            onClick={() => setShowSettings(!showSettings)}
            className={`p-2 hover:bg-primary/20 rounded-full transition-colors ${showSettings ? 'bg-primary/20 text-primary' : 'text-muted-foreground'}`}
            title="Voice Settings"
          >
            <Settings className="w-5 h-5" />
          </button>
          <button 
            onClick={onImageClick}
            className="p-2 hover:bg-primary/20 rounded-full transition-colors text-primary"
            title="Analyze a photo"
          >
            <ImagePlus className="w-5 h-5" />
          </button>
        </div>
      </div>

      {showSettings && (
        <div className="absolute top-16 right-4 z-20 w-64 bg-background/95 backdrop-blur-md border border-border rounded-xl shadow-xl p-4 space-y-4 animate-in fade-in slide-in-from-top-2">
          <div className="flex justify-between items-center">
            <h3 className="font-medium text-sm">Voice Settings</h3>
            <button onClick={() => setShowSettings(false)} className="text-muted-foreground hover:text-foreground">
              <X className="w-4 h-4" />
            </button>
          </div>
          
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <label className="text-xs text-muted-foreground font-medium uppercase">Conversation Mode</label>
              <button
                onClick={() => setConversationMode(!conversationMode)}
                className={`w-8 h-4 rounded-full transition-colors relative ${conversationMode ? 'bg-primary' : 'bg-secondary border border-border'}`}
              >
                <span className={`absolute top-0.5 left-0.5 w-3 h-3 rounded-full bg-background shadow-sm transition-transform ${conversationMode ? 'translate-x-4' : 'translate-x-0'}`} />
              </button>
            </div>
            <p className="text-[10px] text-muted-foreground">
              Shorter responses, friendlier tone.
            </p>
          </div>

          <div className="space-y-2">
            <label className="text-xs text-muted-foreground font-medium uppercase">Voice</label>
            <div className="grid grid-cols-3 gap-2">
              {VOICES.map(v => (
                <button
                  key={v}
                  onClick={() => setVoice(v)}
                  className={`text-xs py-1.5 px-2 rounded-md border transition-all ${
                    voice === v 
                      ? 'bg-primary text-primary-foreground border-primary' 
                      : 'bg-secondary text-secondary-foreground border-transparent hover:border-primary/50'
                  }`}
                >
                  {v}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between">
              <label className="text-xs text-muted-foreground font-medium uppercase">Speed</label>
              <span className="text-xs font-mono">{speechRate}x</span>
            </div>
            <input
              type="range"
              min="0.5"
              max="2.0"
              step="0.1"
              value={speechRate}
              onChange={(e) => setSpeechRate(parseFloat(e.target.value))}
              className="w-full accent-primary h-1.5 bg-secondary rounded-full appearance-none cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-muted-foreground px-1">
              <span>Slow</span>
              <span>Fast</span>
            </div>
          </div>
        </div>
      )}

      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4">
        <AnimatePresence initial={false}>
          {messages.map((msg, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`max-w-[85%] flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                {/* Avatar */}
                <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                  msg.role === 'user' 
                    ? '' 
                    : 'bg-secondary text-secondary-foreground'
                }`}
                  style={msg.role === 'user' && msg.contributorColor 
                    ? { backgroundColor: msg.contributorColor, color: 'white' } 
                    : msg.role === 'user' 
                      ? { backgroundColor: 'var(--primary)', color: 'var(--primary-foreground)' }
                      : undefined
                  }
                >
                  {msg.role === 'user' ? (
                    msg.contributorName 
                      ? <span className="text-xs font-bold">{msg.contributorName[0].toUpperCase()}</span>
                      : <User className="w-4 h-4" />
                  ) : (
                    <Bot className="w-4 h-4" />
                  )}
                </div>

                {/* Message bubble */}
                <div className="flex flex-col gap-1">
                  {msg.role === 'user' && msg.contributorName && (
                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider text-right">
                      {msg.contributorName}
                    </span>
                  )}
                  <div className={`p-3 rounded-2xl relative group ${
                    msg.role === 'user' 
                      ? 'bg-primary text-primary-foreground rounded-tr-none' 
                      : 'bg-secondary text-secondary-foreground rounded-tl-none'
                  }`}>
                    <div className="prose dark:prose-invert prose-sm">
                      <ReactMarkdown>{msg.content}</ReactMarkdown>
                    </div>
                    {msg.role === 'bot' && (
                      <button 
                        onClick={() => handleTTS(msg.content)}
                        disabled={isSpeaking}
                        className="absolute -right-8 top-0 opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:text-primary disabled:opacity-50"
                      >
                        {isSpeaking ? <Loader2 className="w-4 h-4 animate-spin" /> : <Volume2 className="w-4 h-4" />}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Streaming response */}
        {isStreaming && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex justify-start"
          >
            <div className="max-w-[85%] flex gap-3">
              <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 bg-secondary text-secondary-foreground">
                <Bot className="w-4 h-4" />
              </div>
              <div className="p-3 rounded-2xl rounded-tl-none bg-secondary text-secondary-foreground">
                {streamingText ? (
                  <div className="prose dark:prose-invert prose-sm">
                    <ReactMarkdown>{streamingText}</ReactMarkdown>
                    <span className="inline-block w-0.5 h-4 bg-primary animate-pulse ml-0.5 align-text-bottom" />
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <span className="flex gap-1">
                      <span className="w-2 h-2 rounded-full bg-primary/60 animate-bounce" style={{ animationDelay: '0ms' }} />
                      <span className="w-2 h-2 rounded-full bg-primary/60 animate-bounce" style={{ animationDelay: '150ms' }} />
                      <span className="w-2 h-2 rounded-full bg-primary/60 animate-bounce" style={{ animationDelay: '300ms' }} />
                    </span>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </div>

      <div className="p-4 border-t border-border bg-secondary/10">
        <form 
          onSubmit={(e) => { e.preventDefault(); handleSend(); }}
          className="flex gap-2"
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={contributorName ? `${contributorName}, share a memory...` : "Type your story..."}
            className="flex-1 bg-background border border-border rounded-full px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
            disabled={isStreaming}
          />
          {isStreaming ? (
            <button
              type="button"
              onClick={handleStop}
              className="bg-destructive text-destructive-foreground p-2 rounded-full hover:scale-105 active:scale-95 transition-all"
              title="Stop generating"
            >
              <Square className="w-5 h-5" />
            </button>
          ) : (
            <button
              type="submit"
              disabled={!input.trim()}
              className="bg-primary text-primary-foreground p-2 rounded-full hover:scale-105 active:scale-95 transition-all disabled:opacity-50 disabled:hover:scale-100"
            >
              <Send className="w-5 h-5" />
            </button>
          )}
        </form>
      </div>
    </div>
  );
}
