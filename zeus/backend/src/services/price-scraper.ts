import * as cheerio from "cheerio";

const USER_AGENTS = [
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
];

function randomUA() {
  return USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];
}

function parsePrice(str: string): number | null {
  if (!str) return null;
  const cleaned = str.replace(/[^\d.,]/g, "");
  if (!cleaned) return null;
  // Handle European format: 1.234,56 → 1234.56
  const euroFormat = /^\d{1,3}(\.\d{3})*(,\d{2})?$/.test(cleaned);
  const normalized = euroFormat
    ? cleaned.replace(/\./g, "").replace(",", ".")
    : cleaned.replace(/,/g, "");
  const val = parseFloat(normalized);
  return isNaN(val) || val <= 0 ? null : val;
}

export function extractAsin(url: string): string {
  const m = url.match(/\/dp\/([A-Z0-9]{10})|\/gp\/product\/([A-Z0-9]{10})|asin=([A-Z0-9]{10})/);
  return m ? (m[1] || m[2] || m[3] || "") : "";
}

async function fetchPage(url: string): Promise<string> {
  const res = await fetch(url, {
    headers: {
      "User-Agent": randomUA(),
      "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      "Accept-Language": "en-US,en;q=0.9",
      "Accept-Encoding": "gzip, deflate, br",
      "Cache-Control": "no-cache",
    },
    signal: AbortSignal.timeout(15000),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.text();
}

export async function scrapeAmazon(url: string): Promise<{ price: number | null; title: string | null; currency: string }> {
  try {
    const html = await fetchPage(url);
    const $ = cheerio.load(html);

    const title = $("#productTitle").text().trim() || null;

    const priceSelectors = [
      ".a-price .a-offscreen",
      "#corePriceDisplay_desktop_feature_div .a-offscreen",
      "#corePrice_desktop .a-offscreen",
      ".a-color-price",
      "#price_inside_buybox",
      "#priceblock_ourprice",
      "#priceblock_dealprice",
      ".apexPriceToPay .a-offscreen",
    ];

    let priceStr = "";
    for (const sel of priceSelectors) {
      const el = $(sel).first();
      if (el.length) {
        priceStr = el.text().trim();
        if (priceStr) break;
      }
    }

    const currency = priceStr.includes("€") ? "EUR" : priceStr.includes("£") ? "GBP" : "USD";
    const price = parsePrice(priceStr);

    return { price, title, currency };
  } catch {
    return { price: null, title: null, currency: "USD" };
  }
}

export async function scrapeGeneric(url: string): Promise<{ price: number | null; title: string | null; currency: string }> {
  try {
    const html = await fetchPage(url);
    const $ = cheerio.load(html);

    const title = $("h1").first().text().trim() || $("title").text().trim() || null;

    // Try structured data first
    const jsonLdScripts = $('script[type="application/ld+json"]').toArray();
    for (const s of jsonLdScripts) {
      try {
        const data = JSON.parse($(s).html() || "{}");
        const items = Array.isArray(data) ? data : [data];
        for (const item of items) {
          const offer = item.offers || item.offer;
          if (offer) {
            const p = offer.price || offer.lowPrice;
            if (p) return { price: parseFloat(p), title: item.name || title, currency: offer.priceCurrency || "USD" };
          }
        }
      } catch {}
    }

    // Try meta tags
    const metaPrice =
      $('meta[property="product:price:amount"]').attr("content") ||
      $('meta[itemprop="price"]').attr("content");
    if (metaPrice) {
      const currency = $('meta[property="product:price:currency"]').attr("content") || "USD";
      return { price: parseFloat(metaPrice), title, currency };
    }

    // Try common price selectors
    const priceSelectors = [
      '[itemprop="price"]', '[data-price]', '.price', '#price', '.product-price',
      '.offer-price', '.sale-price', '.current-price', '[class*="price--current"]',
      '[class*="price_current"]', '[class*="productPrice"]',
    ];

    for (const sel of priceSelectors) {
      const el = $(sel).first();
      if (!el.length) continue;
      const raw = el.attr("content") || el.attr("data-price") || el.text();
      const p = parsePrice(raw || "");
      if (p && p < 100000) {
        const currency = (raw || "").includes("€") ? "EUR" : (raw || "").includes("£") ? "GBP" : "USD";
        return { price: p, title, currency };
      }
    }

    return { price: null, title, currency: "USD" };
  } catch {
    return { price: null, title: null, currency: "USD" };
  }
}

export async function scrapePrice(url: string): Promise<{ price: number | null; title: string | null; currency: string }> {
  if (url.includes("amazon.")) return scrapeAmazon(url);
  return scrapeGeneric(url);
}

export interface AmazonProduct {
  asin: string;
  title: string;
  price: number | null;
  url: string;
  image: string;
}

export async function searchAmazon(query: string, marketplace = "com"): Promise<AmazonProduct[]> {
  try {
    const searchUrl = `https://www.amazon.${marketplace}/s?k=${encodeURIComponent(query)}`;
    const html = await fetchPage(searchUrl);
    const $ = cheerio.load(html);

    const results: AmazonProduct[] = [];

    $("[data-asin]").each((_i, el) => {
      const asin = $(el).attr("data-asin") || "";
      if (!asin) return;

      const titleEl = $(el).find("h2 a span, .a-size-medium").first();
      const title = titleEl.text().trim();
      if (!title) return;

      const priceStr = $(el).find(".a-price .a-offscreen").first().text().trim();
      const price = parsePrice(priceStr);

      const href = $(el).find("h2 a").attr("href") || "";
      const url = href.startsWith("http") ? href : `https://www.amazon.${marketplace}${href}`;

      const image = $(el).find(".s-image").attr("src") || "";

      results.push({ asin, title, price, url, image });

      if (results.length >= 10) return false;
    });

    return results;
  } catch {
    return [];
  }
}
