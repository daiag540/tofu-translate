#!/usr/bin/env node
// ──────────────────────────────────────────────
// Tofu Translate — Build Script
// Packages the plugin as an .xpi file for distribution
// Uses Python's zipfile for cross-platform reliability
// ──────────────────────────────────────────────

const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

const ROOT = path.resolve(__dirname, "..");
const BUILD_DIR = path.join(ROOT, "build");

// Read manifest for version
const manifest = JSON.parse(
  fs.readFileSync(path.join(ROOT, "manifest.json"), "utf-8")
);
const version = manifest.version;
const outputName = `tofu-translate-${version}.xpi`;

// Files to include in the XPI (directories are recursed)
const INCLUDE = [
  "manifest.json",
  "bootstrap.js",
  "prefs.js",
  "chrome",
  "locale",
  "icons",
  "LICENSE",
];

// Patterns to exclude
const EXCLUDE_PATTERNS = [
  /(^|\/)\.DS_Store$/,
  /(^|\/)Thumbs\.db$/,
  /(^|\/)__pycache__\//,
  /(^|\/)\.git\//,
  /(^|\/)node_modules\//,
];

console.log(`🔨 Building ${outputName}...`);

// Ensure build directory
if (!fs.existsSync(BUILD_DIR)) {
  fs.mkdirSync(BUILD_DIR, { recursive: true });
}

const outputPath = path.join(BUILD_DIR, outputName);

// Remove existing output
if (fs.existsSync(outputPath)) {
  fs.unlinkSync(outputPath);
}

// Collect all files to include
function shouldInclude(filePath) {
  const normalized = filePath.replace(/\\/g, "/");
  return !EXCLUDE_PATTERNS.some((p) => p.test(normalized));
}

function collectFiles(basePath, relativePrefix) {
  const results = [];
  const stat = fs.statSync(basePath);

  if (stat.isFile()) {
    if (shouldInclude(basePath)) {
      results.push({ absPath: basePath, relPath: relativePrefix });
    }
  } else if (stat.isDirectory()) {
    const entries = fs.readdirSync(basePath);
    for (const entry of entries) {
      const childPath = path.join(basePath, entry);
      const childRel = relativePrefix
        ? relativePrefix + "/" + entry
        : entry;
      results.push(...collectFiles(childPath, childRel));
    }
  }
  return results;
}

const files = [];
for (const inc of INCLUDE) {
  const fullPath = path.join(ROOT, inc);
  if (fs.existsSync(fullPath)) {
    files.push(...collectFiles(fullPath, inc));
  } else if (process.env.DEBUG) {
    console.log(`  (skipped missing: ${inc})`);
  }
}

console.log(`  Found ${files.length} files to package`);

// Write file list for Python zip script
const fileListPath = path.join(BUILD_DIR, "_filelist.txt");
const fileListContent = files
  .map((f) => `${f.absPath}|${f.relPath.replace(/\\/g, "/")}`)
  .join("\n");
fs.writeFileSync(fileListPath, fileListContent, "utf-8");

// Build zip using Python (most reliable across Windows versions)
const pythonScript = `
import os, zipfile, sys

root = ${JSON.stringify(ROOT.replace(/\\/g, "/"))}
output = ${JSON.stringify(outputPath.replace(/\\/g, "/"))}
filelist = ${JSON.stringify(fileListPath.replace(/\\/g, "/"))}

with open(filelist, 'r', encoding='utf-8') as f:
    lines = [l.strip() for l in f if l.strip()]

print(f'Zipping {len(lines)} files...')

with zipfile.ZipFile(output, 'w', zipfile.ZIP_DEFLATED) as zf:
    for line in lines:
        abs_path, rel_path = line.split('|', 1)
        if os.path.isfile(abs_path):
            zf.write(abs_path, rel_path)
        else:
            print(f'  WARNING: file not found: {abs_path}')

size = os.path.getsize(output)
print(f'Created: {output}')
print(f'Size: {size} bytes ({size/1024:.1f} KB)')
`;

const pythonScriptPath = path.join(BUILD_DIR, "_zip.py");
fs.writeFileSync(pythonScriptPath, pythonScript, "utf-8");

try {
  execSync(`python "${pythonScriptPath}"`, {
    stdio: "inherit",
    cwd: ROOT,
  });
} catch (e) {
  console.error("Build failed. Make sure Python is installed.");
  process.exit(1);
}

// Cleanup temp files
fs.unlinkSync(fileListPath);
fs.unlinkSync(pythonScriptPath);

console.log(`\n✅ Build complete: ${outputPath}`);
console.log(
  `   Load this file in Zotero → Tools → Add-ons → Install Add-on From File`
);
