import { QueryProvider } from "@/components/query-provider";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/auth-context";
import { CallSoftphoneHost } from "@/components/call-softphone-host";
import { CGVCallSDKProvider } from "@/components/cgv-call-sdk-provider";
import { AUTH_NAV_RECOVERY_INLINE_SCRIPT } from "@/constants/auth-navigation";
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
  title: "Hệ thống OMNI HUB",
  description: "Bảng quản trị hệ thống đa kênh OMNI HUB của CGV Telecom",
  icons: {
    icon: [{ url: "/icon", type: "image/png", sizes: "32x32" }],
    apple: [{ url: "/apple-icon", type: "image/png", sizes: "180x180" }],
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
            __html: AUTH_NAV_RECOVERY_INLINE_SCRIPT,
          }}
        />
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
                  <CGVCallSDKProvider>
                    <SocketProvider>
                      {children}
                      <Toaster richColors />
                    </SocketProvider>
                    <CallSoftphoneHost />
                  </CGVCallSDKProvider>
                </AuthProvider>
              </QueryProvider>
            </FontProvider>
          </TooltipProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
