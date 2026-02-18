"use client";

import { useState, useCallback } from "react";

interface LiveAnnouncerProps {
  id?: string;
}

export function useLiveAnnouncer() {
  const [message, setMessage] = useState("");

  const announce = useCallback((text: string) => {
    setMessage("");
    requestAnimationFrame(() => setMessage(text));
  }, []);

  return { message, announce };
}

export function LiveAnnouncer({ id = "live-announcer" }: LiveAnnouncerProps) {
  return (
    <>
      <div
        id={id}
        role="status"
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
      />
      <div
        role="alert"
        aria-live="assertive"
        aria-atomic="true"
        className="sr-only"
        id={`${id}-alert`}
      />
    </>
  );
}
