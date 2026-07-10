const fs = require("fs");
const path = require("path");

const root = path.join(__dirname, "..");
const dist = path.join(root, "dist");

fs.mkdirSync(dist, { recursive: true });
fs.copyFileSync(path.join(root, "manifest.json"), path.join(dist, "manifest.json"));

fs.mkdirSync(path.join(dist, "sidepanel"), { recursive: true });
fs.copyFileSync(
  path.join(root, "src", "sidepanel", "sidepanel.html"),
  path.join(dist, "sidepanel", "sidepanel.html")
);
fs.copyFileSync(
  path.join(root, "src", "sidepanel", "sidepanel.css"),
  path.join(dist, "sidepanel", "sidepanel.css")
);

fs.cpSync(path.join(root, "icons"), path.join(dist, "icons"), { recursive: true });

console.log("Copied manifest.json, sidepanel static assets, and icons into dist/");
