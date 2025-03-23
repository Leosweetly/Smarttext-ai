"use client";

import { useEffect } from "react";
import Script from "next/script";
import { usePathname, useSearchParams } from "next/navigation";

// Google Analytics Measurement ID
const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;

export default function Analytics() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  
  // Track page views when the route changes
  useEffect(() => {
    if (!GA_MEASUREMENT_ID) return;
    
    const url = pathname + (searchParams?.toString() ? `?${searchParams.toString()}` : "");
    
    // Track page view
    window.gtag?.("config", GA_MEASUREMENT_ID, {
      page_path: url,
    });
  }, [pathname, searchParams]);
  
  if (!GA_MEASUREMENT_ID) {
    return null;
  }
  
  return (
    <>
      {/* Google Analytics Script */}
      <Script
        strategy="afterInteractive"
        src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`}
      />
      <Script
        id="google-analytics"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: `
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', '${GA_MEASUREMENT_ID}', {
              page_path: window.location.pathname,
            });
          `,
        }}
      />
    </>
  );
}

// Helper function to track events
export function trackEvent(action, category, label, value) {
  if (!GA_MEASUREMENT_ID || typeof window === "undefined") return;
  
  window.gtag?.("event", action, {
    event_category: category,
    event_label: label,
    value: value,
  });
}
