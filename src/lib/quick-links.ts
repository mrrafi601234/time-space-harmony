export interface QuickLink {
  id: string;
  title: string;
  url: string;
  icon: string;
  category: string;
}

export const STARTER_LINKS: QuickLink[] = [
  { id: "github", title: "GitHub", url: "https://github.com/", icon: "", category: "Coding" },
  { id: "leetcode", title: "LeetCode", url: "https://leetcode.com/", icon: "", category: "Coding" },
  { id: "youtube", title: "YouTube", url: "https://www.youtube.com/", icon: "", category: "Social" },
  { id: "classroom", title: "Classroom", url: "https://classroom.google.com/", icon: "", category: "Study" },
];

export function websiteUrl(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) throw new Error("Enter a website URL.");
  const url = new URL(/^[a-z][a-z\d+.-]*:/i.test(trimmed) ? trimmed : `https://${trimmed}`);
  if (!["http:", "https:"].includes(url.protocol) || !url.hostname.includes(".") || url.username || url.password) {
    throw new Error("Use a valid http or https website URL.");
  }
  return url.href;
}

export function faviconUrl(url: string): string {
  return `https://www.google.com/s2/favicons?domain=${encodeURIComponent(new URL(url).hostname)}&sz=128`;
}

export function reorderLinks(links: QuickLink[], fromId: string, toId: string): QuickLink[] {
  const from = links.findIndex((link) => link.id === fromId);
  const to = links.findIndex((link) => link.id === toId);
  if (from < 0 || to < 0 || from === to) return links;
  const result = [...links];
  const [item] = result.splice(from, 1);
  if (item) result.splice(to, 0, item);
  return result;
}