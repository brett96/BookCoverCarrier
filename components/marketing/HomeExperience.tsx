"use client";

import { useEffect, useRef } from "react";
import { useTrackEvent } from "@/components/analytics/AnalyticsProvider";

const TAB_IDS = ["overview", "member", "retention", "consulting"] as const;
type TabId = (typeof TAB_IDS)[number];

const TAB_LABELS: Record<TabId, string> = {
  overview: "What is BookCover?",
  member: "Member Tools",
  retention: "Retention Platform",
  consulting: "Your Dedicated Consultant",
};

export function HomeExperience({ html }: { html: string }) {
  const rootRef = useRef<HTMLDivElement>(null);
  const track = useTrackEvent();

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    const tabBtns = Array.from(root.querySelectorAll<HTMLElement>(".page-tab"));
    const panels = TAB_IDS.map((id) =>
      root.querySelector<HTMLElement>(`#tab-${id}`),
    );

    const stickyHeight = () => {
      const navEl = root.querySelector<HTMLElement>("nav");
      const tabsEl = root.querySelector<HTMLElement>(".page-tabs");
      return (
        (navEl?.getBoundingClientRect().height ?? 0) +
        (tabsEl?.getBoundingClientRect().height ?? 0)
      );
    };

    const activate = (id: TabId, source: "tab" | "see_more") => {
      TAB_IDS.forEach((tid, i) => {
        tabBtns[i]?.classList.toggle("on", tid === id);
        panels[i]?.classList.toggle("on", tid === id);
      });
      const offset = stickyHeight();
      window.scrollTo({ top: Math.max(0, offset - 4), behavior: "smooth" });
      track("tab_view", {
        context: "home",
        tab: TAB_LABELS[id],
        source,
      });
    };

    const tabHandlers = tabBtns.map((_, idx) => () => {
      const id = TAB_IDS[idx];
      if (id) activate(id, "tab");
    });
    tabBtns.forEach((btn, idx) => {
      btn.addEventListener("click", tabHandlers[idx]!);
    });

    const seeMore = Array.from(
      root.querySelectorAll<HTMLElement>(".see-more-btn"),
    );
    const seeHandlers = seeMore.map((btn) => () => {
      const panel = btn.closest<HTMLElement>(".page-panel");
      const idx = panels.findIndex((p) => p === panel);
      const next = TAB_IDS[idx + 1];
      if (next) activate(next, "see_more");
    });
    seeMore.forEach((btn, idx) => {
      btn.addEventListener("click", seeHandlers[idx]!);
    });

    const ctaLinks = Array.from(
      root.querySelectorAll<HTMLAnchorElement>('a[href="/contact"]'),
    );
    const ctaHandlers = ctaLinks.map((a) => () => {
      const cls = a.className || "";
      let location = "inline";
      if (cls.includes("nav-cta")) location = "nav";
      else if (cls.includes("btn-p")) location = "hero";
      else if (cls.includes("btn-w")) location = "cta_section";
      track("cta_click", {
        label: a.textContent?.trim() || "Contact",
        location,
      });
    });
    ctaLinks.forEach((a, idx) => {
      a.addEventListener("click", ctaHandlers[idx]!);
    });

    return () => {
      tabBtns.forEach((btn, idx) => {
        btn.removeEventListener("click", tabHandlers[idx]!);
      });
      seeMore.forEach((btn, idx) => {
        btn.removeEventListener("click", seeHandlers[idx]!);
      });
      ctaLinks.forEach((a, idx) => {
        a.removeEventListener("click", ctaHandlers[idx]!);
      });
    };
  }, [html, track]);

  return <div ref={rootRef} dangerouslySetInnerHTML={{ __html: html }} />;
}
