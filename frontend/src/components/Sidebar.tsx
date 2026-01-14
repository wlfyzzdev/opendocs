'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import { DocInfo, DocFile } from '@/lib/api';

interface SidebarProps {
  docs: DocInfo[];
  categories: string[];
  categoryFiles: Record<string, DocFile[]>;
  isOpen?: boolean;
}

export default function Sidebar({ docs, categories, categoryFiles, isOpen = true }: SidebarProps) {
  const pathname = usePathname();
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [isLoaded, setIsLoaded] = useState(false);

  // Load saved state from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('sidebar-expanded-categories');
    if (saved) {
      try {
        setExpandedCategories(new Set(JSON.parse(saved)));
      } catch (e) {
        setExpandedCategories(new Set());
      }
    }
    setIsLoaded(true);
  }, []);

  // Auto-expand category if currently viewing a page in it
  useEffect(() => {
    if (!isLoaded) return;

    categories.forEach(category => {
      const isCategoryActive = pathname.startsWith(`/docs/${category}`);
      setExpandedCategories(prev => {
        const newSet = new Set(prev);
        if (isCategoryActive && !newSet.has(category)) {
          newSet.add(category);
        }
        return newSet;
      });
    });
  }, [pathname, categories, isLoaded]);

  // Save state to localStorage whenever it changes
  useEffect(() => {
    if (!isLoaded) return;
    localStorage.setItem('sidebar-expanded-categories', JSON.stringify(Array.from(expandedCategories)));
  }, [expandedCategories, isLoaded]);

  const toggleCategory = (category: string) => {
    setExpandedCategories(prev => {
      const newSet = new Set(prev);
      if (newSet.has(category)) {
        newSet.delete(category);
      } else {
        newSet.add(category);
      }
      return newSet;
    });
  };

  if (!isLoaded) {
    return (
      <aside className="sidebar">
        <nav className="sidebar-nav" />
      </aside>
    );
  }

  return (
    <aside className={`sidebar ${!isOpen ? 'sidebar-closed' : ''}`}>
      <nav className="sidebar-nav">
        <div className="nav-section">
          <Link 
            href="/" 
            className={`nav-link ${pathname === '/' ? 'active' : ''}`}
          >
            🏠 Home
          </Link>
        </div>

        {docs.filter(d => !d.isIndex && d.filename !== 'default').length > 0 && (
          <div className="nav-section">
            <div className="nav-section-title">Documentation</div>
            {docs.filter(d => !d.isIndex && d.filename !== 'default').map(doc => (
              <Link 
                key={doc.filename}
                href={`/docs/${doc.filename}`}
                className={`nav-link ${pathname === `/docs/${doc.filename}` ? 'active' : ''}`}
              >
                {doc.title.charAt(0).toUpperCase() + doc.title.slice(1)}
              </Link>
            ))}
          </div>
        )}

        {categories.length > 0 ? (
          categories.sort((a, b) => {
            if (a === 'uncategorized') return -1;
            if (b === 'uncategorized') return 1;
            return a.localeCompare(b);
          }).map(category => (
            <div key={category} className="nav-section">
              <button
                onClick={() => toggleCategory(category)}
                className="nav-section-title-button"
                aria-expanded={expandedCategories.has(category)}
              >
                <span className="nav-section-toggle">
                  {expandedCategories.has(category) ? '▼' : '▶'}
                </span>
                {category.charAt(0).toUpperCase() + category.slice(1)}
              </button>
              {expandedCategories.has(category) && (
                <div className="nav-section-content">
                  {(categoryFiles[category] || []).map(file => (
                    <Link 
                      key={file.id}
                      href={`/docs/${category}/${file.id}`}
                      className={`nav-link nav-link-sub ${pathname === `/docs/${category}/${file.id}` ? 'active' : ''}`}
                    >
                      <span className="nav-link-indent">↳</span>
                      {file.title.charAt(0).toUpperCase() + file.title.slice(1)}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          ))
        ) : (
          <div className="nav-section">
          </div>
                )}

        {docs.filter(d => !d.isIndex && d.filename !== 'default').length === 0 && categories.length === 0 && (
          <div className="nav-section">
            <div style={{ padding: '1rem 1.25rem', fontSize: '0.875rem', color: 'var(--text-muted)', fontStyle: 'italic', textAlign: 'center' }}>
              No pages found
            </div>
          </div>
        )}
      </nav>
    </aside>
  );
}
