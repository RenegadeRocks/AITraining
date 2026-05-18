import Anthropic from "@anthropic-ai/sdk";

let client: Anthropic | null = null;

function getClient(): Anthropic {
  if (client) return client;
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error("ANTHROPIC_API_KEY is not set.");
  client = new Anthropic({ apiKey });
  return client;
}

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

export async function answerQuestion(question: string, sessionTitle: string): Promise<string> {
  const c = getClient();
  const response = await c.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 800,
    system: SYSTEM_PROMPT,
    messages: [
      {
        role: "user",
        content: `Training session topic: ${sessionTitle}\n\nQuestion: ${question}`,
      },
    ],
  });

  const text = response.content
    .filter((block): block is Anthropic.TextBlock => block.type === "text")
    .map((block) => block.text)
    .join("\n")
    .trim();

  return text || "I wasn't able to generate an answer. Try escalating to the instructor.";
}
