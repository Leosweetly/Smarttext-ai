import { Roboto } from "next/font/google";
import { Auth0ProviderWrapper } from "./auth-provider";
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
      </head>
      <body className={roboto.className}>
        <Auth0ProviderWrapper>
          {children}
        </Auth0ProviderWrapper>
      </body>
    </html>
  );
}
