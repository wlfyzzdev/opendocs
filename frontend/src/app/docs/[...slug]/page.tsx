import { Metadata } from 'next';
import { getDocs, getCategories, getDocContent, getCategoryFile, getFiles } from '@/lib/api';
import { generateDocMetadata, extractDescription } from '@/lib/metadata';
import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';
import MarkdownContent from '@/components/MarkdownContent';
import Pagination from '@/components/Pagination';
import { notFound } from 'next/navigation';
import { DocFile } from '@/lib/api';

export const dynamic = 'force-dynamic';

interface PageProps {
  params: Promise<{ slug: string[] }>;
}

async function getNavData() {
  const [docsResponse, categories] = await Promise.all([
    getDocs(),
    getCategories()
  ]);
  
  const categoryFiles: Record<string, DocFile[]> = {};
  for (const category of categories) {
    categoryFiles[category] = await getFiles(category);
  }
  
  return { docs: docsResponse.docs, categories, categoryFiles };
}

// Generate metadata for the page
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  
  // Single segment: markdown file
  if (slug.length === 1) {
    try {
      const doc = await getDocContent(slug[0]);
      const description = extractDescription(doc.content);
      return generateDocMetadata(doc.title, description, `/docs/${slug[0]}`);
    } catch {
      return generateDocMetadata('Page Not Found');
    }
  }
  
  // Two segments: category file
  if (slug.length === 2) {
    try {
      const file = await getCategoryFile(slug[0], slug[1]);
      const description = extractDescription(file.content);
      return generateDocMetadata(file.title, description, `/docs/${slug[0]}/${slug[1]}`);
    } catch {
      return generateDocMetadata('Page Not Found');
    }
  }
  
  return generateDocMetadata('Page Not Found');
}

export default async function DocPage({ params }: PageProps) {
  const { slug } = await params;
  const { docs, categories, categoryFiles } = await getNavData();
  
  // Single segment: /docs/[filename] - markdown file
  if (slug.length === 1) {
    const filename = slug[0];
    try {
      const doc = await getDocContent(filename);
      
      return (
        <div className="layout">
          <Header />
          <Sidebar docs={docs} categories={categories} categoryFiles={categoryFiles} />
          <div className="main-wrapper">
            <main className="main-content">
              <div className="content-header">
                <h1 className="page-title">{doc.title}</h1>
              </div>
              <MarkdownContent content={doc.content} />
            </main>
          </div>
        </div>
      );
    } catch {
      notFound();
    }
  }
  
  // Two segments: /docs/[category]/[fileId] - database file
  if (slug.length === 2) {
    const [category, fileId] = slug;
    try {
      const file = await getCategoryFile(category, fileId);
      
      return (
        <div className="layout">
          <Header />
          <Sidebar docs={docs} categories={categories} categoryFiles={categoryFiles} />
          <div className="main-wrapper">
            <main className="main-content">
              <div className="content-header">
                <div className="breadcrumb">
                </div>
                <h1 className="page-title">{file.title.charAt(0).toUpperCase() + file.title.slice(1)}</h1>
                {file.description && <p className="page-description">{file.description.charAt(0).toUpperCase() + file.description.slice(1)}</p>}
              </div>
              <MarkdownContent content={file.content} />
              <Pagination 
                previousFile={file.previousFile} 
                nextFile={file.nextFile}
                category={category}
              />
            </main>
          </div>
        </div>
      );
    } catch {
      notFound();
    }
  }
  
  notFound();
}
