import { Metadata } from 'next';
import { generatePageMetadata } from '@/config/confg';

// Utility to generate metadata for docs pages
export function generateDocMetadata(
  title: string,
  description?: string,
  pathname?: string
): Metadata {
  const fullTitle = `${title} - OpenDocs`;
  const finalDescription = description || `Read about ${title} in OpenDocs documentation.`;
  
  if (pathname) {
    return generatePageMetadata(pathname, fullTitle, finalDescription);
  }
  
  return {
    title: fullTitle,
    description: finalDescription,
  };
}

// Extract first paragraph from markdown as description
export function extractDescription(markdown: string, maxLength: number = 160): string {
  // Remove markdown syntax and get first non-empty line
  const lines = markdown.split('\n');
  
  for (const line of lines) {
    const cleaned = line
      .replace(/^#+\s+/g, '') // Remove headings
      .replace(/[*_`]/g, '') // Remove markdown formatting
      .replace(/^\s+|\s+$/g, ''); // Trim whitespace
    
    if (cleaned && !cleaned.startsWith('[') && cleaned.length > 0) {
      return cleaned.substring(0, maxLength) + (cleaned.length > maxLength ? '...' : '');
    }
  }
  
  return 'Documentation';
}
