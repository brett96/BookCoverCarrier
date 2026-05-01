"use client";

import { useEffect, useRef } from "react";
import { useTrackEvent } from "@/components/analytics/AnalyticsProvider";

type Props = {
  part1: string;
  admin: string;
  member: string;
  part2: string;
};

export function CarrierExperience({ part1, admin, member, part2 }: Props) {
  const track = useTrackEvent();
  const p1 = useRef<HTMLDivElement>(null);
  const adm = useRef<HTMLDivElement>(null);
  const mem = useRef<HTMLDivElement>(null);
  const p2 = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = p1.current;
    if (!root) return;
    const menu = root.querySelector("#nav-mobile-menu");
    const burger = root.querySelector(".nav-hamburger");
    const onBurger = () => menu?.classList.toggle("open");
    burger?.addEventListener("click", onBurger);
    const close = () => menu?.classList.remove("open");
    root.querySelectorAll("#nav-mobile-menu a").forEach((a) => {
      a.addEventListener("click", close);
    });
    const onDoc = (e: MouseEvent) => {
      if (
        menu?.classList.contains("open") &&
        !menu.contains(e.target as Node) &&
        !burger?.contains(e.target as Node)
      )
        close();
    };
    document.addEventListener("click", onDoc);
    root.querySelectorAll('a[href="/contact"]').forEach((a) => {
      a.addEventListener("click", () => {
        const cls = (a as HTMLElement).className || "";
        let location = "inline";
        if (cls.includes("nav-cta")) location = "nav_desktop";
        if (cls.includes("nav-mobile-cta")) location = "nav_mobile";
        if (cls.includes("btn-p")) location = "hero";
        if (cls.includes("btn-w")) location = "cta_section";
        track("cta_click", { label: "Contact Our Team", location });
      });
    });
    return () => {
      burger?.removeEventListener("click", onBurger);
      document.removeEventListener("click", onDoc);
    };
  }, [part1, track]);

  useEffect(() => {
    const root = adm.current;
    if (!root) return;
    const btns = Array.from(root.querySelectorAll(".admin-tab-btn"));
    const panels = Array.from(root.querySelectorAll(".admin-panel"));
    const labels = [
      "Engagement Scoring",
      "Outreach Campaigns",
      "Book of Business Reporting",
      "Salesforce Integration",
    ];
    const handlers = btns.map((btn, idx) => () => {
      btns.forEach((b, j) => b.classList.toggle("active", j === idx));
      panels.forEach((p, j) => p.classList.toggle("active", j === idx));
      track("tab_view", {
        context: "admin_demo",
        tab: labels[idx] ?? String(idx),
        index: idx,
      });
    });
    btns.forEach((btn, idx) => btn.addEventListener("click", handlers[idx]!));
    return () =>
      btns.forEach((btn, idx) =>
        btn.removeEventListener("click", handlers[idx]!)
      );
  }, [admin, track]);

  useEffect(() => {
    const root = mem.current;
    if (!root) return;
    const btns = Array.from(root.querySelectorAll(".mc-tab-btn"));
    const panels = Array.from(root.querySelectorAll(".mc-panel"));
    const labels = [
      "Benefits Engagement",
      "Coverage Support",
      "Satisfaction Escalation",
      "AEP Plan Recommendation",
    ];
    const handlers = btns.map((btn, idx) => () => {
      btns.forEach((b, j) => b.classList.toggle("active", j === idx));
      panels.forEach((p, j) => p.classList.toggle("active", j === idx));
      track("tab_view", {
        context: "member_app",
        tab: labels[idx] ?? String(idx),
        index: idx,
      });
    });
    btns.forEach((btn, idx) => btn.addEventListener("click", handlers[idx]!));
    return () =>
      btns.forEach((btn, idx) =>
        btn.removeEventListener("click", handlers[idx]!)
      );
  }, [member, track]);

  useEffect(() => {
    const root = p2.current;
    if (!root) return;
    root.querySelectorAll('a[href="/contact"]').forEach((a) => {
      a.addEventListener("click", () => {
        track("cta_click", { label: "Contact Our Team", location: "footer_cta" });
      });
    });
  }, [part2, track]);

  return (
    <>
      <div ref={p1} dangerouslySetInnerHTML={{ __html: part1 }} />
      <div ref={adm} dangerouslySetInnerHTML={{ __html: admin }} />
      <div ref={mem} dangerouslySetInnerHTML={{ __html: member }} />
      <div ref={p2} dangerouslySetInnerHTML={{ __html: part2 }} />
    </>
  );
}
