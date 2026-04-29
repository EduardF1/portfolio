import fs from "node:fs";

const err = fs.readFileSync("scripts/.visual-cleanup-v2-delta.err", "utf8");
const re = /missing file: (.+\.jpg)/g;
const out = [];
let m;
while ((m = re.exec(err)) !== null) {
  let p = m[1].replace(/\\/g, "/").replace(/^public\/photos\//, "");
  out.push(p);
}
console.log("Reported missing:", out.length);

const cat = JSON.parse(fs.readFileSync("scripts/photo-catalogue.json", "utf8"));
const catSet = new Set(cat.map((c) => c.src));
const inCat = out.filter((p) => catSet.has(p));
console.log("Still referenced by catalogue:", inCat.length);
fs.writeFileSync(
  "scripts/.audit-missing-files.json",
  JSON.stringify(inCat, null, 2),
);
inCat.forEach((p) => console.log("  " + p));
