import type { Metadata } from "next";
import { Newsreader, Inter, JetBrains_Mono } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";

// Editorial serif for display and reading, a quiet sans for labels, and
// mono only inside terminal readouts.
const serif = Newsreader({
  subsets: ["latin"],
  style: ["normal", "italic"],
  axes: ["opsz"],
  variable: "--font-serif-src",
});

const sans = Inter({
  subsets: ["latin"],
  variable: "--font-sans-src",
});

const mono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  variable: "--font-mono-src",
});

const siteUrl = process.env.VERCEL_PROJECT_PRODUCTION_URL
  ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
  : "http://localhost:3000";

const description =
  "ex-Founding GTM Engineer @ Relling (YC S25). I build GTM systems for physical AI - robotics, manufacturing and automation - where the data layer does not exist until you build it.";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: "Aditya Venkatesan - GTM Engineer",
  description,
  openGraph: {
    title: "Aditya Venkatesan - GTM Engineer",
    description:
      "ex-Founding GTM Engineer @ Relling (YC S25). I build GTM systems that run themselves.",
    images: [{ url: "/og.png", width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Aditya Venkatesan - GTM Engineer",
    description:
      "ex-Founding GTM Engineer @ Relling (YC S25). I build GTM systems that run themselves.",
    images: ["/og.png"],
  },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#f6f0e4",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    // Day is the default. suppressHydrationWarning on <html>: the inline
    // script below may switch data-theme to a stored preference (and add the
    // "js" class) before React hydrates, so server and client markup differ.
    <html
      lang="en"
      data-theme="light"
      suppressHydrationWarning
      className={`${serif.variable} ${sans.variable} ${mono.variable}`}
    >
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html:
              "document.documentElement.classList.add('js');try{var t=localStorage.getItem('theme');if(t==='dark'||t==='light'){document.documentElement.dataset.theme=t}}catch(e){}",
          }}
        />
      </head>
      {/* suppressHydrationWarning: some browser extensions inject attributes
          onto <body> before React hydrates. */}
      <body suppressHydrationWarning>
        {children}
        <Analytics />
      </body>
    </html>
  );
}
