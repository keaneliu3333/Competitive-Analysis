#!/usr/bin/env node

import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";

const root = process.cwd();
const gitignore = readFileSync(join(root, ".gitignore"), "utf8");

function assertIncludes(content, expected, label) {
  if (!content.includes(expected)) {
    throw new Error(`${label} missing: ${expected}`);
  }
}

for (const entry of [".env.local", ".env.*.local", "!.env.example", "data/*.json", "reports/", ".tmp/"]) {
  assertIncludes(gitignore, entry, ".gitignore");
}

const ignoredDirs = new Set([
  ".git",
  ".build",
  ".netlify",
  ".venv-packages",
  ".venv",
  "data",
  "dist",
  "node_modules",
  "reports",
  ".tmp",
]);
const ignoredFiles = new Set([".DS_Store", ".env", ".env.local"]);
const allowedPlaceholderFiles = new Set([".env.example"]);

function walk(dir) {
  const files = [];
  for (const name of readdirSync(dir)) {
    if (ignoredFiles.has(name)) continue;
    const fullPath = join(dir, name);
    const relPath = relative(root, fullPath);
    const stat = statSync(fullPath);
    if (stat.isDirectory()) {
      if (ignoredDirs.has(name) || ignoredDirs.has(relPath)) continue;
      files.push(...walk(fullPath));
    } else if (stat.isFile()) {
      files.push(fullPath);
    }
  }
  return files;
}

const secretPatterns = [
  /sk-proj-[A-Za-z0-9_-]{20,}/g,
  /sk-[A-Za-z0-9_-]{32,}/g,
  /OPENAI_API_KEY\s*=\s*["']?sk-[A-Za-z0-9_-]{20,}/g,
  /APP_(?:ACCESS|READ|WRITE)_TOKEN\s*=\s*["']?[A-Za-z0-9_-]{24,}/g,
];

const findings = [];
for (const filePath of walk(root)) {
  const relPath = relative(root, filePath);
  if (allowedPlaceholderFiles.has(relPath)) continue;
  const content = readFileSync(filePath, "utf8");
  for (const pattern of secretPatterns) {
    const matches = content.match(pattern);
    if (matches?.length) {
      findings.push(`${relPath}: ${matches.length} potential secret(s) matching ${pattern}`);
    }
  }
}

if (findings.length) {
  console.error("Hygiene verification failed:");
  for (const finding of findings) console.error(`- ${finding}`);
  process.exit(1);
}

console.log("Hygiene verification passed.");
console.log("- Checked gitignore coverage and scanned source/docs for obvious API keys or long access tokens.");
