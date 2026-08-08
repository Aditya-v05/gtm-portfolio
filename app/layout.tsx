import type { Metadata } from "next";
import { Space_Grotesk, Archivo, JetBrains_Mono } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-display",
});

const archivo = Archivo({
  subsets: ["latin"],
  style: ["normal", "italic"],
  variable: "--font-body",
});

const jetbrains = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  variable: "--font-mono",
});

const siteUrl = process.env.VERCEL_PROJECT_PRODUCTION_URL
  ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
  : "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: "Aditya - GTM Engineer @ Relling",
  description:
    "Founding GTM Engineer @ Relling (YC S25). I build GTM systems for physical AI - robotics, manufacturing and automation - where the data layer does not exist until you build it.",
  openGraph: {
    title: "Aditya - GTM Engineer @ Relling",
    description:
      "Founding GTM Engineer @ Relling (YC S25). I build GTM systems that run themselves.",
    images: [{ url: "/og.png", width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Aditya - GTM Engineer @ Relling",
    description:
      "Founding GTM Engineer @ Relling (YC S25). I build GTM systems that run themselves.",
    images: ["/og.png"],
  },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#0A1626",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    // Dark is the default. suppressHydrationWarning on <html>: the inline
    // script below may switch data-theme to a stored preference before React
    // hydrates, so the server and client markup can legitimately differ.
    <html
      lang="en"
      data-theme="dark"
      suppressHydrationWarning
      className={`${spaceGrotesk.variable} ${archivo.variable} ${jetbrains.variable}`}
    >
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html:
              "try{var t=localStorage.getItem('theme');if(t==='dark'||t==='light'){document.documentElement.dataset.theme=t}}catch(e){}",
          }}
        />
      </head>
      {/* suppressHydrationWarning: some browser extensions inject attributes
          (e.g. bis_register, __processed_*) onto <body> before React hydrates,
          which otherwise triggers a hydration mismatch warning. */}
      <body suppressHydrationWarning>
        {children}
        <Analytics />
      </body>
    </html>
  );
}
