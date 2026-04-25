export const GA_ID = "G-K5064BTGGY";

declare global {
  interface Window {
    gtag: (...args: any[]) => void;
  }
}

export const trackEvent = (name: string, params = {}) => {
  if (typeof window !== "undefined" && window.gtag) {
    window.gtag("event", name, params);
  }
};