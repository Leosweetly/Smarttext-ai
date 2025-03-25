import { Roboto } from "next/font/google";
import { Auth0ProviderWrapper } from "./auth-provider";
// TODO: Re-enable this import when the auth-context module is implemented
// import { AuthProvider } from "@/lib/auth-context";
import { ToastProvider } from "./components/Toast";
import { OnboardingProvider } from "@/lib/onboarding";
import Navigation from "./components/Navigation";
import "./globals.css";

const roboto = Roboto({
  subsets: ["latin"],
  weight: ["300", "400", "500", "700"],
  display: "swap",
  variable: "--font-roboto",
});

export const metadata = {
  title: "SmartText AI - Automated Responses for Missed Calls",
  description: "SmartText AI helps businesses respond to missed calls with personalized AI-generated text messages.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <style>{`
          html, body {
            height: 100%;
            margin: 0;
            padding: 0;
          }
          body {
            display: flex;
            flex-direction: column;
            min-height: 100vh;
          }
          main {
            flex: 1;
            display: flex;
            flex-direction: column;
          }
        `}</style>
      </head>
      <body className={roboto.className}>
        <Auth0ProviderWrapper>
          {/* TODO: Re-enable AuthProvider when the auth-context module is implemented */}
          {/* <AuthProvider> */}
            <ToastProvider>
              <OnboardingProvider>
                <Navigation />
                <main>{children}</main>
              </OnboardingProvider>
            </ToastProvider>
          {/* </AuthProvider> */}
        </Auth0ProviderWrapper>
      </body>
    </html>
  );
}
