import Link from 'next/link';
import { useRouter } from 'next/router';
import { useState, useEffect } from 'react';
import ThemeToggle from './ThemeToggle';
import { supabase } from '../lib/supabase';

export default function Navigation() {
  const router = useRouter();
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkIsMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    
    checkIsMobile();
    window.addEventListener('resize', checkIsMobile);
    
    return () => window.removeEventListener('resize', checkIsMobile);
  }, []);

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
      router.push('/login');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const navItems = [
    { href: '/', label: 'Home', icon: '🏠' },
    { href: '/inventory', label: 'Inventory', icon: '📦' },
    { href: '/shopping-list', label: 'Shopping List', icon: '🛒' },
    { href: '/households', label: 'Households', icon: '👥' },
    { href: '/add-item', label: 'Add Item', icon: '➕' }
  ];

  // Mobile: Ultra-compact bottom navigation with Android gesture bar padding
  if (isMobile) {
    return (
      <nav style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        background: 'var(--nav-bg)',
        borderTop: '1px solid var(--nav-border)',
        padding: '4px 8px', // Reduced padding
        paddingBottom: 'calc(4px + env(safe-area-inset-bottom))', // Android gesture bar padding
        zIndex: 1000,
        boxShadow: '0 -1px 6px rgba(0, 0, 0, 0.08)' // Lighter shadow
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          maxWidth: '100%',
          margin: '0 auto'
        }}>
          {/* Left side - Navigation items */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-around',
            alignItems: 'center',
            flex: 1
          }}>
            {navItems.map((item) => {
              const isActive = router.pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    textDecoration: 'none',
                    color: isActive ? '#ffffff' : 'var(--nav-text-secondary)',
                    padding: '3px 5px', // Reduced padding
                    borderRadius: '4px',
                    transition: 'all 0.15s ease',
                    fontSize: '9px', // Reduced font size
                    fontWeight: isActive ? '700' : '600', // Kept bold
                    minWidth: '40px' // Ensure consistent spacing
                  }}
                  onMouseEnter={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.color = 'var(--primary)';
                      e.currentTarget.style.transform = 'translateY(-0.5px)'; // Smaller hover effect
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.color = 'var(--nav-text-secondary)';
                      e.currentTarget.style.transform = 'translateY(0)';
                    }
                  }}
                >
                  <div style={{ fontSize: '14px', marginBottom: '1px' }}>{item.icon}</div> {/* Smaller icon */}
                  <span style={{ lineHeight: '1' }}>{item.label}</span> {/* Tighter line height */}
                </Link>
              );
            })}
          </div>

          {/* Right side - Theme toggle and Sign out for mobile */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            marginLeft: '10px'
          }}>
            <ThemeToggle />
            <button
              onClick={handleSignOut}
              style={{
                padding: '3px 6px',
                background: 'transparent',
                color: 'var(--nav-text-secondary)',
                border: 'none',
                borderRadius: 3,
                cursor: 'pointer',
                fontSize: '8px',
                fontWeight: '400',
                transition: 'all 0.2s ease',
                opacity: 0.7
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.opacity = '1';
                e.currentTarget.style.color = 'var(--nav-text)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.opacity = '0.7';
                e.currentTarget.style.color = 'var(--nav-text-secondary)';
              }}
            >
              Sign Out
            </button>
          </div>
        </div>
      </nav>
    );
  }

        // Desktop: Compact top navigation with theme toggle and sign out
      return (
        <nav style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          background: 'var(--nav-bg)',
          borderBottom: '1px solid var(--nav-border)',
          padding: '10px 20px', // Reduced padding
          zIndex: 1000,
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)' // Enhanced shadow for dark nav
        }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        maxWidth: '600px', // Increased to accommodate controls
        margin: '0 auto'
      }}>
        {/* Left side - Navigation items */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-around',
          alignItems: 'center',
          flex: 1
        }}>
          {navItems.map((item) => {
            const isActive = router.pathname === item.href;
            return (
                                <Link
                    key={item.href}
                    href={item.href}
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      textDecoration: 'none',
                      color: isActive ? '#ffffff' : 'var(--nav-text-secondary)',
                      padding: '6px 10px', // Reduced padding
                      borderRadius: '6px',
                      transition: 'all 0.15s ease',
                      fontSize: '12px', // Reduced font size
                      fontWeight: isActive ? '700' : '600' // Kept bold
                    }}
                    onMouseEnter={(e) => {
                      if (!isActive) {
                        e.currentTarget.style.color = 'var(--primary)';
                        e.currentTarget.style.transform = 'translateY(-1px)'; // Smaller hover effect
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isActive) {
                        e.currentTarget.style.color = 'var(--nav-text-secondary)';
                        e.currentTarget.style.transform = 'translateY(0)';
                      }
                    }}
                  >
                    <div style={{ fontSize: '16px', marginBottom: '2px' }}>{item.icon}</div> {/* Smaller icon */}
                    <span>{item.label}</span>
                  </Link>
            );
          })}
        </div>

        {/* Right side - Theme toggle and Sign out */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          marginLeft: '20px'
        }}>
                        <ThemeToggle />
              <button
                onClick={handleSignOut}
                style={{
                  padding: '6px 12px',
                  background: 'var(--nav-border)',
                  color: 'var(--nav-text-secondary)',
                  border: '1px solid var(--nav-border)',
                  borderRadius: 6,
                  cursor: 'pointer',
                  fontSize: '11px',
                  fontWeight: '500',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'var(--primary)';
                  e.currentTarget.style.color = 'var(--nav-text)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'var(--nav-border)';
                  e.currentTarget.style.color = 'var(--nav-text-secondary)';
                }}
              >
                Sign Out
              </button>
        </div>
      </div>
    </nav>
  );
} 