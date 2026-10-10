/**
 * Post-build gate that fails when `dist/` is missing assets, leaks private data, or weakens the content security policy.
 */

import { createHash } from "node:crypto";
import { existsSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

/** The site's base path in built URLs, used to tell local assets from external links. */
const BASE_PATH = "/flyrank-ml-internship/";
/** Bytes in one mebibyte, the size floor for the exported PDF. */
const BYTES_PER_MEBIBYTE = 1_048_576;
/** Strings that must not appear in the built page, matched ignoring case. */
const BANNED_CASE_INSENSITIVE = [
  "linkedin.com/feed",
  "linkedin.com/posts",
  "linkedin.com/pulse",
  "lnkd.in",
  "lorem",
];
/** Leftover draft markers that must not appear in the built page, matched case-sensitively. */
const BANNED_EXACT = ["TODO", "PASTE-"];
/** Files that must exist in `dist/` for the page, its PDF export, and its share previews to work. */
const REQUIRED_FILES = [
  "apple-touch-icon.png",
  "click-shortfall-capstone.pdf",
  "favicon.svg",
  "og.png",
];
/** The share card width in pixels that the Open Graph tags declare. */
const SHARE_CARD_WIDTH = 1200;
/** The share card height in pixels that the Open Graph tags declare. */
const SHARE_CARD_HEIGHT = 630;
/** Byte offset of the width field in a PNG, right after the 8-byte signature and the IHDR chunk length and type. */
const PNG_WIDTH_OFFSET = 16;
/** Byte offset of the height field in a PNG, directly after the width. */
const PNG_HEIGHT_OFFSET = 20;
/** Matches the URL inside each `href` or `src` attribute and captures it as `url`. */
const ASSET_ATTRIBUTE = /\b(?:href|src)="(?<url>[^"]+)"/gu;

/** The only external URL prefixes the built page may contain, so no unreviewed third-party host slips in. */
const ALLOWED_URL_PREFIXES = [
  "http://www.sitemaps.org/",
  "http://www.w3.org/",
  "https://colab.research.google.com/github/neilivanorencia/",
  "https://flyrank.ai",
  "https://github.com/neilivanorencia",
  "https://linkedin.com/in/neilivanorencia",
  "https://neilivanorencia.github.io/",
  "https://schema.org",
  "https://www.w3.org/",
];
/** Matches absolute URLs anywhere in the HTML, stopping at quotes, brackets, and other delimiters. */
const URL_PATTERN = /https?:\/\/[^\s"'<>)\]\\`,;]+/gu;
/** Matches runs of 16 or more hex characters that contain a letter, so hash-like values are caught but long plain numbers are not. */
const HEX_IDENTIFIER = /\b(?=[0-9]*[a-f])[0-9a-f]{16,}\b/giu;
/** Text that may directly precede a hash-like value, because font file names carry content hashes. */
const ALLOWED_HEX_CONTEXTS = ["Geist-", "Geist Mono-", "fonts/"];
/** How many characters before a hash-like value are compared against the allowed contexts. */
const HEX_CONTEXT_LENGTH = 12;
/** How many leading characters of a hash-like value appear in the failure message, so the full value is never printed. */
const MASK_LENGTH = 4;
/** Matches an email address. */
const EMAIL = /[\w.+-]+@[\w-]+(?:\.[\w-]+)+/u;
/** Matches a Windows drive path or a `/Users/` or `/home/` path, which would leak the build machine. */
const LOCAL_PATH = /\b[A-Za-z]:\\|\/Users\/|\/home\//u;
/** Matches secret-looking tokens with common provider prefixes such as `hf_`, `ghp_`, `sk-`, and `AKIA`. */
const SECRET = /\b(?:hf_|ghp_|sk-)[A-Za-z0-9]{20,}|\bAKIA[0-9A-Z]{12,}/u;
/** Matches the start of an HTML comment, which the built page should not contain. */
const HTML_COMMENT = /<!--/u;
/** Matches bare domain names with common top-level domains in visible text. */
const DOMAIN_IN_TEXT =
  /\b[a-z0-9-]+(?:\.[a-z0-9-]+)*\.(?:ai|app|co|com|dev|edu|gov|info|io|me|net|org|ph|uk|us|xyz)\b/giu;
/** The only domain names that may appear in visible text, in lowercase. */
const ALLOWED_TEXT_DOMAINS = new Set(["flyrank.ai"]);

/** Matches the content security policy meta tag and captures its content as `policy`. */
const CSP_META = /<meta http-equiv="content-security-policy" content="(?<policy>[^"]*)"/u;
/** Matches each script element and captures its `attributes` and `body`. */
const INLINE_SCRIPT = /<script(?<attributes>[^>]*)>(?<body>[\s\S]*?)<\/script>/gu;

/** The Astro build output folder that this script checks. */
const distDir = join(import.meta.dirname, "..", "dist");
/** The built home page that most checks read. */
const indexPath = join(distDir, "index.html");
/** Messages for every failed check, collected so one run reports all problems. */
const failures: string[] = [];

/**
 * Collects the local asset paths that the page links to under the site base path.
 * @param html - The built page's HTML.
 * @returns The linked paths relative to `dist/`, without query strings or fragments.
 */
const localAssetPaths = (html: string): Set<string> => {
  const paths = new Set<string>();
  for (const match of html.matchAll(ASSET_ATTRIBUTE)) {
    const url = match.groups?.url ?? "";
    // Strips the base path, then drops any query string or fragment.
    const [path = ""] = url.slice(BASE_PATH.length).split(/[?#]/u);
    // External links, the base path itself, and directory links are not files to check.
    if (url.startsWith(BASE_PATH) && path !== "" && !path.endsWith("/")) {
      paths.add(path);
    }
  }
  return paths;
};

/**
 * Checks that `og.png` has the size the Open Graph tags promise.
 */
const checkShareCardSize = (): void => {
  const png = readFileSync(join(distDir, "og.png"));
  // The dimensions sit at fixed offsets in the PNG header, so no image library is needed.
  const width = png.readUInt32BE(PNG_WIDTH_OFFSET);
  const height = png.readUInt32BE(PNG_HEIGHT_OFFSET);
  // The Open Graph tags declare the constant size, so any other size is a mismatch.
  if (width !== SHARE_CARD_WIDTH || height !== SHARE_CARD_HEIGHT) {
    failures.push(
      `og.png is ${width} x ${height}, but the Open Graph tags say ${SHARE_CARD_WIDTH} x ${SHARE_CARD_HEIGHT}.`
    );
  }
};

/**
 * Records a failure for every URL in the page whose prefix is not on the allow list.
 * @param html - The built page's HTML.
 */
const checkUrls = (html: string): void => {
  for (const match of html.matchAll(URL_PATTERN)) {
    // Only the host is reported, so a failure message never repeats a full link.
    if (!ALLOWED_URL_PREFIXES.some((prefix) => match[0].startsWith(prefix))) {
      failures.push(`dist/index.html links to ${new URL(match[0]).host}, which is not allowed.`);
    }
  }
};

/**
 * Records a failure for hash-like values, email addresses, local paths, secrets, and HTML comments in the page.
 * @param html - The built page's HTML.
 */
const checkIdentifiers = (html: string): void => {
  for (const match of html.matchAll(HEX_IDENTIFIER)) {
    // Looks at the text just before the value to allow hashed font file names.
    const before = html.slice(Math.max(0, match.index - HEX_CONTEXT_LENGTH), match.index);
    if (!ALLOWED_HEX_CONTEXTS.some((context) => before.endsWith(context))) {
      failures.push(
        `dist/index.html has a ${match[0].length}-character hash-like value (${match[0].slice(0, MASK_LENGTH)}…).`
      );
    }
  }
  const patterns = [
    { label: "an email address", pattern: EMAIL },
    { label: "a local file path", pattern: LOCAL_PATH },
    { label: "a secret-looking token", pattern: SECRET },
    { label: "an HTML comment", pattern: HTML_COMMENT },
  ];
  for (const { label, pattern } of patterns) {
    // One failure per kind is enough, so the pattern is only tested once.
    if (pattern.test(html)) {
      failures.push(`dist/index.html contains ${label}.`);
    }
  }
};

/**
 * Records a failure for every domain name shown in the page's visible text that is not allowed.
 * @param html - The built page's HTML.
 */
const checkTextDomains = (html: string): void => {
  // Scripts, styles, and tags are removed first, so only text a reader sees is checked.
  const text = html
    .replaceAll(/<(?:script|style)[^>]*>[\s\S]*?<\/(?:script|style)>/gu, " ")
    .replaceAll(/<[^>]*>/gu, " ");
  for (const match of text.matchAll(DOMAIN_IN_TEXT)) {
    if (!ALLOWED_TEXT_DOMAINS.has(match[0].toLowerCase())) {
      failures.push(`dist/index.html shows the domain name "${match[0]}" in its text.`);
    }
  }
};

/**
 * Records a failure for every inline script whose hash is missing from the content security policy.
 * @param html - The built page's HTML.
 * @param policy - The full content security policy string from the meta tag.
 */
const checkInlineScripts = (html: string, policy: string): void => {
  for (const match of html.matchAll(INLINE_SCRIPT)) {
    const attributes = match.groups?.attributes ?? "";
    // Scripts with a `src` load external code and `ld+json` blocks are data, so only the rest execute inline.
    const runs = !attributes.includes("src=") && !attributes.includes("ld+json");
    // The policy lists the SHA-256 of the body exactly as written, so the browser allows only that script.
    const hash = createHash("sha256")
      .update(match.groups?.body ?? "")
      .digest("base64");
    if (runs && !policy.includes(`'sha256-${hash}'`)) {
      failures.push("An inline script is not covered by a hash in the content security policy.");
    }
  }
};

/**
 * Checks that the page has a content security policy that forbids unsafe scripts and covers its inline scripts.
 * @param html - The built page's HTML.
 */
const checkContentSecurityPolicy = (html: string): void => {
  const policy = CSP_META.exec(html)?.groups?.policy;
  // Without a policy there is nothing further to inspect.
  if (policy === undefined) {
    failures.push("dist/index.html has no content security policy.");
    return;
  }
  const scriptPolicy = policy
    .split(";")
    .map((directive) => directive.trim())
    .find((directive) => directive.startsWith("script-src "));
  // A missing script-src falls back to looser defaults, and unsafe keywords defeat the hash checks.
  if (scriptPolicy === undefined || /unsafe-(?:inline|eval)/u.test(scriptPolicy)) {
    failures.push("The script-src policy is missing or allows 'unsafe-inline' or 'unsafe-eval'.");
  }
  checkInlineScripts(html, policy);
};

// Runs every check against the built page when it exists.
if (existsSync(indexPath)) {
  const html = readFileSync(indexPath, "utf8");
  const lowerHtml = html.toLowerCase();

  // The data credit is a requirement of the project, so a build without it must fail.
  if (!html.includes("flyrank.ai")) {
    failures.push("dist/index.html is missing the flyrank.ai data credit.");
  }
  for (const word of BANNED_CASE_INSENSITIVE) {
    if (lowerHtml.includes(word)) {
      failures.push(`dist/index.html contains "${word}".`);
    }
  }
  for (const word of BANNED_EXACT) {
    if (html.includes(word)) {
      failures.push(`dist/index.html contains "${word}".`);
    }
  }
  checkUrls(html);
  checkIdentifiers(html);
  checkTextDomains(html);
  checkContentSecurityPolicy(html);
  for (const file of REQUIRED_FILES) {
    if (!existsSync(join(distDir, file))) {
      failures.push(`dist/${file} is missing.`);
    }
  }
  // The size check reads the file, so it only runs when the file exists.
  if (existsSync(join(distDir, "og.png"))) {
    checkShareCardSize();
  }
  for (const assetPath of localAssetPaths(html)) {
    const filePath = join(distDir, decodeURIComponent(assetPath));
    // A linked file that is absent from the build would be a broken link.
    if (!existsSync(filePath)) {
      failures.push(`dist/index.html links to ${assetPath}, which is missing from dist/.`);
    } else if (assetPath.endsWith(".pdf") && statSync(filePath).size < BYTES_PER_MEBIBYTE) {
      // A small PDF is likely a failed or empty export.
      failures.push(`${assetPath} is smaller than 1 MB; the report export looks incomplete.`);
    }
  }
} else {
  // Nothing can be checked without a build, so this is reported as the failure.
  failures.push("dist/index.html does not exist; did astro build run?");
}

if (failures.length > 0) {
  // Lists every failure and sets the exit code instead of exiting early, so output is flushed.
  console.error("check-build failed:");
  for (const failure of failures) {
    console.error(`  - ${failure}`);
  }
  process.exitCode = 1;
} else {
  console.log(
    "check-build passed: credit, assets, privacy and content security policy checks all clear."
  );
}
