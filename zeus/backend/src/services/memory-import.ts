/**
 * Memory import — parse various data formats into importable chunks.
 *
 * Supported formats:
 *  - zeus      Zeus native export  (JSON array of {content, type})
 *  - chatgpt   ChatGPT data export (conversations.json)
 *  - json      Generic JSON array  ([string] or [{content, text, ...}])
 *  - text      Plain text / Markdown (split by paragraph / heading)
 *  - csv       CSV with "content" column (+ optional "type" column)
 *  - pdf       PDF binary (via pdf-parse)
 *  - xlsx      Excel workbook (via xlsx)
 */

export interface ImportEntry {
  content: string;
  type: string;
  source?: string;
}

export type ImportFormat = "zeus" | "chatgpt" | "json" | "text" | "csv" | "pdf" | "xlsx" | "unknown";

// ── Auto-detect ─────────────────────────────────

export function detectFormat(filename: string, raw: string): ImportFormat {
  const ext = filename.toLowerCase().split(".").pop() || "";

  if (ext === "pdf") return "pdf";
  if (ext === "xlsx" || ext === "xls") return "xlsx";
  if (ext === "csv") return "csv";

  if (ext === "json" || ext === "txt" || ext === "md" || raw.trimStart().startsWith("[") || raw.trimStart().startsWith("{")) {
    try {
      const parsed = JSON.parse(raw);

      // ChatGPT conversations.json: array with "mapping" objects
      if (Array.isArray(parsed) && parsed.length > 0 && parsed[0]?.mapping !== undefined) {
        return "chatgpt";
      }

      // Zeus native: array with {content, type}
      if (Array.isArray(parsed) && parsed.length > 0 && typeof parsed[0]?.content === "string" && typeof parsed[0]?.type === "string") {
        return "zeus";
      }

      // Generic JSON
      if (Array.isArray(parsed)) return "json";
      if (typeof parsed === "object" && parsed !== null) return "json";
    } catch {
      // not valid JSON
    }
  }

  return "text";
}

// ── Parsers ──────────────────────────────────────

export function parseZeus(raw: string): ImportEntry[] {
  const arr = JSON.parse(raw);
  return arr
    .filter((item: any) => typeof item.content === "string" && item.content.trim())
    .map((item: any) => ({
      content: item.content.trim(),
      type: String(item.type || "import"),
      source: "zeus_export",
    }));
}

export function parseChatGPT(raw: string): ImportEntry[] {
  const conversations = JSON.parse(raw) as any[];
  const entries: ImportEntry[] = [];

  for (const conv of conversations) {
    const title = conv.title || "Untitled";
    const mapping = conv.mapping as Record<string, any> | undefined;
    if (!mapping) continue;

    const parts: string[] = [];

    // Walk nodes in message order via parent→children
    for (const node of Object.values(mapping)) {
      const msg = node?.message;
      if (!msg) continue;

      const role: string = msg.author?.role;
      if (!role || role === "system") continue;

      // Content can be parts array or string
      let text = "";
      const c = msg.content;
      if (typeof c?.parts === "object" && Array.isArray(c.parts)) {
        text = c.parts
          .filter((p: any) => typeof p === "string")
          .join("\n")
          .trim();
      } else if (typeof c === "string") {
        text = c.trim();
      } else if (typeof c?.text === "string") {
        text = c.text.trim();
      }

      if (text.length > 20) {
        parts.push(`[${role}]: ${text}`);
      }
    }

    if (parts.length === 0) continue;

    // Store each conversation as one or more chunks
    const fullText = `# ${title}\n\n${parts.join("\n\n")}`;
    entries.push({
      content: fullText,
      type: "chatgpt_conversation",
      source: title,
    });
  }

  return entries;
}

export function parseGenericJson(raw: string): ImportEntry[] {
  const parsed = JSON.parse(raw);
  const entries: ImportEntry[] = [];

  const items: any[] = Array.isArray(parsed) ? parsed : [parsed];

  for (const item of items) {
    if (typeof item === "string" && item.trim().length > 10) {
      entries.push({ content: item.trim(), type: "import" });
    } else if (typeof item === "object" && item !== null) {
      // Try common field names
      const text =
        item.content ||
        item.text ||
        item.message ||
        item.body ||
        item.summary ||
        item.note ||
        (typeof item.value === "string" ? item.value : null);

      if (text && typeof text === "string" && text.trim().length > 10) {
        entries.push({
          content: text.trim(),
          type: String(item.type || item.category || "import"),
          source: item.source || item.title || undefined,
        });
      } else if (Object.keys(item).length > 0) {
        // Fallback: stringify the whole object
        const s = JSON.stringify(item, null, 2);
        if (s.length > 20) {
          entries.push({ content: s, type: "import" });
        }
      }
    }
  }

  return entries;
}

export function parseText(raw: string): ImportEntry[] {
  // Split on double newlines (paragraphs) or markdown headings
  const sections = raw
    .split(/\n{2,}/)
    .map((s) => s.trim())
    .filter((s) => s.length > 30);

  // If very few large sections, just return them as-is
  return sections.map((content) => ({ content, type: "document" }));
}

export function parseCsv(raw: string): ImportEntry[] {
  const lines = raw.split(/\r?\n/).filter((l) => l.trim());
  if (lines.length < 2) return [];

  // Detect delimiter
  const delim = lines[0].includes(";") ? ";" : ",";

  const headers = parseCsvLine(lines[0], delim).map((h) => h.toLowerCase().trim());
  const contentIdx = headers.findIndex((h) => ["content", "text", "message", "body", "note"].includes(h));
  const typeIdx = headers.findIndex((h) => h === "type" || h === "category");

  if (contentIdx === -1) {
    // No header match — treat each line as content
    return lines.slice(1).map((l) => ({ content: l.trim(), type: "import" })).filter((e) => e.content.length > 10);
  }

  const entries: ImportEntry[] = [];
  for (const line of lines.slice(1)) {
    const cols = parseCsvLine(line, delim);
    const content = cols[contentIdx]?.trim();
    if (!content || content.length < 5) continue;
    const type = typeIdx >= 0 ? (cols[typeIdx]?.trim() || "import") : "import";
    entries.push({ content, type });
  }
  return entries;
}

function parseCsvLine(line: string, delim: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') { current += '"'; i++; }
      else inQuotes = !inQuotes;
    } else if (ch === delim && !inQuotes) {
      result.push(current);
      current = "";
    } else {
      current += ch;
    }
  }
  result.push(current);
  return result;
}

export async function parsePdf(buffer: Buffer): Promise<ImportEntry[]> {
  const pdfParse = (await import("pdf-parse")).default;
  const data = await pdfParse(buffer);
  const text = data.text.trim();
  if (!text) return [];
  return parseText(text).map((e) => ({ ...e, type: "document" }));
}

export async function parseXlsx(buffer: Buffer): Promise<ImportEntry[]> {
  const XLSX = await import("xlsx");
  const wb = XLSX.read(buffer, { type: "buffer" });
  const entries: ImportEntry[] = [];

  for (const sheetName of wb.SheetNames) {
    const sheet = wb.Sheets[sheetName];
    const rows: any[] = XLSX.utils.sheet_to_json(sheet);

    if (rows.length === 0) continue;

    // Try to find content-like column
    const sampleRow = rows[0];
    const keys = Object.keys(sampleRow);
    const contentKey = keys.find((k) => ["content", "text", "message", "body", "note"].includes(k.toLowerCase()))
      || keys.find((k) => k.toLowerCase().includes("content") || k.toLowerCase().includes("text"));

    if (contentKey) {
      const typeKey = keys.find((k) => k.toLowerCase() === "type" || k.toLowerCase() === "category");
      for (const row of rows) {
        const content = String(row[contentKey] || "").trim();
        if (content.length < 5) continue;
        const type = typeKey ? String(row[typeKey] || "import") : "import";
        entries.push({ content, type });
      }
    } else {
      // Fallback: CSV-style dump of the sheet
      const csv = XLSX.utils.sheet_to_csv(sheet);
      entries.push({ content: `[Sheet: ${sheetName}]\n${csv}`, type: "document" });
    }
  }

  return entries;
}

// ── Main entry point ─────────────────────────────

export async function parseImportFile(
  filename: string,
  buffer: Buffer
): Promise<{ entries: ImportEntry[]; format: ImportFormat }> {
  const ext = filename.toLowerCase().split(".").pop() || "";

  if (ext === "pdf") {
    return { entries: await parsePdf(buffer), format: "pdf" };
  }

  if (ext === "xlsx" || ext === "xls") {
    return { entries: await parseXlsx(buffer), format: "xlsx" };
  }

  const raw = buffer.toString("utf-8");
  const format = detectFormat(filename, raw);

  switch (format) {
    case "zeus":
      return { entries: parseZeus(raw), format };
    case "chatgpt":
      return { entries: parseChatGPT(raw), format };
    case "json":
      return { entries: parseGenericJson(raw), format };
    case "csv":
      return { entries: parseCsv(raw), format };
    case "text":
    default:
      return { entries: parseText(raw), format: "text" };
  }
}
