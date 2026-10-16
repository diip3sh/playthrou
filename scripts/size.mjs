import { readFile } from "node:fs/promises";
import { gzipSync } from "node:zlib";
import { minify } from "terser";
for (const f of ["dist/index.js", "dist/react.js"]) {
  const src = await readFile(f, "utf8");
  const out = await minify(src, { module: true, compress: { passes: 2 }, mangle: { properties: false } });
  console.log(f.padEnd(16), `${(out.code.length / 1024).toFixed(1)} KB min`, `${(gzipSync(out.code).length / 1024).toFixed(2)} KB gzip`);
}
