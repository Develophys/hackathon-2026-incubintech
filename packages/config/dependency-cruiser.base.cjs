/** @type {import('dependency-cruiser').IConfiguration} */
module.exports = {
  forbidden: [
    {
      name: "domain-no-app-imports",
      comment: "packages/domain must never import from apps/* — it is consumed BY apps, not the other way around.",
      severity: "error",
      from: { path: "^src" },
      to: { path: "^apps" },
    },
    {
      name: "domain-no-framework-imports",
      comment: "packages/domain holds types/schemas only — no React, NestJS, or Prisma (spec Decisions table).",
      severity: "error",
      from: { path: "^src" },
      to: { path: "node_modules/(react|@nestjs|@prisma)" },
    },
  ],
  options: {
    tsPreCompilationDeps: true,
  },
};
