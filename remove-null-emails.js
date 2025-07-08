import fs from "fs";

// Read the current seed file
let content = fs.readFileSync("seed-donors-test.js", "utf8");

// Remove all lines that contain "email: null"
content = content.replace(/\s*email: null,.*\n/g, "");

// Write back the modified content
fs.writeFileSync("seed-donors-test.js", content);
console.log("✅ Removed all email: null lines from seed file");
