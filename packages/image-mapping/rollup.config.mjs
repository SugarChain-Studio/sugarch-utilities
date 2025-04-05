import terser from "@rollup/plugin-terser";
import typescript from "@rollup/plugin-typescript";
import resolve from "@rollup/plugin-node-resolve";
import replace from "@rollup/plugin-replace";
import commonjs from "@rollup/plugin-commonjs";
import { dts } from "rollup-plugin-dts";
import del from "rollup-plugin-delete";
import fs from "fs";

const pkg = JSON.parse(fs.readFileSync("./package.json", "utf8"));

export default [
    {
        input: "src/index.ts",
        output: [
            {
                file: "dist/index.mjs",
                format: "es",
                sourcemap: true,
            },
            {
                file: "dist/index.cjs",
                format: "cjs",
                sourcemap: true,
            },
        ],
        external: ["bondage-club-mod-sdk", "@sugarch/bc-mod-hook-manager", "semver/functions/lt"],
        plugins: [
            resolve({ browser: true }),
            commonjs(),
            replace({
                preventAssignment: true, 
                values: {
                    ROLLUP_VAR_VERSION: JSON.stringify(pkg.version),
                },
            }),
            typescript({
                tsconfig: "./tsconfig.json",
                declaration: true,
                declarationDir: "dist/types",
            }),
            terser(),
        ],
    },
    {
        input: "dist/types/index.d.ts",
        output: [{ file: "dist/index.d.ts", format: "es" }],
        plugins: [dts(), del({ targets: "dist/types", hook: "buildEnd" })],
    },
];
