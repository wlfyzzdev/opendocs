'use client';

import { useState, useEffect, ReactNode } from 'react';
import Header from './Header';
import Sidebar from './Sidebar';
import { DocInfo, DocFile } from '@/lib/api';

interface LayoutClientProps {
  children: ReactNode;
  docs: DocInfo[];
  categories: string[];
  categoryFiles: Record<string, DocFile[]>;
}

export default function LayoutClient({ children, docs, categories, categoryFiles }: LayoutClientProps) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('sidebar-open');
    if (saved !== null) {
      setSidebarOpen(JSON.parse(saved));
    }
    setIsLoaded(true);
  }, []);

  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem('sidebar-open', JSON.stringify(sidebarOpen));
    }
  }, [sidebarOpen, isLoaded]);

  const handleToggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  if (!isLoaded) {
    return (
      <div className="layout">
        <Header onToggleSidebar={handleToggleSidebar} sidebarOpen={sidebarOpen} />
        <Sidebar docs={docs} categories={categories} categoryFiles={categoryFiles} isOpen={sidebarOpen} />
        <div className="main-wrapper">
          <main className="main-content">{children}</main>
        </div>
      </div>
    );
  }

  return (
    <div className="layout">
      <Header onToggleSidebar={handleToggleSidebar} sidebarOpen={sidebarOpen} />
      <Sidebar docs={docs} categories={categories} categoryFiles={categoryFiles} isOpen={sidebarOpen} />
      <div className={`main-wrapper ${!sidebarOpen ? 'sidebar-hidden' : ''}`}>
        <main className="main-content">{children}</main>
      </div>
    </div>
  );
}
