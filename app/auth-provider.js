"use client";

import { Auth0Provider } from "@auth0/nextjs-auth0";

export function Auth0ProviderWrapper({ children }) {
  return (
    <Auth0Provider>
      {children}
    </Auth0Provider>
  );
}
