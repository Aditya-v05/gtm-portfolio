import type { Metadata } from "next";
import { Nunito, Newsreader, JetBrains_Mono, Alegreya } from "next/font/google";
import localFont from "next/font/local";
import { Analytics } from "@vercel/analytics/next";
import ClickBurst from "@/components/ClickBurst";
import "./globals.css";

// The user's own fonts. Ithaca (SIL Open Font Licence) is the pixel display
// face for headings. Spartacus (freeware, non-commercial) is the Greek
// inscription face for the name, labels and card plates. Nunito is the calm
// reading face; mono only inside terminal readouts.
const display = localFont({ src: "./fonts/Ithaca.ttf", variable: "--font-display-src" });
const label = localFont({ src: "./fonts/Spartacus.ttf", variable: "--font-label-src" });

// serif, only for the dotted closing question
const serif = Newsreader({ subsets: ["latin"], variable: "--font-serif-src" });

// a sturdy calligraphic face, like pen on papyrus, for the About scroll
const pixel = Alegreya({ subsets: ["latin"], style: ["normal", "italic"], variable: "--font-book-src" });

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
  "ex-Founding GTM Engineer @ Relling (YC S25). I build GTM systems that run themselves.";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: "Aditya Venkatesan - GTM Engineer",
  description,
  openGraph: {
    title: "Aditya Venkatesan - GTM Engineer",
    description:
      "ex-Founding GTM Engineer @ Relling (YC S25). I build GTM systems that run themselves.",
    images: [{ url: "/og-aqueduct.png", width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Aditya Venkatesan - GTM Engineer",
    description:
      "ex-Founding GTM Engineer @ Relling (YC S25). I build GTM systems that run themselves.",
    images: ["/og-aqueduct.png"],
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
      className={`${display.variable} ${pixel.variable} ${serif.variable} ${label.variable} ${text.variable} ${mono.variable}`}
    >
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html:
              // Some browser extensions stamp bis_skin_checked onto every div before React starts, which React
              // then reports as a mismatch. Take it off again as it appears, until the page has loaded.
              "(function(){var A='bis_skin_checked',o=new MutationObserver(function(m){for(var i=0;i<m.length;i++){var r=m[i];if(r.type==='attributes'){if(r.target.hasAttribute(A))r.target.removeAttribute(A)}else for(var j=0;j<r.addedNodes.length;j++){var n=r.addedNodes[j];if(n.nodeType===1){if(n.hasAttribute(A))n.removeAttribute(A);var q=n.querySelectorAll('['+A+']');for(var k=0;k<q.length;k++)q[k].removeAttribute(A)}}}});o.observe(document.documentElement,{subtree:true,childList:true,attributes:true,attributeFilter:[A]});addEventListener('load',function(){setTimeout(function(){o.disconnect()},3000)})})();" +
              "document.documentElement.classList.add('js');try{try{localStorage.removeItem('theme')}catch(e){}var t=sessionStorage.getItem('theme');if(t==='dark'){document.documentElement.dataset.theme=t}if(sessionStorage.getItem('loader')&&!/[?&]loader\\b/.test(location.search)){document.documentElement.classList.add('quick-loader')}}catch(e){}",
          }}
        />
      </head>
      {/* suppressHydrationWarning: some browser extensions inject attributes
          onto <body> before React hydrates. */}
      <body suppressHydrationWarning>
        {children}
        <ClickBurst />
        <Analytics />
      </body>
    </html>
  );
}
