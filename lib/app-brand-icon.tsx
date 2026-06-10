import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { join } from "node:path";

const LOGO_FILE = join(process.cwd(), "public", "logocon", "logo_icon_1.png");

async function loadLogoDataUrl() {
  const buffer = await readFile(LOGO_FILE);
  return `data:image/png;base64,${buffer.toString("base64")}`;
}

/** Logo fill ratio inside square favicon canvas (tighter = larger value). */
export async function createBrandIconImageResponse(
  canvasSize: number,
  fillRatio = 0.92,
) {
  const src = await loadLogoDataUrl();
  const logoMax = Math.round(canvasSize * fillRatio);

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "transparent",
        }}
      >
        <img
          alt=""
          src={src}
          style={{
            maxWidth: logoMax,
            maxHeight: logoMax,
            objectFit: "contain",
          }}
        />
      </div>
    ),
    {
      width: canvasSize,
      height: canvasSize,
    },
  );
}
