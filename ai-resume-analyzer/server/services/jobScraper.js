/**
 * Job Posting URL Web Scraper Service
 *
 * Fetches and parses job postings from popular ATS platforms (Greenhouse, Lever, Workday)
 * and generic career pages / job boards (Indeed, LinkedIn public listings, etc.).
 * Strips boilerplate scripts, styles, and navigation to extract clean job description text.
 */

import * as cheerio from "cheerio";

const BROWSER_USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36";

/**
 * Validates and normalizes candidate URL string.
 */
export function validateUrl(rawUrl) {
  if (!rawUrl || typeof rawUrl !== "string") {
    throw new Error("Job posting URL is required.");
  }

  let normalized = rawUrl.trim();
  if (!/^https?:\/\//i.test(normalized)) {
    normalized = `https://${normalized}`;
  }

  try {
    const parsed = new URL(normalized);
    if (!["http:", "https:"].includes(parsed.protocol)) {
      throw new Error("Only HTTP and HTTPS URLs are supported.");
    }
    return parsed.href;
  } catch {
    throw new Error("Invalid URL format. Please provide a valid job posting link.");
  }
}

/**
 * Extracts domain-friendly company name fallback from URL hostname.
 */
function extractCompanyFromHostname(hostname) {
  if (!hostname) return "Target Company";
  const clean = hostname.replace(/^(?:www\.|careers\.|jobs\.|boards\.)+/i, "");
  const parts = clean.split(".");
  const name = parts[0] || "Target Company";
  return name.charAt(0).toUpperCase() + name.slice(1);
}

/**
 * Scrapes job posting URL and returns structured title, company, and clean description text.
 *
 * @param {string} targetUrl
 * @returns {Promise<{ title: string, company: string, description: string, url: string }>}
 */
export async function scrapeJobPosting(targetUrl) {
  const validUrl = validateUrl(targetUrl);
  const urlObj = new URL(validUrl);
  const hostname = urlObj.hostname.toLowerCase();

  const response = await fetch(validUrl, {
    method: "GET",
    headers: {
      "User-Agent": BROWSER_USER_AGENT,
      Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
      "Accept-Language": "en-US,en;q=0.9",
      "Cache-Control": "no-cache",
    },
    redirect: "follow",
  });

  if (!response.ok) {
    throw new Error(
      `Failed to fetch job posting (${response.status}: ${response.statusText}). The job listing might be private, expired, or blocking automated requests.`
    );
  }

  const html = await response.text();
  if (!html || html.trim().length === 0) {
    throw new Error("Target job posting returned an empty response.");
  }

  const $ = cheerio.load(html);

  // Remove noise elements
  $("script, style, noscript, svg, iframe, nav, footer, header, form, button, [role='dialog'], [role='alert']").remove();

  // Extract Metadata: Title
  let title =
    $('meta[property="og:title"]').attr("content") ||
    $('meta[name="twitter:title"]').attr("content") ||
    $("h1").first().text().trim() ||
    $("title").text().trim() ||
    "Job Position";

  // Clean title noise like " - Careers", " | Company"
  title = title.split(/\s*[-|•–—]\s*/)[0].trim() || title;

  // Extract Metadata: Company
  let company =
    $('meta[property="og:site_name"]').attr("content") ||
    $('[data-automation-id="companyName"]').text().trim() ||
    $(".company-name, .employer-name, .posting-headline h2").first().text().trim() ||
    extractCompanyFromHostname(hostname);

  // Platform-Specific Content Selectors
  let descriptionText = "";

  if (hostname.includes("greenhouse.io")) {
    descriptionText = $("#content, .job__description, #app-body, .body").text();
  } else if (hostname.includes("lever.co")) {
    descriptionText = $(".section-page, .posting-page, .content").text();
  } else if (hostname.includes("myworkdayjobs.com")) {
    descriptionText = $('[data-automation-id="jobPostingDescription"]').text();
  } else if (hostname.includes("indeed.com")) {
    descriptionText = $("#jobDescriptionText, .jobsearch-JobComponent-description").text();
  } else if (hostname.includes("linkedin.com")) {
    descriptionText = $(".show-more-less-html__markup, .description__text").text();
  }

  // Fallback: Semantic selectors
  if (!descriptionText || descriptionText.trim().length < 80) {
    const candidateSelectors = [
      '[class*="job-description"]',
      '[class*="jobDescription"]',
      '[class*="job_description"]',
      '[id*="job-description"]',
      '[id*="jobDescription"]',
      '[class*="description"]',
      "article",
      "main",
      ".content",
      "#content",
      "body",
    ];

    for (const selector of candidateSelectors) {
      const match = $(selector);
      if (match.length > 0) {
        const text = match.first().text();
        if (text && text.trim().length > 150) {
          descriptionText = text;
          break;
        }
      }
    }
  }

  // Clean up whitespace: collapse excessive empty lines and spaces
  const cleanedDescription = descriptionText
    .replace(/\r\n/g, "\n")
    .replace(/[ \t]+/g, " ")
    .replace(/\n\s*\n\s*\n+/g, "\n\n")
    .trim();

  if (!cleanedDescription || cleanedDescription.length < 80) {
    throw new Error(
      "Could not extract meaningful job description text from this link. The page may require a login or JavaScript rendering. Please paste the job description text manually."
    );
  }

  // Limit JD length to safe buffer size (e.g. 25,000 characters)
  const safeDescription =
    cleanedDescription.length > 25000
      ? cleanedDescription.slice(0, 25000)
      : cleanedDescription;

  return {
    title,
    company,
    description: safeDescription,
    url: validUrl,
  };
}
