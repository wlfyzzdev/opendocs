const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

export interface DocFile {
  id: number;
  path: string;
  title: string;
  description: string;
  category: string;
}

export interface DocInfo {
  filename: string;
  title: string;
  isIndex: boolean;
}

export interface DocsResponse {
  docs: DocInfo[];
  hasIndex: boolean;
}

export interface DocContent {
  filename: string;
  title: string;
  content: string;
}

export interface FileWithContent extends DocFile {
  content: string;
  previousFile: DocFile | null;
  nextFile: DocFile | null;
}

export async function getFiles(category?: string): Promise<DocFile[]> {
  const url = category 
    ? `${API_BASE}/api/files?category=${encodeURIComponent(category)}`
    : `${API_BASE}/api/files`;
  const res = await fetch(url);
  if (!res.ok) throw new Error('Failed to fetch files');
  return res.json();
}

export async function getCategories(): Promise<string[]> {
  const res = await fetch(`${API_BASE}/api/categories`);
  if (!res.ok) throw new Error('Failed to fetch categories');
  return res.json();
}

export async function getDocs(): Promise<DocsResponse> {
  const res = await fetch(`${API_BASE}/api/docs`);
  if (!res.ok) throw new Error('Failed to fetch docs');
  return res.json();
}

export async function getDocContent(filename: string): Promise<DocContent> {
  const res = await fetch(`${API_BASE}/api/docs/${encodeURIComponent(filename)}`);
  if (!res.ok) throw new Error('Failed to fetch doc content');
  return res.json();
}

export async function getCategoryFile(category: string, fileId: string): Promise<FileWithContent> {
  const res = await fetch(`${API_BASE}/api/categories/${encodeURIComponent(category)}/files/${fileId}`);
  if (!res.ok) throw new Error('Failed to fetch file');
  return res.json();
}

export async function getCategoryFiles(category: string): Promise<DocFile[]> {
  const res = await fetch(`${API_BASE}/api/categories/${encodeURIComponent(category)}/files`);
  if (!res.ok) throw new Error('Failed to fetch category files');
  return res.json();
}
