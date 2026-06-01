import { mkdir, copyFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const publicDir = path.join(__dirname, "..", "public");
const sourceIcon = process.argv[2];

if (!sourceIcon) {
  console.error("Usage: node scripts/generate-pwa-assets.mjs <source-icon.png>");
  process.exit(1);
}

await mkdir(publicDir, { recursive: true });

const iconSizes = [
  ["pwa-192x192.png", 192],
  ["pwa-512x512.png", 512],
  ["apple-touch-icon.png", 180],
];

for (const [filename, size] of iconSizes) {
  await sharp(sourceIcon)
    .resize(size, size, { fit: "cover", position: "centre" })
    .png()
    .toFile(path.join(publicDir, filename));
  console.log(`Wrote ${filename} (${size}x${size})`);
}

const screenshotMobile = path.join(publicDir, "screenshot-mobile.png");
const screenshotWide = path.join(publicDir, "screenshot-wide.png");

await sharp({
  create: {
    width: 390,
    height: 844,
    channels: 3,
    background: { r: 245, g: 246, b: 250 },
  },
})
  .composite([
    {
      input: Buffer.from(
        `<svg width="390" height="844" xmlns="http://www.w3.org/2000/svg">
          <rect width="390" height="844" fill="#f5f6fa"/>
          <rect x="0" y="0" width="390" height="56" fill="#ffffff"/>
          <text x="20" y="36" font-family="Arial,sans-serif" font-size="18" font-weight="600" fill="#1e293b">EventsPlatform</text>
          <rect x="20" y="80" width="350" height="140" rx="16" fill="#ffffff" stroke="#e2e8f0"/>
          <text x="36" y="120" font-family="Arial,sans-serif" font-size="16" font-weight="600" fill="#1e293b">Хакатон «Цифровой прорыв»</text>
          <text x="36" y="148" font-family="Arial,sans-serif" font-size="13" fill="#64748b">React · TypeScript · Python</text>
          <rect x="36" y="168" width="90" height="28" rx="14" fill="#6366f1"/>
          <text x="52" y="187" font-family="Arial,sans-serif" font-size="12" fill="#ffffff">Регистрация</text>
        </svg>`,
      ),
    },
  ])
  .png()
  .toFile(screenshotMobile);

await sharp({
  create: {
    width: 1280,
    height: 720,
    channels: 3,
    background: { r: 245, g: 246, b: 250 },
  },
})
  .composite([
    {
      input: Buffer.from(
        `<svg width="1280" height="720" xmlns="http://www.w3.org/2000/svg">
          <rect width="1280" height="720" fill="#f5f6fa"/>
          <rect x="0" y="0" width="1280" height="64" fill="#ffffff"/>
          <text x="40" y="42" font-family="Arial,sans-serif" font-size="22" font-weight="600" fill="#1e293b">EventsPlatform</text>
          <rect x="40" y="96" width="580" height="220" rx="20" fill="#ffffff" stroke="#e2e8f0"/>
          <rect x="660" y="96" width="580" height="220" rx="20" fill="#ffffff" stroke="#e2e8f0"/>
          <text x="64" y="150" font-family="Arial,sans-serif" font-size="24" font-weight="600" fill="#1e293b">Хакатон «Цифровой прорыв»</text>
          <text x="684" y="150" font-family="Arial,sans-serif" font-size="24" font-weight="600" fill="#1e293b">Кейсы и регистрация</text>
          <text x="64" y="190" font-family="Arial,sans-serif" font-size="16" fill="#64748b">Платформа регистрации команд</text>
          <text x="684" y="190" font-family="Arial,sans-serif" font-size="16" fill="#64748b">Кабинет капитана и команды</text>
        </svg>`,
      ),
    },
  ])
  .png()
  .toFile(screenshotWide);

console.log("Wrote screenshot-mobile.png and screenshot-wide.png");
