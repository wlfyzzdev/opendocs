// Theme configuration - customize these colors to match your brand
export const themeConfig = {
  // Site info
  siteName: 'OpenDocs',
  siteIcon: '📚',
  
  // Light mode colors
  light: {
    // Backgrounds
    bgPrimary: '#ffffff',
    bgSecondary: '#fafafa',
    bgTertiary: '#f5f5f5',
    bgCode: '#f6f8fa',
    bgHover: '#f0f0f0',
    
    // Text
    textPrimary: '#171717',
    textSecondary: '#525252',
    textMuted: '#a3a3a3',
    
    // Borders
    border: '#e5e5e5',
    borderHover: '#d4d4d4',
    
    // Accent (used for links, active states)
    accent: '#000000',
    accentHover: '#171717',
    accentMuted: '#525252',
    
    // Syntax highlighting
    codeText: '#24292e',
    codeKeyword: '#d73a49',
    codeString: '#032f62',
    codeComment: '#6a737d',
  },
  
  // Dark mode colors
  dark: {
    // Backgrounds
    bgPrimary: '#0a0a0a',
    bgSecondary: '#111111',
    bgTertiary: '#171717',
    bgCode: '#161616',
    bgHover: '#1a1a1a',
    
    // Text
    textPrimary: '#fafafa',
    textSecondary: '#a3a3a3',
    textMuted: '#525252',
    
    // Borders
    border: '#262626',
    borderHover: '#404040',
    
    // Accent (used for links, active states)
    accent: '#ffffff',
    accentHover: '#e5e5e5',
    accentMuted: '#a3a3a3',
    
    // Syntax highlighting
    codeText: '#e1e4e8',
    codeKeyword: '#f97583',
    codeString: '#9ecbff',
    codeComment: '#6a737d',
  },
  
  // Layout
  layout: {
    sidebarWidth: '280px',
    maxContentWidth: '768px',
    headerHeight: '64px',
  },
  
  // Typography
  fonts: {
    sans: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
    mono: '"SF Mono", "Fira Code", "Fira Mono", Menlo, Monaco, Consolas, monospace',
  },
};

export type ThemeConfig = typeof themeConfig;
