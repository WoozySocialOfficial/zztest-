// Caption generation via the Anthropic Messages API (server-side only).

export interface CaptionContext {
  clientName: string;
  styleNotes: string;
  captionRules: string[]; // cumulative learn_rules with scope=caption
  headline?: string;
  productUrl?: string;
}

export async function writeCaptions(
  ctx: CaptionContext,
  apiKey: string,
  model: string,
  count: number,
): Promise<string[]> {
  const rules = ctx.captionRules.length
    ? `Brand rules (follow ALL, exactly):\n- ${ctx.captionRules.join("\n- ")}`
    : "";
  const style = ctx.styleNotes ? `Brand voice/style notes: ${ctx.styleNotes}` : "";

  const prompt = `You write social media captions for ${ctx.clientName}.
${style}
${rules}

Write ${count} distinct caption option${count > 1 ? "s" : ""} for this post.${
    ctx.headline ? `\nTopic: ${ctx.headline}` : ""
  }${ctx.productUrl ? `\nLink/context: ${ctx.productUrl}` : ""}

Constraints:
- Stay strictly on-brand. Do NOT invent facts, prices, offers, dates, or claims not given above. This is client-facing.
- 1-3 short sentences each. Natural hashtags only if they genuinely fit.
- Return ONLY a JSON array of strings, e.g. ["caption one","caption two"]. No other text.`;

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model,
      max_tokens: 1024,
      messages: [{ role: "user", content: prompt }],
    }),
  });
  if (!res.ok) {
    const detail = await res.text();
    throw new Error(`Anthropic error ${res.status}: ${detail.slice(0, 300)}`);
  }
  const data = (await res.json()) as {
    content: { type: string; text?: string }[];
  };
  const text = data.content
    .filter((b) => b.type === "text")
    .map((b) => b.text ?? "")
    .join("")
    .trim();

  // Be forgiving: parse a JSON array, else fall back to the raw text as one option.
  try {
    const match = text.match(/\[[\s\S]*\]/);
    const parsed = JSON.parse(match ? match[0] : text);
    if (Array.isArray(parsed)) return parsed.map(String).slice(0, count);
  } catch {
    /* fall through */
  }
  return [text];
}
