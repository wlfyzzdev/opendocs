import { getDocs, getCategories, getDocContent, getFiles } from '@/lib/api';
import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';
import MarkdownContent from '@/components/MarkdownContent';
import { DocFile } from '@/lib/api';

export const dynamic = 'force-dynamic';

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

export default async function Home() {
  const { docs, categories, categoryFiles } = await getNavData();
  
  let content = '# Documentation Hub\n\nWelcome to your documentation hub. Create an `index.md` file in the `files/` directory to get started.';
  
  try {
    const indexDoc = await getDocContent('index');
    content = indexDoc.content;
  } catch {
    // Use default content
  }

  return (
    <div className="layout">
      <Header />
      <Sidebar docs={docs} categories={categories} categoryFiles={categoryFiles} />
      <div className="main-wrapper">
        <main className="main-content">
          <MarkdownContent content={content} />
        </main>
      </div>
    </div>
  );
}
