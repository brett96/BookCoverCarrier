import fs from "node:fs";
import path from "node:path";
import { HomeExperience } from "@/components/marketing/HomeExperience";
import { fixMojibake } from "@/lib/marketing/fixMojibake";

function clean(html: string) {
  return fixMojibake(html)
    .replace(/https?:\/\/www\.cercalabs\.com\/contact\/?/g, "/contact")
    .replace(/BookCover_Contact\.html/g, "/contact")
    .replace(/href="#"/g, 'href="/"')
    .replace(/\s*onclick="[^"]*"/g, "");
}

export default function HomePage() {
  const html = clean(
    fs.readFileSync(path.join(process.cwd(), "content", "home.html"), "utf8"),
  );
  return <HomeExperience html={html} />;
}
