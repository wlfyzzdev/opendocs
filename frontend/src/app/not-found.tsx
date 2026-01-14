import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="layout">
      <main className="main-content" style={{ marginLeft: 0 }}>
        <div className="content-header">
          <h1>404 - Page Not Found</h1>
        </div>
        <p>The page you&apos;re looking for doesn&apos;t exist.</p>
        <p style={{ marginTop: '1rem' }}>
          <Link href="/">← Go back home</Link>
        </p>
      </main>
    </div>
  );
}
