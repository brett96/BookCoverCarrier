import type { Metadata } from "next";
import { Nunito, Open_Sans } from "next/font/google";
import { AnalyticsProvider } from "@/components/analytics/AnalyticsProvider";
import "@/styles/marketing.css";

const nunito = Nunito({
  subsets: ["latin"],
  weight: ["300", "400", "600", "700", "800", "900"],
  display: "swap",
});

const openSans = Open_Sans({
  subsets: ["latin"],
  weight: ["300", "400", "600"],
  display: "swap",
});

export const metadata: Metadata = {
  title:
    "BookCover — Managed Member Engagement & Retention Services for Health Plans",
  description:
    "BookCover pairs your organization with a dedicated retention consultant who leads your engagement strategy, manages outreach campaigns, and works alongside your team year-round.",
};

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div
      className={`${nunito.className} ${openSans.className}`}
      style={{ fontFamily: `${openSans.style.fontFamily}, Open Sans, sans-serif` }}
    >
      <AnalyticsProvider>{children}</AnalyticsProvider>
    </div>
  );
}
