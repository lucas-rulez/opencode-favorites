#!/usr/bin/env bun
import { $ } from "bun"
import { createSolidTransformPlugin } from "@opentui/solid/bun-plugin"

await $`tsc -p tsconfig.build.json --emitDeclarationOnly`

const result = await Bun.build({
  entrypoints: ["./src/tui.tsx"],
  tsconfig: "./tsconfig.json",
  plugins: [createSolidTransformPlugin()],
  external: ["@opencode-ai/plugin", "@opencode-ai/sdk", "@opentui/core", "@opentui/solid", "solid-js", "node:fs"],
  format: "esm",
  outdir: "./dist",
  sourcemap: "none",
})

if (!result.success) {
  for (const log of result.logs) console.error(log)
  process.exit(1)
}

if (!(await result.outputs[0].text()).includes("get when")) {
  throw new Error("Solid transform did not produce reactive JSX")
}
