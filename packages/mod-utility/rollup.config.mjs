import terser from "@rollup/plugin-terser";
import typescript from "@rollup/plugin-typescript";
import { dts } from "rollup-plugin-dts";
import del from "rollup-plugin-delete";
import { createBanner } from "../../utils/create-banner.mjs";
import fs from "fs";

const pkg = JSON.parse(fs.readFileSync("./package.json", "utf8"));
const banner = createBanner(pkg.name, pkg.version);

export default [
    {
        input: "src/index.ts",
        output: [
            {
                file: "dist/index.mjs",
                format: "es",
                sourcemap: true,
                banner,
            },
            {
                file: "dist/index.cjs",
                format: "cjs",
                sourcemap: true,
                banner,
            },
        ],
        plugins: [
            typescript({
                tsconfig: "./tsconfig.json",
                declaration: true,
                declarationDir: "dist/types",
            }),
            terser({
                format: {
                    comments: /SugarChain|Copyright/i,
                },
            }),
        ],
    },
    {
        input: "dist/types/index.d.ts",
        output: [{ file: "dist/index.d.ts", format: "es", banner }],
        plugins: [dts(), del({ targets: "dist/types", hook: "buildEnd" })],
    },
];
