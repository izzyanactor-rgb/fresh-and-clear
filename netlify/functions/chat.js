const resources = require("./resources.json");

const SYSTEM_PROMPT = `You are embedded in the Dementia Care Directory (Toronto & Ontario). Your ONLY source of truth is the resource list below — nothing else, no outside knowledge.

RESOURCES:
${JSON.stringify(resources, null, 2)}

Rules:
- Answer only from this list. You may filter, compare, and group across entries (e.g. "which of these help with respite care").
- Never invent an organization, phone number, or fact not in this list.
- If nothing here fits what's being asked, say so plainly and suggest calling 211 Ontario, which is on the list.
- Never give medical or clinical advice, and never tell someone which single option to pick — help them narrow it down, the choice is theirs.
- Keep answers short and warm — a caregiver reading this may be tired or overwhelmed. No long lists back at them; two or three relevant options at most, with why.`;

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  let messages;
  try {
    ({ messages } = JSON.parse(event.body));
  } catch {
    return { statusCode: 400, body: JSON.stringify({ error: "Invalid request body" }) };
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    return { statusCode: 500, body: JSON.stringify({ error: "Server is missing ANTHROPIC_API_KEY" }) };
  }

  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 500,
        system: SYSTEM_PROMPT,
        messages: messages.map((m) => ({ role: m.role, content: m.content })),
      }),
    });

    const data = await response.json();
    if (!response.ok) {
      return { statusCode: response.status, body: JSON.stringify(data) };
    }

    const reply = data?.content?.find((b) => b.type === "text")?.text ?? "";
    return { statusCode: 200, body: JSON.stringify({ reply }) };
  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
};
