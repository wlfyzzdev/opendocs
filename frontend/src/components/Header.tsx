'use client';

import { useState, useEffect } from 'react';
import { themeConfig } from '@/config/theme';

interface HeaderProps {
  onToggleSidebar?: () => void;
  sidebarOpen?: boolean;
}

export default function Header({ onToggleSidebar, sidebarOpen = true }: HeaderProps) {
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    // Check system preference
    const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const savedTheme = localStorage.getItem('theme') as 'light' | 'dark' | null;
    const initialTheme = savedTheme || (isDark ? 'dark' : 'light');
    setTheme(initialTheme);
    document.documentElement.setAttribute('data-theme', initialTheme);
    setIsLoaded(true);
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    document.documentElement.setAttribute('data-theme', newTheme);
  };

  return (
    <header className="header" style={{ background: theme === 'light' ? '#ffffff' : '#0f1117' }}>
      <div className="header-logo" style={{ color: theme === 'light' ? '#111827' : '#e6edf3' }}>
        <button
          className="sidebar-toggle-btn"
          onClick={onToggleSidebar}
          aria-label="Toggle sidebar"
          title={sidebarOpen ? 'Hide sidebar' : 'Show sidebar'}
        >
          ☰
        </button>
        <span className="header-logo-icon">{themeConfig.siteIcon}</span>
        <span>{themeConfig.siteName}</span>
      </div>
      <div className="header-actions">
        <button 
          className="theme-toggle" 
          onClick={toggleTheme}
          aria-label="Toggle theme"
        >
          {theme === 'light' ? '🌙' : '☀️'}
        </button>
      </div>
    </header>
  );
}
