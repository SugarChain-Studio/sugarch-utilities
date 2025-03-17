import terser from "@rollup/plugin-terser";
import typescript from "@rollup/plugin-typescript";
import resolve from "@rollup/plugin-node-resolve";
import commonjs from "@rollup/plugin-commonjs";

export default {
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
    external: ["bondage-club-mod-sdk", "@sugarch/bc-mod-manager"],
    plugins: [
        resolve({ browser: true }),
        commonjs(),
        typescript({
            tsconfig: "./tsconfig.json",
            declaration: true,
            declarationDir: "./dist",
        }),
        terser(),
    ],
};
