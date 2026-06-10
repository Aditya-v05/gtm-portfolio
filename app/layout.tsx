import type { Metadata } from "next";
import { Fraunces, Archivo, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const fraunces = Fraunces({
  subsets: ["latin"],
  style: ["normal", "italic"],
  variable: "--font-display",
  axes: ["opsz"],
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

export const metadata: Metadata = {
  title: "Aditya — GTM Engineer",
  description:
    "GTM Engineer · Data & Automation. I build GTM systems that run themselves — collection, enrichment, customer-overlap detection, LLM classification, and live outbound.",
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#0E0C08",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    // suppressHydrationWarning on <html>: the inline script below may switch
    // data-theme to the stored value before React hydrates.
    <html
      lang="en"
      data-theme="light"
      suppressHydrationWarning
      className={`${fraunces.variable} ${archivo.variable} ${jetbrains.variable}`}
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
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
