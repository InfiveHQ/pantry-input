import Link from 'next/link';

export default function NotFound() {
  return (
    <div style={{ 
      padding: 20, 
      textAlign: 'center',
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center'
    }}>
      <h2 style={{ color: '#dc3545', marginBottom: 20 }}>Page Not Found</h2>
      <p style={{ color: '#666', marginBottom: 20 }}>
        Could not find the requested resource
      </p>
      <Link href="/" style={{
        padding: '12px 24px',
        background: '#007bff',
        color: 'white',
        border: 'none',
        borderRadius: 4,
        cursor: 'pointer',
        fontSize: 16,
        textDecoration: 'none',
        display: 'inline-block'
      }}>
        Return Home
      </Link>
    </div>
  );
} 