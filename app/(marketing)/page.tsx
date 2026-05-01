import fs from "node:fs";
import path from "node:path";
import { CarrierExperience } from "@/components/marketing/CarrierExperience";

function clean(html: string) {
  return html
    .replace(/BookCover_Contact\.html/g, "/contact")
    .replace(/\s*onclick="[^"]*"/g, "")
    .replace(/href="#"/g, 'href="/"')
    .replace(/â€"/g, "\u2014")
    .replace(/â€™/g, "'");
}

export default function HomePage() {
  const dir = path.join(process.cwd(), "content");
  const read = (f: string) => clean(fs.readFileSync(path.join(dir, f), "utf8"));
  return (
    <CarrierExperience
      part1={read("part1.html")}
      admin={read("admin-raw.html")}
      member={read("member-raw.html")}
      part2={read("part2.html")}
    />
  );
}
