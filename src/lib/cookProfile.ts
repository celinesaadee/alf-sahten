export type ProfileLinkKind = "instagram" | "website" | "photo";

export function normalizeProfileUrl(value: string, kind: ProfileLinkKind): string | null {
  const trimmed = value.trim();
  if (!trimmed) return "";
  let candidate = trimmed;
  if (kind === "instagram" && /^@?[\w.]+$/.test(trimmed)) {
    candidate = `https://www.instagram.com/${trimmed.replace(/^@/, "")}/`;
  } else if (!/^[a-z][a-z\d+.-]*:/i.test(trimmed)) {
    candidate = `https://${trimmed}`;
  }
  try {
    const url = new URL(candidate);
    if (!['https:', 'http:'].includes(url.protocol) || url.username || url.password || !url.hostname.includes('.')) return null;
    if (kind === "instagram" && !['instagram.com', 'www.instagram.com'].includes(url.hostname.toLowerCase())) return null;
    return url.href;
  } catch { return null; }
}

export function cookSocialLinks(instagram: string | null, website: string | null) {
  const instagramHref = normalizeProfileUrl(instagram ?? "", "instagram");
  const websiteHref = normalizeProfileUrl(website ?? "", "website");
  return {
    instagram: instagramHref ? { href: instagramHref, label: `@${new URL(instagramHref).pathname.split('/').filter(Boolean)[0] ?? 'instagram'}` } : null,
    website: websiteHref ? { href: websiteHref, label: new URL(websiteHref).hostname.replace(/^www\./, '') } : null,
  };
}
