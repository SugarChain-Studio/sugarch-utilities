import terser from "@rollup/plugin-terser";
import typescript from "@rollup/plugin-typescript";

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
    external: ["bondage-club-mod-sdk"],
    plugins: [
        typescript({
            tsconfig: "./tsconfig.json",
            declaration: true,
            declarationDir: "./dist",
        }),
        terser(),
    ],
};
