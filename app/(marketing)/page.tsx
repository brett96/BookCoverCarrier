import fs from "node:fs";
import path from "node:path";
import { HomeExperience } from "@/components/marketing/HomeExperience";
import { cleanHomeHtml } from "@/lib/marketing/cleanMarketingHtml";

export default function HomePage() {
  const html = cleanHomeHtml(
    fs.readFileSync(path.join(process.cwd(), "content", "home.html"), "utf8"),
  );
  return <HomeExperience html={html} />;
}
