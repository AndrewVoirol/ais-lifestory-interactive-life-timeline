'use client';

import React, { useEffect, useState } from 'react';
import { Sun, Moon } from 'lucide-react';
import { motion } from 'motion/react';

export default function ThemeToggle() {
  const [isDark, setIsDark] = useState(true);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setTimeout(() => {
      setMounted(true);
      const isDarkMode = document.documentElement.classList.contains('dark');
      setIsDark(isDarkMode);
    }, 0);
  }, []);

  if (!mounted) {
    return <div className="w-14 h-8" />; // Placeholder to avoid layout shift
  }

  const toggleTheme = () => {
    const newDark = !isDark;
    setIsDark(newDark);
    if (newDark) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  };

  return (
    <button
      onClick={toggleTheme}
      className="relative w-14 h-8 bg-secondary rounded-full p-1 transition-colors hover:bg-secondary/80 focus:outline-none focus:ring-2 focus:ring-primary/50"
      aria-label="Toggle theme"
    >
      <motion.div
        animate={{ x: isDark ? 24 : 0 }}
        transition={{ type: "spring", stiffness: 500, damping: 30 }}
        className="w-6 h-6 bg-primary rounded-full flex items-center justify-center shadow-sm"
      >
        {isDark ? (
          <Moon className="w-3.5 h-3.5 text-primary-foreground" />
        ) : (
          <Sun className="w-3.5 h-3.5 text-primary-foreground" />
        )}
      </motion.div>
      
      <div className="absolute inset-0 flex justify-between items-center px-2 pointer-events-none">
        <Sun className={`w-3.5 h-3.5 ${!isDark ? 'opacity-0' : 'text-muted-foreground opacity-50'}`} />
        <Moon className={`w-3.5 h-3.5 ${isDark ? 'opacity-0' : 'text-muted-foreground opacity-50'}`} />
      </div>
    </button>
  );
}
