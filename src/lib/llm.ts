const SYSTEM_PROMPT = `You are a helpful study companion for someone attending an advanced AI training session.

Style:
- Answer clearly and directly. Get to the point in the first sentence.
- Prefer concrete examples over abstract definitions.
- Keep it tight: 2-6 short paragraphs or a short bulleted list. No throat-clearing.
- Use plain text. Light markdown is fine (bold, lists), but no headings or code blocks unless code is genuinely needed.
- If the question is ambiguous, answer the most likely interpretation and note the assumption in one line.
- If the question is outside AI/ML/software/product topics relevant to a working professional, still answer helpfully but briefly.
- If you genuinely don't know, say so in one line and suggest escalating to the instructor.

Never:
- Pretend to know the specifics of this particular training course's slides or materials.
- Recommend the user "escalate" unless you actually can't help.`;

const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";
const DEFAULT_MODEL = "anthropic/claude-sonnet-4.5";
const REQUEST_TIMEOUT_MS = 25_000;

export async function answerQuestion(question: string, sessionTitle: string): Promise<string> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) throw new Error("OPENROUTER_API_KEY is not set.");

  const model = process.env.OPENROUTER_MODEL || DEFAULT_MODEL;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  let res: Response;
  try {
    res = await fetch(OPENROUTER_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
        "HTTP-Referer": process.env.OPENROUTER_SITE_URL || "https://ask-the-room.local",
        "X-Title": "Ask the Room",
      },
      body: JSON.stringify({
        model,
        max_tokens: 800,
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          {
            role: "user",
            content: `Training session topic: ${sessionTitle}\n\nQuestion: ${question}`,
          },
        ],
      }),
      signal: controller.signal,
    });
  } catch (e) {
    clearTimeout(timer);
    if ((e as { name?: string })?.name === "AbortError") {
      throw new Error(`OpenRouter timeout after ${REQUEST_TIMEOUT_MS}ms`);
    }
    throw e;
  }
  clearTimeout(timer);

  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(`OpenRouter ${res.status}: ${detail.slice(0, 300)}`);
  }

  const data = (await res.json()) as {
    choices?: { message?: { content?: string } }[];
    error?: { message?: string; code?: number | string };
  };

  if (data.error) {
    throw new Error(
      `OpenRouter error: ${data.error.message ?? "unknown"} (${data.error.code ?? "?"})`
    );
  }

  const text = data.choices?.[0]?.message?.content?.trim() ?? "";
  if (!text) {
    throw new Error("OpenRouter returned no content.");
  }
  return text;
}
