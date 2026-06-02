import { readFile } from "node:fs/promises";
import path from "node:path";

export const size = { width: 32, height: 32 };
export const contentType = "image/png";

export default async function Icon() {
  const buffer = await readFile(
    path.join(process.cwd(), "public/favicons/amazon.png")
  );
  return new Response(buffer, {
    headers: { "Content-Type": "image/png" },
  });
}
