import { Metadata } from 'next';

export const pageMetadata: Record<string, Partial<Metadata>> = {
  '/': {
    title: 'OpenDocs - Modern Documentation Hub',
    description: 'A beautiful, customizable documentation system with dark mode support.',
  },
  // Example for a specific doc page
  // '/docs/getting-started': {
  //   title: 'Getting Started - OpenDocs',
  //   description: 'Learn how to get started with OpenDocs in 5 minutes.',
  // },
  
};

export const defaultMetadata: Metadata = {
  title: 'OpenDocs',
  description: 'Documentation Hub',
  keywords: ['documentation', 'docs', 'guides'],
  authors: [{ name: 'OpenDocs' }],
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: process.env.NEXT_PUBLIC_URL || 'http://localhost:3001',
    siteName: 'OpenDocs',
  },
};

export function generatePageMetadata(
  pathname: string,
  pageTitle?: string,
  pageDescription?: string
): Metadata {
  if (pageMetadata[pathname]) {
    return {
      ...defaultMetadata,
      ...pageMetadata[pathname],
    };
  }

  if (pageTitle) {
    return {
      ...defaultMetadata,
      title: pageTitle,
      description: pageDescription || defaultMetadata.description,
    };
  }
  return defaultMetadata;
}

// Type for page metadata
export type PageMetadata = Partial<Metadata>;