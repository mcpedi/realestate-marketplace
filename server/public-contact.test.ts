import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const footerSource = readFileSync(resolve(process.cwd(), "client/src/components/Footer.tsx"), "utf8");
const contactPageSource = readFileSync(resolve(process.cwd(), "client/src/pages/Contact.tsx"), "utf8");

describe("public contact details", () => {
  it("shows the Nairobi, Kilimani address consistently across public contact surfaces", () => {
    expect(footerSource).toContain("Nairobi, Kilimani");
    expect(contactPageSource).toContain("Nairobi, Kilimani");
  });

  it("keeps phone and email contact actions available from the site footer", () => {
    expect(footerSource).toContain('href="tel:+254716339552"');
    expect(footerSource).toContain('href="mailto:pediwarealestate@gmail.com"');
  });

  it("displays the requested Jacks Ict Solutions footer credit", () => {
    expect(footerSource).toContain("Designed and made by");
    expect(footerSource).toContain("Jacks Ict Solutions");
  });
});
