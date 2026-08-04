'use client';

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Send, User, Bot, Volume2, Loader2, ImagePlus, Settings, X } from 'lucide-react';
import { getAI, INTERVIEW_SYSTEM_PROMPT, generateSpeech } from '@/lib/gemini';
import ReactMarkdown from 'react-markdown';

interface Message {
  role: 'user' | 'bot';
  content: string;
}

interface ChatProps {
  onEventDetected: (event: { title: string; description: string; date: string }) => void;
  onImageClick: () => void;
  events: any[];
  onEventUpdated: (event: any) => void;
}

const VOICES = ['Puck', 'Charon', 'Kore', 'Fenrir', 'Zephyr'];

export default function Chat({ onEventDetected, onImageClick, events, onEventUpdated }: ChatProps) {
  const [messages, setMessages] = useState<Message[]>([
    { role: 'bot', content: "Hello! I'm your personal biographer. I'd love to help you document your journey. Shall we start at the very beginning? Where were you born, or what is your earliest memory?" }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [voice, setVoice] = useState('Kore');
  const [speechRate, setSpeechRate] = useState(1.0);
  const [conversationMode, setConversationMode] = useState(false);
  
  const scrollRef = useRef<HTMLDivElement>(null);
  const chatRef = useRef<any>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setIsLoading(true);

    try {
      const ai = getAI();
      if (!chatRef.current) {
        chatRef.current = ai.chats.create({
          model: "gemini-2.5-flash",
          config: {
            systemInstruction: INTERVIEW_SYSTEM_PROMPT,
          }
        });
      }

      let messageToSend = userMessage;
      
      // Inject current timeline context
      const timelineContext = events.length > 0 
        ? `\n\n[CURRENT TIMELINE: ${JSON.stringify(events.map(e => ({ title: e.title, date: e.date, id: e.id })))}]`
        : "";
      messageToSend += timelineContext;

      if (conversationMode) {
        messageToSend += "\n\n[SYSTEM NOTE: Conversation Mode is ENABLED. Keep your response concise (under 3 sentences), friendly, and conversational. If extracting an event, keep the description brief. Ensure JSON format remains valid.]";
      }

      const response = await chatRef.current.sendMessage({ message: messageToSend });
      const text = response.text || "";

      // Extract events
      const eventRegex = /\[EVENT_DETECTED:\s*({.*?})\]/g;
      const updateRegex = /\[EVENT_UPDATED:\s*({.*?})\]/g;
      
      let match;
      let cleanText = text;
      
      // Handle new events
      while ((match = eventRegex.exec(text)) !== null) {
        try {
          const eventData = JSON.parse(match[1]);
          onEventDetected(eventData);
          cleanText = cleanText.replace(match[0], '');
        } catch (e) {
          console.error("Failed to parse event data", e);
        }
      }

      // Handle updates
      while ((match = updateRegex.exec(text)) !== null) {
        try {
          const updateData = JSON.parse(match[1]);
          // Find event by ID if provided, or fuzzy match title
          const eventToUpdate = events.find(e => 
            (updateData.id && e.id === updateData.id) || 
            (updateData.originalTitle && e.title.toLowerCase().includes(updateData.originalTitle.toLowerCase()))
          );

          if (eventToUpdate) {
            onEventUpdated({
              ...eventToUpdate,
              date: updateData.date || eventToUpdate.date,
              description: updateData.description || eventToUpdate.description
            });
            cleanText = cleanText.replace(match[0], '');
          }
        } catch (e) {
          console.error("Failed to parse update data", e);
        }
      }

      setMessages(prev => [...prev, { role: 'bot', content: cleanText.trim() }]);
    } catch (error) {
      console.error("Chat error:", error);
      setMessages(prev => [...prev, { role: 'bot', content: "I'm sorry, I encountered an error. Could you try again?" }]);
    } finally {
      setIsLoading(false);
    }
  };

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
                <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                  msg.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground'
                }`}>
                  {msg.role === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                </div>
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
            </motion.div>
          ))}
        </AnimatePresence>
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-secondary p-3 rounded-2xl rounded-tl-none flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin text-primary" />
              <span className="text-sm text-muted-foreground">Thinking...</span>
            </div>
          </div>
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
            placeholder="Type your story..."
            className="flex-1 bg-background border border-border rounded-full px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
          />
          <button
            type="submit"
            disabled={isLoading || !input.trim()}
            className="bg-primary text-primary-foreground p-2 rounded-full hover:scale-105 active:scale-95 transition-all disabled:opacity-50 disabled:hover:scale-100"
          >
            <Send className="w-5 h-5" />
          </button>
        </form>
      </div>
    </div>
  );
}
