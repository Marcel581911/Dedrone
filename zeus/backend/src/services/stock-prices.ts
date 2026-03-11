import { log } from "../logger.js";

export interface StockQuote {
  ticker: string;
  name: string;
  price: number;
  changePercent: number;
  currency: string;
  marketState: string; // REGULAR, PRE, POST, CLOSED
}

export async function fetchQuotes(tickers: string[]): Promise<Record<string, StockQuote>> {
  if (tickers.length === 0) return {};

  const symbols = tickers.join(",");
  const url = `https://query2.finance.yahoo.com/v7/finance/quote?symbols=${encodeURIComponent(symbols)}&fields=regularMarketPrice,regularMarketChangePercent,shortName,currency,marketState`;

  try {
    const res = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0" },
      signal: AbortSignal.timeout(8000),
    });

    if (!res.ok) throw new Error(`Yahoo Finance API error: ${res.status}`);

    const data = await res.json() as any;
    const results: Record<string, StockQuote> = {};

    for (const item of (data?.quoteResponse?.result || [])) {
      results[item.symbol] = {
        ticker: item.symbol,
        name: item.shortName || item.longName || item.symbol,
        price: item.regularMarketPrice ?? 0,
        changePercent: item.regularMarketChangePercent ?? 0,
        currency: item.currency || "USD",
        marketState: item.marketState || "CLOSED",
      };
    }

    return results;
  } catch (e: any) {
    await log("warn", "stocks", `Price fetch failed: ${e.message}`);
    return {};
  }
}
