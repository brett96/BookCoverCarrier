import type { Metadata } from "next";
import fs from "node:fs";
import path from "node:path";
import { cleanPrivacyHtml } from "@/lib/marketing/cleanMarketingHtml";

export const metadata: Metadata = {
  title: "BookCover | Privacy Policy",
  description:
    "How CercaLabs collects, uses, and protects information in connection with the BookCover platform and demonstration portal.",
};

export default function PrivacyPage() {
  const html = cleanPrivacyHtml(
    fs.readFileSync(path.join(process.cwd(), "content", "privacy.html"), "utf8"),
  );

  return <div dangerouslySetInnerHTML={{ __html: html }} />;
}
