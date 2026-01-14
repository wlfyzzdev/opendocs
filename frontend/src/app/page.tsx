import { getDocs, getCategories, getDocContent, getFiles } from '@/lib/api';
import MarkdownContent from '@/components/MarkdownContent';
import LayoutClient from '@/components/LayoutClient';
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
  
  let content = '# Hub\n\nWelcome to openDocs hub. Create an `index.md` file in the `files/` directory to get started.';
  
  try {
    const indexDoc = await getDocContent('index');
    content = indexDoc.content;
  } catch {
    try {
      const defaultDoc = await getDocContent('default');
      content = defaultDoc.content;
    } catch {
    }
  }

  return (
    <LayoutClient docs={docs} categories={categories} categoryFiles={categoryFiles}>
      <MarkdownContent content={content} />
    </LayoutClient>
  );
}
