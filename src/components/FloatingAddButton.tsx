import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';

export default function FloatingAddButton() {
  const [isMobile, setIsMobile] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const checkIsMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    
    checkIsMobile();
    window.addEventListener('resize', checkIsMobile);
    
    return () => window.removeEventListener('resize', checkIsMobile);
  }, []);

  // Only show on mobile and not on add-item page
  if (!isMobile || router.pathname === '/add-item') {
    return null;
  }

  return (
    <Link href="/add-item" style={{
      position: 'fixed',
      bottom: '80px', // Position above mobile navigation
      right: '20px', // Position on the right
      width: '50px',
      height: '50px',
      borderRadius: '50%',
      background: 'linear-gradient(145deg, #2a2a2a, #404040)', // Subtle gradient
      color: '#ffffff', // White text
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      textDecoration: 'none',
      fontSize: '20px',
      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.1)', // Lighter shadow
      zIndex: 1001,
      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)', // Smooth easing
      cursor: 'pointer',
      border: '1px solid #555555', // Thinner border
      animation: 'pulse 3s infinite' // Slower, more subtle pulse
    }}
    onMouseEnter={(e) => {
      e.currentTarget.style.transform = 'scale(1.1) translateY(-1px)';
      e.currentTarget.style.background = 'linear-gradient(145deg, #3a3a3a, #505050)';
      e.currentTarget.style.boxShadow = '0 6px 16px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.15)';
      e.currentTarget.style.animation = 'none'; // Stop pulse on hover
    }}
    onMouseLeave={(e) => {
      e.currentTarget.style.transform = 'scale(1) translateY(0)';
      e.currentTarget.style.background = 'linear-gradient(145deg, #2a2a2a, #404040)';
      e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.1)';
      e.currentTarget.style.animation = 'pulse 3s infinite'; // Resume pulse
    }}
    onTouchStart={(e) => {
      e.currentTarget.style.transform = 'scale(0.95)';
      e.currentTarget.style.background = 'linear-gradient(145deg, #1a1a1a, #303030)';
    }}
    onTouchEnd={(e) => {
      e.currentTarget.style.transform = 'scale(1)';
      e.currentTarget.style.background = 'linear-gradient(145deg, #2a2a2a, #404040)';
    }}
    title="Add Item"
    >
      ➕
      <style jsx>{`
        @keyframes pulse {
          0% {
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.1);
          }
          50% {
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.25), inset 0 1px 0 rgba(255, 255, 255, 0.12);
          }
          100% {
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.1);
          }
        }
      `}</style>
    </Link>
  );
} 