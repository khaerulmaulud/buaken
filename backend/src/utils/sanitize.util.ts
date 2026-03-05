import sanitizeHtml from 'sanitize-html';

/**
 * Sanitize user-generated content to prevent XSS attacks
 * Removes all HTML tags and dangerous content
 */
export function sanitizeText(text: string): string {
  if (!text) return '';

  return sanitizeHtml(text, {
    allowedTags: [], // No HTML tags allowed
    allowedAttributes: {},
    disallowedTagsMode: 'recursiveEscape',
  });
}

/**
 * Sanitize review comment - allows basic formatting
 */
export function sanitizeReviewComment(comment: string): string {
  if (!comment) return '';

  return sanitizeHtml(comment, {
    allowedTags: ['b', 'i', 'em', 'strong', 'br', 'p'],
    allowedAttributes: {},
    allowedSchemes: [],
  });
}

/**
 * Validate and sanitize image URL
 * Only allows URLs from trusted domains
 */
export function sanitizeImageUrl(url: string): string | null {
  if (!url) return null;

  // Allow local upload paths (e.g. /uploads/avatars/abc.png)
  if (url.startsWith('/uploads/')) {
    return url;
  }

  try {
    const parsedUrl = new URL(url);
    const allowedDomains = [
      'supabase.co',
      'localhost',
      process.env.SUPABASE_URL?.replace('https://', ''),
    ].filter(Boolean);

    const isAllowed = allowedDomains.some((domain) =>
      parsedUrl.hostname.includes(domain as string),
    );

    if (!isAllowed) {
      console.warn(`Rejected untrusted image URL: ${url}`);
      return null;
    }

    return url;
  } catch (_error) {
    console.error('Invalid URL:', url);
    return null;
  }
}

/**
 * Sanitize array of image URLs
 */
export function sanitizeImageUrls(urls: string[]): string[] {
  if (!urls || !Array.isArray(urls)) return [];

  return urls
    .map((url) => sanitizeImageUrl(url))
    .filter((url): url is string => url !== null);
}
