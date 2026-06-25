import sharp from "sharp";
import { execSync } from "child_process";
import { mkdirSync, rmSync } from "fs";
import { resolve } from "path";

const INPUT = resolve(import.meta.dirname, "../seedling.png");
const OUTPUT_DIR = resolve(import.meta.dirname, "../icons");
const ICONSET_DIR = resolve(OUTPUT_DIR, "icon.iconset");

const sizes = [16, 32, 64, 128, 256, 512, 1024];

rmSync(OUTPUT_DIR, { recursive: true, force: true });
mkdirSync(ICONSET_DIR, { recursive: true });

await Promise.all([
  // Generate individual PNGs
  ...sizes.map((size) =>
    sharp(INPUT)
      .resize(size, size)
      .toFile(resolve(OUTPUT_DIR, `${size}x${size}.png`)),
  ),
  // Generate iconset PNGs (required naming convention for iconutil)
  ...sizes
    .filter((size) => size <= 512)
    .flatMap((size) => [
      sharp(INPUT)
        .resize(size, size)
        .toFile(resolve(ICONSET_DIR, `icon_${size}x${size}.png`)),
      sharp(INPUT)
        .resize(size * 2, size * 2)
        .toFile(resolve(ICONSET_DIR, `icon_${size}x${size}@2x.png`)),
    ]),
]);

execSync(
  `iconutil -c icns "${ICONSET_DIR}" -o "${resolve(OUTPUT_DIR, "icon.icns")}"`,
);
rmSync(ICONSET_DIR, { recursive: true });
