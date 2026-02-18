"use client";

import { useEffect } from "react";

export function WebVitals() {
  useEffect(() => {
    if (typeof window === "undefined") return;

    import("web-vitals").then(({ onCLS, onINP, onLCP, onFCP, onTTFB }) => {
      const log = (metric: { name: string; value: number; rating: string }) => {
        if (process.env.NODE_ENV === "development") {
          const color = metric.rating === "good" ? "green" : metric.rating === "needs-improvement" ? "orange" : "red";
          console.log(`[Web Vitals] %c${metric.name}: ${Math.round(metric.value)}ms (${metric.rating})`, `color: ${color}`);
        }
      };

      onCLS(log);
      onINP(log);
      onLCP(log);
      onFCP(log);
      onTTFB(log);
    }).catch(() => {});
  }, []);

  return null;
}
