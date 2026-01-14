import Link from 'next/link';
import { DocFile } from '@/lib/api';

interface PaginationProps {
  previousFile: DocFile | null;
  nextFile: DocFile | null;
  category: string;
}

export default function Pagination({ previousFile, nextFile, category }: PaginationProps) {
  if (!previousFile && !nextFile) return null;

  return (
    <div className="pagination">
      {previousFile ? (
        <Link href={`/docs/${category}/${previousFile.id}`} className="pagination-link prev">
          <span className="pagination-label">← Go Back</span>
          <span className="pagination-title">{previousFile.title}</span>
        </Link>
      ) : (
        <div />
      )}
      
      {nextFile && (
        <Link href={`/docs/${category}/${nextFile.id}`} className="pagination-link next">
          <span className="pagination-label">Upcoming →</span>
          <span className="pagination-title">{nextFile.title}</span>
        </Link>
      )}
    </div>
  );
}
