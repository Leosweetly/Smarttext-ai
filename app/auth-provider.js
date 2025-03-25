"use client";

import { Auth0Provider } from "@auth0/nextjs-auth0";
import { auth0Config } from "../auth0.config";
import { useEffect } from "react";

export function Auth0ProviderWrapper({ children }) {
  // Log Auth0 initialization for debugging
  useEffect(() => {
    console.log("[Auth] Auth0Provider initialized with config", {
      baseURL: auth0Config.baseURL,
      issuerBaseURL: auth0Config.issuerBaseURL,
      clientID: auth0Config.clientID,
      routes: auth0Config.routes,
    });
  }, []);

  return (
    <Auth0Provider {...auth0Config}>
      {children}
    </Auth0Provider>
  );
}
