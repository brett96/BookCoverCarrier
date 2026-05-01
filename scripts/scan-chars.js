const fs = require("node:fs");
const s = fs.readFileSync("content/member-raw.html", "utf8");
const line = s.split("\n").find((l) => l.includes("In Store"));
const idx = line.indexOf("ðŸ");
const seg = line.slice(idx, idx + 14);
console.log("In Store icon:", JSON.stringify(seg));
console.log([...seg].map((c) => "U+" + c.codePointAt(0).toString(16).toUpperCase()).join(" "));

const p2 = fs.readFileSync("content/part2.html", "utf8");
const re = /engage-card-icon">([^<]+)</g;
let m;
while ((m = re.exec(p2))) {
  const inner = m[1];
  console.log(
    "engage",
    JSON.stringify(inner),
    [...inner].map((c) => "U+" + c.codePointAt(0).toString(16).toUpperCase()).join(" "),
  );
}
