import { useState, useEffect } from "react";

// Tracks whether the viewport is at or below `breakpoint` (default 680px —
// below this, the header's Submissions/My Requests links no longer fit
// alongside the logo and profile button on one line).
export default function useIsMobile(breakpoint = 680) {
  const query = `(max-width: ${breakpoint}px)`;
  const [isMobile, setIsMobile] = useState(
    () => typeof window !== "undefined" && window.matchMedia(query).matches
  );

  useEffect(() => {
    const mql = window.matchMedia(query);
    const handler = (e) => setIsMobile(e.matches);
    mql.addEventListener("change", handler);
    return () => mql.removeEventListener("change", handler);
  }, [query]);

  return isMobile;
}
