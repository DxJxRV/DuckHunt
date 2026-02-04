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
        <style>{`
          * {
            -webkit-tap-highlight-color: transparent;
            -webkit-touch-callout: none;
          }
        `}</style>
      </head>
      <body
        style={{
          margin: 0,
          padding: 0,
          fontFamily: "system-ui, -apple-system, sans-serif",
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
