const js = require("@eslint/js");
import tsParser from "@typescript-eslint/parser";
import tsPlugin from "@typescript-eslint/eslint-plugin";

const nodeGlobals = {
  process: "readonly",
  console: "readonly",
  __dirname: "readonly",
  module: "readonly",
  require: "readonly",
};

/** @type {import("eslint").FlatESLintConfig[]} */
export default [
  /* ignore build artefacts */
  { ignores: ["dist/**", "coverage/**"] },
  js.configs.recommended,

  /* TypeScript rules for every *.ts file */
  {
    files: ["**/*.ts"],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        project: "./tsconfig.json",
        tsconfigRootDir: process.cwd(),
        ecmaVersion: 2021,
        sourceType: "module",
      },
      globals: nodeGlobals,
    },
    plugins: { "@typescript-eslint": tsPlugin },
    rules: {
      ...tsPlugin.configs.recommended.rules,
      "@typescript-eslint/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_" },
      ],
      "@typescript-eslint/explicit-module-boundary-types": "off",
    },
  },

  /* Jest globals only for test files */
  {
    files: ["**/*.test.ts", "**/__tests__/**/*.ts"],
    languageOptions: {
      globals: {
        ...nodeGlobals,
        describe: "readonly",
        it: "readonly",
        test: "readonly",
        expect: "readonly",
        beforeAll: "readonly",
        beforeEach: "readonly",
        afterAll: "readonly",
        jest: "readonly",
      },
    },
  },
];
