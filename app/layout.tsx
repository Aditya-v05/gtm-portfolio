import type { Metadata } from "next";
import { Londrina_Solid, Amatic_SC, Nunito, JetBrains_Mono } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";

// The type the user chose: open-licence stand-ins for their references.
// Londrina Solid recreates Lore (imperfect hand-lettered capitals) for the
// name and headings; Amatic SC recreates Juniper Bay (condensed marker caps)
// for labels; Nunito is the calm, rounded reading face; mono only inside
// terminal readouts.
const display = Londrina_Solid({
  subsets: ["latin"],
  weight: ["300", "400", "900"],
  variable: "--font-display-src",
});

const label = Amatic_SC({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-label-src",
});

const text = Nunito({
  subsets: ["latin"],
  style: ["normal", "italic"],
  variable: "--font-text-src",
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
  themeColor: "#fbf1c4",
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
      className={`${display.variable} ${label.variable} ${text.variable} ${mono.variable}`}
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
