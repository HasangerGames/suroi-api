import js from "@eslint/js";
import { defineConfig } from "eslint/config";
import globals from "globals";
import tseslint from "typescript-eslint";

export default defineConfig([
    {
        files: ["src/**/*.{js,mjs,cjs,ts,mts,cts}"],
        plugins: { js },
        extends: ["js/recommended"],
    },
    {
        files: ["src/**/*.{js,mjs,cjs,ts,mts,cts}"],
        ignores: ["src/generated/"],
        languageOptions: { globals: globals.node },
    },
    tseslint.configs.recommended,
]);
