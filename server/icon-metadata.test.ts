import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const appIconUrl = "/manus-storage/nyumba-360-app-icon_46e5b435.png";
const documentSource = readFileSync(resolve(process.cwd(), "client/index.html"), "utf8");
const manifestSource = readFileSync(resolve(process.cwd(), "client/public/manifest.webmanifest"), "utf8");

describe("Nyumba 360 app icon metadata", () => {
  it("uses the Nyumba 360 icon for browser and Apple touch icons", () => {
    expect(documentSource).toContain(`rel="icon" type="image/png" href="${appIconUrl}"`);
    expect(documentSource).toContain(`rel="apple-touch-icon" href="${appIconUrl}"`);
  });

  it("declares a branded web app manifest with installable icon variants", () => {
    const manifest = JSON.parse(manifestSource) as {
      name: string;
      short_name: string;
      theme_color: string;
      icons: Array<{ src: string; sizes: string; purpose: string }>;
    };

    expect(documentSource).toContain('rel="manifest" href="/manifest.webmanifest"');
    expect(documentSource).toContain('name="theme-color" content="#0F4BA5"');
    expect(manifest.name).toBe("Nyumba 360");
    expect(manifest.short_name).toBe("Nyumba 360");
    expect(manifest.theme_color).toBe("#0F4BA5");
    expect(manifest.icons).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ src: appIconUrl, sizes: "192x192" }),
        expect.objectContaining({ src: appIconUrl, sizes: "512x512", purpose: "any maskable" }),
      ]),
    );
  });
});
