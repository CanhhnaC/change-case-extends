import { defineConfig } from "vite";

export default defineConfig({
  build: {
    lib: {
      entry: "./lib/main.ts",
      name: "extension",
      fileName: "extension",
    },
    rollupOptions: {
      external: ["vscode", "os"],
      output: {
        globals: {
          vscode: "vscode",
          os: "os",
        },
      },
    },
  },
});
