import fs from "fs";

// Read the current seed file
let content = fs.readFileSync("seed-donors-test.js", "utf8");

// Find all donor objects that don't have email field and add it
const donorObjectRegex = /({[\s\S]*?name:\s*"[^"]+",[\s\S]*?}),/g;
let matches = [...content.matchAll(donorObjectRegex)];

console.log(`Found ${matches.length} donor objects to check`);

// Replace the content by adding email: null to objects without email
content = content.replace(donorObjectRegex, (match, donorObj) => {
    // Check if this donor object already has an email field
    if (!donorObj.includes("email:")) {
        // Find the position to insert email field (after profession or before weight)
        const insertPositions = [
            {
                after: /profession:\s*"[^"]*",/,
                insert: "\n                email: null, // Explicitly set to null",
            },
            {
                after: /weight:\s*\d+,/,
                insert: "\n                email: null, // Explicitly set to null",
            },
            {
                after: /height:\s*\d+,/,
                insert: "\n                email: null, // Explicitly set to null",
            },
        ];

        for (let pos of insertPositions) {
            if (pos.after.test(donorObj) && !donorObj.includes("email:")) {
                donorObj = donorObj.replace(
                    pos.after,
                    (match) => match + pos.insert
                );
                break;
            }
        }
    }
    return donorObj + ",";
});

// Write back the modified content
fs.writeFileSync("seed-donors-test.js", content);
console.log("✅ Fixed email fields in seed file");
