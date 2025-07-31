import Link from 'next/link';

export default function FloatingAddButton() {
  return (
    <Link href="/add-item" style={{
      position: 'fixed',
      bottom: '20px', // Position at bottom since navigation is now at top
      left: '50%',
      transform: 'translateX(-50%)',
      width: '60px',
      height: '60px',
      borderRadius: '50%',
      background: 'var(--primary)',
      color: 'white',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      textDecoration: 'none',
      fontSize: '24px',
      boxShadow: '0 4px 16px rgba(0, 0, 0, 0.2)',
      zIndex: 1001,
      transition: 'all 0.3s ease',
      cursor: 'pointer'
    }}
    onMouseEnter={(e) => {
      e.currentTarget.style.transform = 'translateX(-50%) scale(1.1)';
      e.currentTarget.style.boxShadow = '0 6px 20px rgba(0, 0, 0, 0.3)';
    }}
    onMouseLeave={(e) => {
      e.currentTarget.style.transform = 'translateX(-50%) scale(1)';
      e.currentTarget.style.boxShadow = '0 4px 16px rgba(0, 0, 0, 0.2)';
    }}
    title="Add Item"
    >
      ➕
    </Link>
  );
} 