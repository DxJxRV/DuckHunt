import type { Metadata, Viewport } from "next";

export const metadata: Metadata = {
  title: "VOID HUNTER - Hand Tracking Defense Game",
  description: "Hand-powered cosmic defense game. Use your hands to create a black hole and consume enemy planes before they destroy your shield.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        {/* Google Fonts: Press Start 2P + Oxanium */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Press+Start+2P&family=Oxanium:wght@400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
        <style>{`
          * {
            -webkit-tap-highlight-color: transparent;
            -webkit-touch-callout: none;
          }

          :root {
            --font-heading: 'Press Start 2P', monospace;
            --font-body: 'Oxanium', system-ui, sans-serif;
          }
        `}</style>
      </head>
      <body
        style={{
          margin: 0,
          padding: 0,
          fontFamily: "var(--font-body)",
          backgroundColor: "#0a0a0a",
          color: "#ffffff",
          touchAction: "manipulation",
        }}
      >
        {children}
      </body>
    </html>
  );
}
