const base = require("@zelo/config/dependency-cruiser.base.cjs");

/** @type {import('dependency-cruiser').IConfiguration} */
module.exports = {
  forbidden: [
    ...base.forbidden,
    {
      name: "application-no-infrastructure-imports",
      comment: "application/ (ports + use-cases) must depend only on ports, never on concrete infrastructure — that's the Dependency Inversion boundary (spec Section C).",
      severity: "error",
      from: { path: "^src/modules/[^/]+/application" },
      to: { path: "^src/modules/[^/]+/infrastructure" },
    },
    {
      name: "application-no-prisma-imports",
      comment: "application/ must never import @prisma/client directly — only through a port implemented in infrastructure/.",
      severity: "error",
      from: { path: "^src/modules/[^/]+/application" },
      to: { path: "node_modules/@prisma/client" },
    },
  ],
  options: {
    ...base.options,
    tsConfig: { fileName: "tsconfig.json" },
  },
};
