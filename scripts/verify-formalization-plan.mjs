#!/usr/bin/env node

import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const failures = [];

function fail(message) {
  failures.push(message);
}

function readRequired(relativePath) {
  const path = join(root, relativePath);
  if (!existsSync(path)) {
    fail(`Missing required file: ${relativePath}`);
    return "";
  }
  return readFileSync(path, "utf8");
}

function assertIncludes(source, needle, label) {
  if (!source.includes(needle)) fail(`${label} missing: ${needle}`);
}

const roadmap = readRequired("docs/formalization-roadmap.md");
const prismaSchema = readRequired("docs/prisma-schema-draft.prisma");
const reconciliationGenerator = readRequired("scripts/generate-migration-reconciliation.mjs");
const apiMigrationMap = readRequired("docs/api-migration-map.md");
const readme = readRequired("README.md");
const deployment = readRequired("docs/deployment.md");
const traceability = readRequired("docs/requirements-traceability.md");

for (const token of [
  "Next.js + PostgreSQL + Prisma + Redis/BullMQ",
  "阶段 1：Next.js 外壳与只读迁移",
  "阶段 2：PostgreSQL + Prisma 数据落库",
  "阶段 3：Route Handlers 与权限",
  "阶段 4：Redis/BullMQ 异步任务",
  "阶段 5：Playwright 抓取与证据归档",
  "阶段 6：评估、成本和发布",
  "Brand",
  "Category",
  "Product",
  "SourcePage",
  "MediaAsset",
  "PriceSnapshot",
  "FeatureModule",
  "FeatureField",
  "ProductFeatureValue",
  "SellingPoint",
  "RoadmapItem",
  "AnalysisRun",
  "SavedView",
  "AuditLog",
  "ApiUsageLog",
  "viewer",
  "editor",
  "analyst",
  "admin",
  "Playwright",
  "OpenAI Responses API",
  "数据迁移策略",
  "回滚策略",
  "发布门槛",
  "docs/prisma-schema-draft.prisma",
  "docs/api-migration-map.md",
]) {
  assertIncludes(roadmap, token, "formalization roadmap");
}

for (const token of [
  "Route Handlers",
  "BullMQ Jobs",
  "POST /api/analyze",
  "POST /api/source-pages/fetch",
  "POST /api/analysis-runs",
  "metadata-fetch",
  "analysis-run",
  "export-build",
]) {
  assertIncludes(apiMigrationMap, token, "API migration map");
}

for (const token of [
  'provider = "postgresql"',
  'url      = env("DATABASE_URL")',
  "enum ProductCategory",
  "enum ProductStatus",
  "enum FeatureFieldType",
  "enum SourceType",
  "enum AnalysisStatus",
  "enum UserRole",
  "model User",
  "model Brand",
  "model Category",
  "model Product",
  "model SourcePage",
  "model MediaAsset",
  "model PriceSnapshot",
  "model FeatureModule",
  "model FeatureField",
  "model ProductFeatureValue",
  "model SellingPoint",
  "model RoadmapItem",
  "model AnalysisRun",
  "model SavedView",
  "model AuditLog",
  "model ApiUsageLog",
  "@@unique([brandId, model])",
  "@@unique([productId, fieldId])",
  "@@unique([productId, priority])",
  "@@index([productId, createdAt])",
]) {
  assertIncludes(prismaSchema, token, "Prisma schema draft");
}

for (const token of [
  "Migration reconciliation report generated",
  "migrationCounts",
  "ProductFeatureValue",
  "PriceSnapshot",
  "AnalysisRun",
  "AuditLog",
  "SavedView",
  "ComparisonRun",
  "品牌 + 型号去重",
  "不切换正式读写流量",
]) {
  assertIncludes(reconciliationGenerator, token, "migration reconciliation generator");
}

assertIncludes(readme, "后续正式化路径", "README formalization pointer");
assertIncludes(readme, "docs/formalization-roadmap.md", "README formalization pointer");
assertIncludes(readme, "docs/api-migration-map.md", "README API migration pointer");
assertIncludes(readme, "docs/prisma-schema-draft.prisma", "README Prisma schema pointer");
assertIncludes(deployment, "正式化迁移路径", "deployment formalization pointer");
assertIncludes(deployment, "docs/formalization-roadmap.md", "deployment formalization pointer");
assertIncludes(deployment, "docs/api-migration-map.md", "deployment API migration pointer");
assertIncludes(deployment, "docs/prisma-schema-draft.prisma", "deployment Prisma schema pointer");

for (const token of [
  "正式多人协作阶段建议迁移",
  "docs/formalization-roadmap.md",
]) {
  assertIncludes(traceability, token, "traceability formalization pointer");
}

if (failures.length) {
  console.error("Formalization plan verification failed:");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log("Formalization plan verification passed.");
console.log("- Checked formal Next.js/PostgreSQL/Prisma/Redis/BullMQ migration phases, data model, permissions, queues, migration, rollback, and release gates.");
