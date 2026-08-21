import nextPlugin from "eslint-config-next/core-web-vitals"

/** @type {import('eslint').Linter.Config[]} */
const config = [
  ...nextPlugin,
  {
    rules: {
      // Was warn before; keep as warn
      "@typescript-eslint/no-explicit-any": "warn",
      // New strict react-hooks v7 rules — downgrade to warn until codebase is refactored
      "react-hooks/set-state-in-effect": "warn",
      "react-hooks/set-state-in-render": "warn",
      "react-hooks/refs": "warn",
      "react-hooks/preserve-manual-memoization": "warn",
      "react-hooks/immutability": "warn",
      "react-hooks/purity": "warn",
      "react-hooks/static-components": "warn",
      // Unescaped entities — downgrade to warn
      "react/no-unescaped-entities": "warn",
    },
  },
]

export default config
