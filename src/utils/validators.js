import { env } from "../config/env.js";

export const validateRedirectUrl = (url) => {
  if (!url) return null;
  
  try {
    const parsed = new URL(url);
    const frontendUrl = new URL(env.FRONTEND_URL);
    
    // Only allow redirects to same host as frontend
    if (parsed.host === frontendUrl.host) {
      return url;
    }
    
    return null;
  } catch {
    // If URL parsing fails, check if it's a relative path
    if (url.startsWith("/") && !url.startsWith("//")) {
      return url;
    }
    return null;
  }
};