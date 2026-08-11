/**
 * Server-only Lovable AI gateway helper.
 *
 * Fork's rule: the model never produces numbers. It only classifies free text
 * into one of the engine's existing scenarios, or writes prose about numbers
 * the deterministic engine already computed.
 */
const GATEWAY_URL = "https://ai.gateway.lovable.dev/v1/responses";
const MODEL = "openai/gpt-5.6-sol";

export class AiGatewayError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

export async function askGateway(instructions: string, input: string): Promise<string> {
  const key = process.env["LOVABLE_API_KEY"];
  if (!key) throw new AiGatewayError("AI is not configured", 500);

  const response = await fetch(GATEWAY_URL, {
    method: "POST",
    headers: { "content-type": "application/json", "Lovable-API-Key": key },
    body: JSON.stringify({ model: MODEL, instructions, input, stream: false }),
  });

  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    if (response.status === 429) throw new AiGatewayError("AI is busy right now — try again in a moment.", 429);
    if (response.status === 402) throw new AiGatewayError("AI credits are exhausted for this workspace.", 402);
    throw new AiGatewayError(detail.slice(0, 200) || "AI request failed", response.status);
  }

  const payload = (await response.json()) as {
    output?: { content?: { type?: string; text?: string }[] }[];
  };

  const text = (payload.output ?? [])
    .flatMap((item) => item.content ?? [])
    .filter((part) => part.type === "output_text" && typeof part.text === "string")
    .map((part) => part.text as string)
    .join("\n")
    .trim();

  if (!text) throw new AiGatewayError("AI returned an empty response", 502);
  return text;
}
