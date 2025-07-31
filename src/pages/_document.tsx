import { Html, Head, Main, NextScript } from "next/document";

export default function Document() {
  return (
    <Html lang="en">
      <Head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#22c55e" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="PantryPal" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <meta name="msapplication-TileColor" content="#22c55e" />
        <meta name="msapplication-config" content="/browserconfig.xml" />
        {/* Early PWA event listener setup */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              // Setup beforeinstallprompt listener as early as possible
              window.addEventListener('beforeinstallprompt', function(e) {
                console.log('🎉 Early PWA install prompt triggered!');
                e.preventDefault();
                // Store the event for later use
                window.deferredPrompt = e;
                // Trigger a custom event to notify React
                window.dispatchEvent(new CustomEvent('beforeinstallprompt-captured', { detail: e }));
              });
            `,
          }}
        />
      </Head>
      <body className="antialiased">
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
