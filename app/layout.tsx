import { QueryProvider } from "@/components/query-provider";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/auth-context";
import { FontProvider } from "@/contexts/font-context";
import { SocketProvider } from "@/contexts/socket-context";
import type { Metadata } from "next";
import { Geist, Geist_Mono, Manrope, Noto_Sans } from "next/font/google";
import NextToploader from "nextjs-toploader";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const inter = Noto_Sans({
  variable: "--font-inter",
  subsets: ["latin", "vietnamese"],
  weight: ["300", "400", "500", "700"],
});

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Hệ thống Onmichannel",
  description: "Bảng quản trị hệ thống đa kênh Onmichannel của CGV Telecom",
  icons: {
    icon: "/logocon/logo_icon_1.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="font-inter" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var font = localStorage.getItem('app-font');
                  if (font && ['inter', 'manrope', 'system'].includes(font)) {
                    document.documentElement.classList.remove('font-inter');
                    document.documentElement.classList.add('font-' + font);
                  }
                } catch (e) {}
              })();
            `,
          }}
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${inter.variable} ${manrope.variable} antialiased`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <TooltipProvider delayDuration={0}>
            <FontProvider>
              <NextToploader
                color="var(--primary)"
                showSpinner={false}
                showForHashAnchor={false}
              />
              <QueryProvider>
                <AuthProvider>
                  <SocketProvider>
                    {children}
                    <Toaster richColors />
                  </SocketProvider>
                </AuthProvider>
              </QueryProvider>
            </FontProvider>
          </TooltipProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
