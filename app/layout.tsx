import type { Metadata } from "next";
import { Edu_SA_Hand, Zeyada, Newsreader, JetBrains_Mono } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import InkDefs from "@/components/notebook/InkDefs";
import DrawObserver from "@/components/notebook/DrawObserver";
import "./globals.css";

// The notebook's two hands. Both are open-licence stand-ins that recreate the
// look of the references (a neat blue ballpoint hand and a rushed scratchy
// pen); the ballpoint streaks come from our own SVG filter in InkDefs. Swap a
// hand here and every heading follows.
const handNeat = Edu_SA_Hand({
  subsets: ["latin"],
  weight: "variable",
  variable: "--hand-neat-src",
});

const handRush = Zeyada({
  subsets: ["latin"],
  weight: "400",
  variable: "--hand-rush-src",
});

// the clean face, for anything longer than a sentence
const text = Newsreader({
  subsets: ["latin"],
  style: ["normal", "italic"],
  axes: ["opsz"],
  variable: "--font-text-src",
});

// only inside taped-in printouts (the terminal readouts)
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
  title: "Aditya's idea dump - GTM Engineer",
  description,
  openGraph: {
    title: "Aditya's idea dump - GTM Engineer",
    description:
      "ex-Founding GTM Engineer @ Relling (YC S25). I build GTM systems that run themselves.",
    images: [{ url: "/og.png", width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Aditya's idea dump - GTM Engineer",
    description:
      "ex-Founding GTM Engineer @ Relling (YC S25). I build GTM systems that run themselves.",
    images: ["/og.png"],
  },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#f6f3ec",
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
      className={`${handNeat.variable} ${handRush.variable} ${text.variable} ${mono.variable}`}
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
        <InkDefs />
        {children}
        <DrawObserver />
        <Analytics />
      </body>
    </html>
  );
}
