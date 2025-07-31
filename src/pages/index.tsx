import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { useAuth } from "../contexts/AuthContext";
import Image from "next/image";
import ThemeToggle from "../components/ThemeToggle";

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}


export default function Home() {
  const { user, loading, signOut } = useAuth();
  const router = useRouter();
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showInstallButton, setShowInstallButton] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Check if mobile
  useEffect(() => {
    const checkIsMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    
    checkIsMobile();
    window.addEventListener('resize', checkIsMobile);
    
    return () => window.removeEventListener('resize', checkIsMobile);
  }, []);

  // PWA Install functionality
  useEffect(() => {
    const handler = (e: Event) => {
      console.log('🎉 PWA install prompt triggered!');
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setShowInstallButton(true);
    };

    // Check if already installed
    const isInstalled = window.matchMedia('(display-mode: standalone)').matches || 
                       (window.navigator as Navigator & { standalone?: boolean }).standalone === true;
    console.log('📱 Is app installed:', isInstalled);

    // Show install button if not installed
    if (!isInstalled) {
      // Check if the app meets install criteria
      const hasValidManifest = document.querySelector('link[rel="manifest"]') !== null;
      const hasServiceWorker = 'serviceWorker' in navigator;
      const isHttps = window.location.protocol === 'https:' || window.location.hostname === 'localhost';
      const isMobile = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      
      console.log('🔍 PWA Criteria Check:', {
        hasValidManifest,
        hasServiceWorker,
        isHttps,
        isMobile,
        userAgent: navigator.userAgent,
        url: window.location.href
      });
      
      // More permissive criteria - show install button if basic requirements are met
      if (hasValidManifest && isHttps) {
        console.log('✅ App meets basic install criteria, showing install button');
        setShowInstallButton(true);
      } else {
        console.log('❌ App does not meet install criteria');
        console.log('Missing:', {
          manifest: !hasValidManifest ? 'manifest.json not found' : 'OK',
          https: !isHttps ? 'Not HTTPS' : 'OK',
          serviceWorker: !hasServiceWorker ? 'Service worker not available' : 'OK'
        });
      }
    } else {
      console.log('✅ App is already installed');
    }

    window.addEventListener('beforeinstallprompt', handler);

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
    };
  }, []);

  const handleInstallClick = async () => {
    console.log('Install button clicked');
    console.log('Deferred prompt available:', !!deferredPrompt);
    console.log('Current URL:', window.location.href);
    console.log('User agent:', navigator.userAgent);
    
    if (deferredPrompt) {
      try {
        console.log('Triggering native install prompt...');
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        
        if (outcome === 'accepted') {
          console.log('✅ User accepted the install prompt');
          alert('Installation started! The app will be added to your home screen.');
        } else {
          console.log('❌ User dismissed the install prompt');
        }
        
        setDeferredPrompt(null);
        setShowInstallButton(false);
      } catch (error) {
        console.error('Error during install prompt:', error);
        // Fallback to manual instructions
        showManualInstallInstructions();
      }
    } else {
      console.log('No deferred prompt available, checking if we can trigger install manually...');
      
      // Try to trigger install for browsers that support it but don't fire beforeinstallprompt
      if (navigator.userAgent.includes('Chrome') || navigator.userAgent.includes('Edge')) {
        console.log('Chrome/Edge detected, trying alternative install method...');
        // For Chrome/Edge, we can try to show the install prompt in the address bar
        alert('For Chrome/Edge: Look for the install icon (📱) in your browser\'s address bar and click it to install the app.');
      } else {
        showManualInstallInstructions();
      }
    }
  };

  const showManualInstallInstructions = () => {
    const instructions = `To install this app:

📱 Chrome/Edge: Look for the install icon in the address bar
🍎 Safari: Tap the share button → "Add to Home Screen"
🦊 Firefox: Click the menu → "Install App"
📱 Mobile: Use your browser's "Add to Home Screen" option

The app must be accessed via HTTPS for installation to work.`;
    
    alert(instructions);
  };

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  // Show loading while checking authentication
  if (loading) {
    return (
      <div style={{ 
        minHeight: '100vh', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        background: 'var(--background)',
        color: 'var(--text-primary)'
      }}>
        <div style={{
          fontSize: '18px',
          fontWeight: '500'
        }}>Loading...</div>
      </div>
    );
  }

  // Don't render anything if not authenticated (will redirect)
  if (!user) {
    return null;
  }

  return (
                        <div style={{
      minHeight: '100vh',
      background: 'var(--background)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px'
      // No navigation on landing page - clean design
    }}>
      <div style={{
        background: 'var(--card-bg)',
        borderRadius: '20px',
        padding: isMobile ? '20px' : '40px',
        maxWidth: '500px',
        width: '100%',
        boxShadow: '0 12px 40px rgba(0, 0, 0, 0.15)',
        border: '1px solid var(--card-border)',
        position: 'relative',
        maxHeight: isMobile ? '90vh' : 'auto',
        overflow: isMobile ? 'auto' : 'visible'
      }}>
        {/* Theme Toggle and Sign Out - Positioned in top-right corner */}

        
        {/* Header */}
        <div style={{
          textAlign: 'center',
          marginBottom: '36px'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '14px',
            marginBottom: '16px'
          }}>
            <Image 
              src="/icon.svg" 
              alt="PantryPal Logo" 
              width={32} 
              height={32}
            />
                         <h1 style={{
               color: 'var(--text-primary)',
               fontSize: '28px',
               fontWeight: 'bold',
               margin: 0
             }}>
               Welcome to PantryTracker!
             </h1>
          </div>
        </div>

        {/* Main Action Buttons */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: isMobile ? '12px' : '16px',
          marginBottom: isMobile ? '24px' : '36px'
        }}>
          {/* Inventory */}
          <Link href="/inventory" style={{
            background: 'var(--success)',
            color: 'white',
            padding: isMobile ? '16px 12px' : '24px 16px',
            borderRadius: '14px',
            textDecoration: 'none',
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '12px',
            transition: 'all 0.3s ease',
            cursor: 'pointer',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-3px) scale(1.02)';
            e.currentTarget.style.boxShadow = '0 8px 24px rgba(0, 0, 0, 0.15)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0) scale(1)';
            e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.1)';
          }}
          >
            <div style={{ fontSize: isMobile ? '24px' : '32px' }}>📦</div>
            <div>
              <div style={{ fontWeight: 'bold', fontSize: isMobile ? '14px' : '18px', marginBottom: '3px' }}>Inventory</div>
              <div style={{ fontSize: isMobile ? '11px' : '13px', opacity: 0.9, lineHeight: '1.3' }}>Manage your pantry items</div>
            </div>
          </Link>

          {/* Shopping List */}
          <Link href="/shopping-list" style={{
            background: 'var(--primary)',
            color: 'white',
            padding: isMobile ? '16px 12px' : '24px 16px',
            borderRadius: '14px',
            textDecoration: 'none',
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '12px',
            transition: 'all 0.3s ease',
            cursor: 'pointer',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-3px) scale(1.02)';
            e.currentTarget.style.boxShadow = '0 8px 24px rgba(0, 0, 0, 0.15)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0) scale(1)';
            e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.1)';
          }}
          >
            <div style={{ fontSize: isMobile ? '24px' : '32px' }}>🛒</div>
            <div>
              <div style={{ fontWeight: 'bold', fontSize: isMobile ? '14px' : '18px', marginBottom: '3px' }}>Shopping List</div>
              <div style={{ fontSize: isMobile ? '11px' : '13px', opacity: 0.9, lineHeight: '1.3' }}>Track what you need to buy</div>
            </div>
          </Link>

          {/* Households */}
          <Link href="/households" style={{
            background: 'var(--warning)',
            color: 'white',
            padding: isMobile ? '16px 12px' : '24px 16px',
            borderRadius: '14px',
            textDecoration: 'none',
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '12px',
            transition: 'all 0.3s ease',
            cursor: 'pointer',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-3px) scale(1.02)';
            e.currentTarget.style.boxShadow = '0 8px 24px rgba(0, 0, 0, 0.15)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0) scale(1)';
            e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.1)';
          }}
          >
            <div style={{ fontSize: isMobile ? '24px' : '32px' }}>👥</div>
            <div>
              <div style={{ fontWeight: 'bold', fontSize: isMobile ? '14px' : '18px', marginBottom: '3px' }}>Households</div>
              <div style={{ fontSize: isMobile ? '11px' : '13px', opacity: 0.9, lineHeight: '1.3' }}>Manage household members</div>
            </div>
          </Link>

                     {/* Add Items */}
           <Link href="/add-item" style={{
             background: '#f97316',
             color: 'white',
             padding: isMobile ? '16px 12px' : '24px 16px',
             borderRadius: '14px',
             textDecoration: 'none',
             textAlign: 'center',
             display: 'flex',
             flexDirection: 'column',
             alignItems: 'center',
             gap: '12px',
             transition: 'all 0.3s ease',
             cursor: 'pointer',
             boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)'
           }}
           onMouseEnter={(e) => {
             e.currentTarget.style.transform = 'translateY(-3px) scale(1.02)';
             e.currentTarget.style.boxShadow = '0 8px 24px rgba(0, 0, 0, 0.15)';
           }}
           onMouseLeave={(e) => {
             e.currentTarget.style.transform = 'translateY(0) scale(1)';
             e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.1)';
           }}
           >
             <div style={{ fontSize: isMobile ? '24px' : '32px' }}>➕</div>
             <div>
               <div style={{ fontWeight: 'bold', fontSize: isMobile ? '14px' : '18px', marginBottom: '3px' }}>Add Items</div>
               <div style={{ fontSize: isMobile ? '11px' : '13px', opacity: 0.9, lineHeight: '1.3' }}>Scan and add new items</div>
             </div>
           </Link>
        </div>

        {/* User Account Section - Completely Separated */}
        <div style={{
          background: 'var(--card-bg)',
          border: '2px solid var(--border)',
          borderRadius: '16px',
          padding: '20px',
          marginTop: '24px',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)'
        }}>
          <div style={{
            color: 'var(--text-secondary)',
            marginBottom: '16px',
            fontSize: '13px',
            fontWeight: '500',
            textAlign: 'center'
          }}>
            Logged in as: {user.email}
          </div>
          
                     <div style={{
             display: 'flex',
             gap: '6px',
             justifyContent: 'center',
             alignItems: 'center',
             flexWrap: 'nowrap'
           }}>
                                         <button
                onClick={signOut}
                style={{
                  background: '#000000',
                  color: 'white',
                  border: 'none',
                  padding: '5px 10px',
                  borderRadius: '5px',
                  cursor: 'pointer',
                  fontSize: '11px',
                  fontWeight: '600',
                  transition: 'all 0.2s ease',
                  boxShadow: '0 2px 6px rgba(0, 0, 0, 0.1)',
                  whiteSpace: 'nowrap'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = '#333333';
                  e.currentTarget.style.transform = 'translateY(-1px)';
                  e.currentTarget.style.boxShadow = '0 3px 8px rgba(0, 0, 0, 0.15)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = '#000000';
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 2px 6px rgba(0, 0, 0, 0.1)';
                }}
              >
                Sign Out
              </button>
             
             {showInstallButton && (
                               <button
                  onClick={handleInstallClick}
                  style={{
                    background: '#000000',
                    color: 'white',
                    border: 'none',
                    padding: '5px 10px',
                    borderRadius: '5px',
                    cursor: 'pointer',
                    fontSize: '11px',
                    fontWeight: '600',
                    transition: 'all 0.2s ease',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    boxShadow: '0 2px 6px rgba(0, 0, 0, 0.1)',
                    whiteSpace: 'nowrap'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = '#333333';
                    e.currentTarget.style.transform = 'translateY(-1px)';
                    e.currentTarget.style.boxShadow = '0 3px 8px rgba(0, 0, 0, 0.15)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = '#000000';
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 2px 6px rgba(0, 0, 0, 0.1)';
                  }}
                  title="Install PantryPal as a PWA"
                >
                  <span style={{ fontSize: '11px' }}>📱</span>
                  Install
                </button>
             )}
            
            <ThemeToggle />
          </div>
        </div>
      </div>
      
                        {/* No navigation on landing page - clean design */}
    </div>
  );
}
