import sharp from "sharp";
import { writeFileSync } from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");

const inputPath = path.join(root, "public/imagenes/logo-negro.png");
const meta = await sharp(inputPath).metadata();
const W = meta.width;
const H = meta.height;

// Symbol occupies top ~56% of the image (diamond/handshake), rest is text
const symbolH = Math.round(H * 0.56);

// Crop symbol, add a small square margin, resize to 200x200 inside a 256x256 canvas
const symbolBuf = await sharp(inputPath)
  .extract({ left: 0, top: 0, width: W, height: symbolH })
  .resize(200, 200, { fit: "contain", background: { r: 255, g: 255, b: 255 } })
  .png()
  .toBuffer();

// Yellow background 256x256
const yellowBg = await sharp({
  create: { width: 256, height: 256, channels: 3, background: { r: 240, g: 224, b: 64 } },
}).png().toBuffer();

// Composite: black symbol over yellow using multiply blend
// black × yellow = black; white × yellow = yellow  → symbol in black on yellow background
const result256 = await sharp(yellowBg)
  .composite([{
    input: symbolBuf,
    blend: "multiply",
    gravity: "centre",
  }])
  .resize(256, 256)
  .png()
  .toBuffer();

writeFileSync(path.join(root, "src/app/icon.png"), result256);
console.log("✓ src/app/icon.png (256x256)");

// 32x32 for ICO
const png32 = await sharp(result256).resize(32, 32).png().toBuffer();

const HEADER = Buffer.alloc(6);
HEADER.writeUInt16LE(0, 0);
HEADER.writeUInt16LE(1, 2);
HEADER.writeUInt16LE(1, 4);

const ENTRY = Buffer.alloc(16);
ENTRY.writeUInt8(32, 0);
ENTRY.writeUInt8(32, 1);
ENTRY.writeUInt8(0, 2);
ENTRY.writeUInt8(0, 3);
ENTRY.writeUInt16LE(1, 4);
ENTRY.writeUInt16LE(32, 6);
ENTRY.writeUInt32LE(png32.byteLength, 8);
ENTRY.writeUInt32LE(22, 12);

writeFileSync(path.join(root, "src/app/favicon.ico"), Buffer.concat([HEADER, ENTRY, png32]));
console.log("✓ src/app/favicon.ico (32x32)");
