import { log } from "../logger.js";

export interface ParsedTransaction {
  date: Date;
  description: string;
  amount: number; // positive = credit, negative = debit
  category: string;
}

// Auto-categorize based on description keywords
const CATEGORY_RULES: [RegExp, string][] = [
  [/salary|payroll|wage|income|virement/i, "Income"],
  [/rent|mortgage|loyer|hypotheque/i, "Housing"],
  [/electric|water|gas|internet|phone|utility|telecom|orange|sfr|bouygues/i, "Utilities"],
  [/restaurant|cafe|bar|boulangerie|bakery|food|grocery|supermarket|carrefour|aldi|lidl|monoprix|casino|leclerc|spar|uber.eat|deliveroo/i, "Food"],
  [/uber|taxi|train|metro|bus|sncf|ratp|petrol|fuel|parking|autoroute|toll/i, "Transport"],
  [/netflix|spotify|disney|amazon prime|hulu|cinema|theatre|concert|entertainment|game/i, "Entertainment"],
  [/amazon|zalando|shop|store|clothes|fashion|boutique|fnac|darty/i, "Shopping"],
  [/gym|doctor|pharmacy|dentist|hospital|health|medical|optical|sport/i, "Health"],
  [/school|tuition|formation|course|education/i, "Education"],
  [/insurance|assurance|mutuelle/i, "Insurance"],
  [/hotel|airbnb|flight|travel|booking|voyage/i, "Travel"],
  [/atm|withdrawal|retrait/i, "Cash"],
  [/loan|credit|interest|frais|bank fee|agios/i, "Bank Fees"],
  [/transfer|virement|paypal|revolut|wise/i, "Transfer"],
  [/investment|bourse|dividend|dividende/i, "Investment"],
];

function autoCategory(description: string): string {
  const desc = description.toLowerCase();
  for (const [re, cat] of CATEGORY_RULES) {
    if (re.test(desc)) return cat;
  }
  return "Other";
}

// Parse various date formats
function parseDate(s: string): Date | null {
  s = s.trim().replace(/['"]/g, "");

  // ISO: YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}/.test(s)) return new Date(s);

  // DD/MM/YYYY or DD.MM.YYYY
  const dmy = s.match(/^(\d{1,2})[\/\.\-](\d{1,2})[\/\.\-](\d{4})/);
  if (dmy) return new Date(`${dmy[3]}-${dmy[2].padStart(2,"0")}-${dmy[1].padStart(2,"0")}`);

  // MM/DD/YYYY (US format)
  const mdy = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/);
  if (mdy) {
    const d1 = parseInt(mdy[1]), d2 = parseInt(mdy[2]);
    if (d1 > 12) return new Date(`${mdy[3]}-${mdy[2].padStart(2,"0")}-${mdy[1].padStart(2,"0")}`);
    return new Date(`${mdy[3]}-${mdy[1].padStart(2,"0")}-${mdy[2].padStart(2,"0")}`);
  }

  // Fallback
  const d = new Date(s);
  return isNaN(d.getTime()) ? null : d;
}

// Parse a single CSV line respecting quotes
function parseCsvLine(line: string, delim: string): string[] {
  const result: string[] = [];
  let cur = "", inQ = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') { if (inQ && line[i+1] === '"') { cur += '"'; i++; } else inQ = !inQ; }
    else if (ch === delim && !inQ) { result.push(cur.trim()); cur = ""; }
    else cur += ch;
  }
  result.push(cur.trim());
  return result;
}

function parseAmount(s: string): number {
  if (!s) return NaN;
  // Remove currency symbols, spaces, and normalize decimal separator
  let clean = s.replace(/[€$£¥\s'"]/g, "").trim();
  // European format: 1.234,56 → 1234.56
  if (/\d{1,3}(\.\d{3})+,\d{2}$/.test(clean)) {
    clean = clean.replace(/\./g, "").replace(",", ".");
  }
  // French/European: comma as decimal
  else if (/^\-?\d+,\d+$/.test(clean)) {
    clean = clean.replace(",", ".");
  }
  // Remove thousands separator (comma in US format)
  else {
    clean = clean.replace(/,(\d{3})/g, "$1");
  }
  return parseFloat(clean);
}

export async function parseStatementCsv(raw: string): Promise<ParsedTransaction[]> {
  const lines = raw.split(/\r?\n/).filter(l => l.trim());
  if (lines.length < 2) return [];

  // Detect delimiter
  const firstLine = lines[0];
  const delim = firstLine.includes(";") ? ";" : firstLine.includes("\t") ? "\t" : ",";

  const headers = parseCsvLine(firstLine, delim).map(h => h.toLowerCase().replace(/['"]/g, "").trim());

  // Find column indices
  const dateIdx = headers.findIndex(h => /date|datum|fecha|data/.test(h));
  const descIdx = headers.findIndex(h => /description|libelle|label|detail|narration|memo|text|name|merchant/.test(h));
  const amountIdx = headers.findIndex(h => /^amount$|^montant$|^betrag$|^importe$|^solde$/.test(h));
  const debitIdx = headers.findIndex(h => /debit|withdrawal|sortie|ausgabe/.test(h));
  const creditIdx = headers.findIndex(h => /credit|deposit|entree|einnahme/.test(h));

  if (dateIdx === -1) {
    await log("warn", "finance", "CSV statement: could not find date column");
    return [];
  }

  const results: ParsedTransaction[] = [];

  for (const line of lines.slice(1)) {
    if (!line.trim()) continue;
    const cols = parseCsvLine(line, delim);
    if (cols.length <= dateIdx) continue;

    const date = parseDate(cols[dateIdx] || "");
    if (!date) continue;

    const description = descIdx >= 0 ? cols[descIdx]?.replace(/['"]/g, "").trim() : cols.slice(1).join(" ").slice(0, 100);
    if (!description) continue;

    let amount: number;

    if (amountIdx >= 0) {
      amount = parseAmount(cols[amountIdx] || "");
    } else if (debitIdx >= 0 || creditIdx >= 0) {
      const debit = debitIdx >= 0 ? parseAmount(cols[debitIdx] || "") : NaN;
      const credit = creditIdx >= 0 ? parseAmount(cols[creditIdx] || "") : NaN;
      const dv = isNaN(debit) ? 0 : Math.abs(debit);
      const cv = isNaN(credit) ? 0 : Math.abs(credit);
      amount = cv > 0 ? cv : -dv;
    } else {
      continue;
    }

    if (isNaN(amount)) continue;

    results.push({
      date,
      description,
      amount,
      category: autoCategory(description),
    });
  }

  return results;
}

export async function parseStatementPdf(buffer: Buffer): Promise<ParsedTransaction[]> {
  try {
    const pdfParse = (await import("pdf-parse")).default;
    const data = await pdfParse(buffer);
    return parseStatementText(data.text);
  } catch (e: any) {
    await log("warn", "finance", `PDF parse error: ${e.message}`);
    return [];
  }
}

// Try to extract transactions from raw text (PDF extraction)
function parseStatementText(text: string): ParsedTransaction[] {
  const results: ParsedTransaction[] = [];
  const lines = text.split("\n").map(l => l.trim()).filter(Boolean);

  // Pattern: date + description + amount
  // Many bank PDFs have lines like: "12/01/2024  AMAZON MARKETPLACE  -42.99"
  const linePattern = /(\d{1,2}[\/\.\-]\d{1,2}[\/\.\-]\d{2,4})\s+(.+?)\s+([\-\+]?\d[\d,\.]*)\s*$/;

  for (const line of lines) {
    const m = line.match(linePattern);
    if (!m) continue;

    const date = parseDate(m[1]);
    if (!date) continue;

    const description = m[2].trim();
    const amount = parseAmount(m[3]);
    if (isNaN(amount) || description.length < 2) continue;

    results.push({ date, description, amount, category: autoCategory(description) });
  }

  return results;
}
