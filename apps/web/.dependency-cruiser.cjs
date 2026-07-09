const base = require("@zelo/config/dependency-cruiser.base.cjs");

/** @type {import('dependency-cruiser').IConfiguration} */
module.exports = {
  forbidden: [
    ...base.forbidden,
    {
      name: "use-cases-no-react",
      comment: "use-cases/ must be framework-agnostic — no React, no browser APIs directly (spec Section B). They depend only on ports/.",
      severity: "error",
      from: { path: "^src/use-cases" },
      to: { path: "node_modules/react" },
    },
    {
      name: "use-cases-no-infrastructure",
      comment: "use-cases/ must depend only on ports/, never on concrete infrastructure/ implementations.",
      severity: "error",
      from: { path: "^src/use-cases" },
      to: { path: "^src/infrastructure" },
    },
  ],
  options: {
    ...base.options,
    tsConfig: { fileName: "tsconfig.json" },
  },
};
