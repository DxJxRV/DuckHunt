import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "DuckHunt - Hand Tracking Game",
  description: "Hand tracking game using MediaPipe and Next.js",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          padding: 0,
          fontFamily: "system-ui, -apple-system, sans-serif",
          backgroundColor: "#0a0a0a",
          color: "#ffffff",
        }}
      >
        {children}
      </body>
    </html>
  );
}
