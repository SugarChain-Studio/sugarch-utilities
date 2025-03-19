import terser from "@rollup/plugin-terser";
import typescript from "@rollup/plugin-typescript";
import { dts } from "rollup-plugin-dts";
import del from "rollup-plugin-delete";

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
        external: ["bondage-club-mod-sdk"],
        plugins: [
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
