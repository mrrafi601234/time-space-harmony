import { describe, expect, it } from "vitest";
import { backgroundScene } from "@/lib/background-scene";
import { faviconUrl, reorderLinks, STARTER_LINKS, websiteUrl } from "@/lib/quick-links";

describe("quick links", () => {
  it("includes the requested starter websites", () => {
    expect(STARTER_LINKS.map((link) => new URL(link.url).hostname)).toEqual(["github.com", "leetcode.com", "www.youtube.com", "classroom.google.com"]);
  });
  it("requests 128px Google website icons", () => {
    expect(faviconUrl("https://github.com/example")).toBe("https://www.google.com/s2/favicons?domain=github.com&sz=128");
  });
  it("reorders favorites without losing entries", () => {
    expect(reorderLinks(STARTER_LINKS, "github", "youtube").map((link) => link.id)).toEqual(["leetcode", "youtube", "github", "classroom"]);
  });
  it("accepts websites but refuses executable URLs", () => {
    expect(websiteUrl("github.com")).toBe("https://github.com/");
    expect(() => websiteUrl("javascript:alert(1)")).toThrow();
  });
});
describe("weather backgrounds", () => {
  it.each([51, 53, 55, 56, 57, 61, 63, 65, 66, 67, 80, 81, 82])("maps rain/drizzle %i", (code) => expect(backgroundScene(code, 720)).toBe("rain"));
  it.each([71, 73, 75, 77, 85, 86])("maps snow %i", (code) => expect(backgroundScene(code, 720)).toBe("snow"));
  it.each([45, 48])("maps fog %i", (code) => expect(backgroundScene(code, 720)).toBe("fog"));
  it.each([2, 3])("maps overcast/clouds %i", (code) => expect(backgroundScene(code, 720)).toBe("clouds"));
  it.each([95, 96, 99])("maps thunderstorm %i", (code) => expect(backgroundScene(code, 720)).toBe("storm"));
  it("maps clear day", () => expect(backgroundScene(0, 720, 360, 1080)).toBe("day"));
  it("maps clear night", () => expect(backgroundScene(0, 60, 360, 1080)).toBe("night"));
  it("maps sunrise", () => expect(backgroundScene(0, 360, 360, 1080)).toBe("sunrise"));
  it("maps sunset", () => expect(backgroundScene(0, 1080, 360, 1080)).toBe("sunset"));
});