// scripts/generate-erd.ts
import { generateErd } from "drizzle-erd";
import * as schema from "./src/db/schema/index.ts"; // Sesuaikan lokasi file schema Anda
import fs from "node:fs";
async function main() {
  // Secara opsional, jika Anda ingin menggunakan gaya Mermaid JSDoc ERD
  const svgOutput = await generateErd({
    schema: schema,
  });

  // Anda tidak perlu package 'fs' khusus, drizzle-erd biasanya memiliki CLI atau bisa di build gini:
  fs.writeFileSync("./erd.dbml", svgOutput.dbml);

  console.log("✅ ERD SVG berhasil dibuat di erd.svg");
}

main();
