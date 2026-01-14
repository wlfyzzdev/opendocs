import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="layout">
      <main className="main-content" style={{ marginLeft: 0 }}>
        <div className="content-header" style={{ textAlign: 'center', paddingTop: '4rem' }}>
          <h1 style={{ fontSize: '4rem', marginBottom: '0.5rem' }}>404</h1>
          <p style={{ fontSize: '1.5rem', color: '#666', marginBottom: '2rem' }}>Page Not Found</p>
          <p style={{ fontSize: '1.1rem', color: '#888', marginBottom: '2rem' }}>
            Sorry, the page you&apos;re looking for doesn&apos;t exist or has been moved.
          </p>
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link 
              href="/" 
              style={{
                display: 'inline-block',
                padding: '0.75rem 1.5rem',
                backgroundColor: '#0070f3',
                color: 'white',
                textDecoration: 'none',
                borderRadius: '6px',
                fontWeight: '500',
                transition: 'background-color 0.2s'
              }}
            >
              ← Go back home
            </Link>
            <Link 
              href="/docs/index" 
              style={{
                display: 'inline-block',
                padding: '0.75rem 1.5rem',
                backgroundColor: '#f0f0f0',
                color: '#333',
                textDecoration: 'none',
                borderRadius: '6px',
                fontWeight: '500',
                transition: 'background-color 0.2s'
              }}
            >
              Browse Documentation
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
