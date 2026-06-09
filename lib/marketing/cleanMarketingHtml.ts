import { fixMojibake } from "@/lib/marketing/fixMojibake";

function stripBlankTargetOnInternalLinks(html: string) {
  return html
    .replace(
      /(<a\b[^>]*href="\/[^"]*"[^>]*)\s*target="_blank"\s*rel="noopener"/gi,
      "$1",
    )
    .replace(
      /(<a\b[^>]*href="\/[^"]*"[^>]*)\s*rel="noopener"\s*target="_blank"/gi,
      "$1",
    );
}

export function cleanHomeHtml(html: string) {
  return stripBlankTargetOnInternalLinks(
    fixMojibake(html)
      .replace(/https?:\/\/www\.cercalabs\.com\/contact\/?/g, "/contact")
      .replace(/https?:\/\/bookcover\.cercalabs\.com\/?/g, "/")
      .replace(/BookCover_Contact\.html/g, "/contact")
      .replace(/BookCover_Privacy_Policy\.html/g, "/privacy")
      .replace(/href="#"/g, 'href="/"')
      .replace(/\s*onclick="[^"]*"/g, ""),
  );
}

export function cleanPrivacyHtml(html: string) {
  return stripBlankTargetOnInternalLinks(
    fixMojibake(html)
      .replace(/https?:\/\/www\.cercalabs\.com\/contact\/?/g, "/contact")
      .replace(/https?:\/\/bookcover\.cercalabs\.com\/?/g, "/")
      .replace(/BookCover_Demo_Portal\.html/g, "https://bcdemo.cercalabs.com"),
  );
}
