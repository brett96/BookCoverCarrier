"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
} from "react";
import { usePathname } from "next/navigation";

const VID = "bc_vid";
const SID = "bc_sid";
const SESSION_MS = 30 * 60 * 1000;

type TrackPayload = Record<string, unknown>;

type Ctx = (type: string, properties?: TrackPayload) => void;

const TrackContext = createContext<Ctx>(() => {});

function randomId() {
  const a = new Uint8Array(16);
  crypto.getRandomValues(a);
  return Array.from(a, (b) => b.toString(16).padStart(2, "0")).join("");
}

function getCookie(name: string) {
  if (typeof document === "undefined") return null;
  const m = document.cookie.match(
    new RegExp(
      "(?:^|; )" + name.replace(/([.$?*|{}()[\]\\/+^])/g, "\\$1") + "=([^;]*)"
    )
  );
  return m ? decodeURIComponent(m[1]!) : null;
}

function setCookie(name: string, value: string, maxAgeSec: number) {
  document.cookie = `${encodeURIComponent(name)}=${encodeURIComponent(value)}; path=/; max-age=${maxAgeSec}; SameSite=Lax`;
}

function ensureIds() {
  let vid = getCookie(VID);
  if (!vid) {
    vid = randomId();
    setCookie(VID, vid, 60 * 60 * 24 * 730);
  }
  let sid = getCookie(SID);
  const now = Date.now();
  const last = getCookie("bc_sid_ts");
  if (!sid || !last || now - Number(last) > SESSION_MS) {
    sid = randomId();
    setCookie(SID, sid, 60 * 30);
  }
  setCookie("bc_sid_ts", String(now), 60 * 30);
  return { vid, sid };
}

function parseUtm(search: string) {
  const p = new URLSearchParams(search.startsWith("?") ? search.slice(1) : search);
  return {
    utm_source: p.get("utm_source") ?? undefined,
    utm_medium: p.get("utm_medium") ?? undefined,
    utm_campaign: p.get("utm_campaign") ?? undefined,
  };
}

function currentSearch() {
  if (typeof window === "undefined") return "";
  return window.location.search.slice(1);
}

function sendBeacon(payload: unknown) {
  const body = JSON.stringify(payload);
  if (navigator.sendBeacon) {
    const blob = new Blob([body], { type: "application/json" });
    navigator.sendBeacon("/api/track", blob);
  } else {
    void fetch("/api/track", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body,
      keepalive: true,
    });
  }
}

export function AnalyticsProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const scrollMarks = useRef<Set<number>>(new Set());

  const track = useCallback((eventType: string, properties?: TrackPayload) => {
    const { vid, sid } = ensureIds();
    const utm = parseUtm(currentSearch());
    sendBeacon({
      visitorId: vid,
      sessionId: sid,
      eventType,
      path: pathname + (currentSearch() ? `?${currentSearch()}` : ""),
      referrer:
        typeof document !== "undefined" ? document.referrer || null : null,
      ...utm,
      properties: properties ?? {},
    });
  }, [pathname]);

  useEffect(() => {
    scrollMarks.current = new Set();
  }, [pathname]);

  useEffect(() => {
    ensureIds();
    const { vid, sid } = ensureIds();
    const utm = parseUtm(currentSearch());
    sendBeacon({
      visitorId: vid,
      sessionId: sid,
      eventType: "pageview",
      path: pathname + (currentSearch() ? `?${currentSearch()}` : ""),
      referrer: document.referrer || null,
      ...utm,
      properties: {},
    });
  }, [pathname]);

  useEffect(() => {
    const onScroll = () => {
      const doc = document.documentElement;
      const h = doc.scrollHeight - window.innerHeight;
      if (h <= 0) return;
      const p = Math.round((window.scrollY / h) * 100);
      for (const m of [25, 50, 75, 100] as const) {
        if (p >= m && !scrollMarks.current.has(m)) {
          scrollMarks.current.add(m);
          track("scroll_depth", { percent: m, path: pathname });
        }
      }
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, [pathname, track]);

  return (
    <TrackContext.Provider value={track}>{children}</TrackContext.Provider>
  );
}

export function useTrackEvent() {
  return useContext(TrackContext);
}
