import { createServerFn } from "@tanstack/react-start";

import { SCENARIOS, matchScenario, validateAiScenarioSelection } from "@/lib/fork/engine";
import { askGateway } from "@/lib/fork/ai.server";

/**
 * Turns free-text "what if" input into one of the engine's existing scenarios.
 * The model only picks an id; it never invents a scenario or a number. When
 * neither the model nor the keyword parser recognizes the question, Fork
 * reports it as unresolved so the UI can ask for clarification (no guessing).
 */
export const classifyScenario = createServerFn({ method: "POST" })
  .inputValidator((input: { text: string }) => ({ text: String(input?.text ?? "").slice(0, 400) }))
  .handler(async ({ data }) => {
    const fallback = matchScenario(data.text);
    const menu = SCENARIOS.map((s) => `${s.id}: ${s.question}`).join("\n");

    try {
      const raw = await askGateway(
        [
          "You route a college student's free-text question to one simulation scenario.",
          "Reply with exactly one id from the list, or the single word none if the question",
          "does not clearly fit any of them. Reply with nothing else.",
          "Options:",
          menu,
        ].join("\n"),
        data.text,
      );
      const id = raw.trim().toLowerCase().replace(/[^a-z_]/g, "");
      const matched = SCENARIOS.find((s) => s.id === id);
      const resolved = matched ?? fallback;
      // Everything the model returned is stripped down to { scenarioId, target }.
      const selection = validateAiScenarioSelection({ scenarioId: resolved?.id ?? null });
      return {
        scenarioId: selection.scenarioId,
        resolved: Boolean(selection.scenarioId),
        source: matched ? "ai" : "keywords",
      };
    } catch {
      const selection = validateAiScenarioSelection({ scenarioId: fallback?.id ?? null });
      return { scenarioId: selection.scenarioId, resolved: Boolean(selection.scenarioId), source: "keywords" };
    }
  });

/**
 * Interprets engine output. All figures arrive pre-computed as strings; the
 * model is told not to introduce any others.
 */
export const interpretPath = createServerFn({ method: "POST" })
  .inputValidator((input: { facts: string; question: string }) => ({
    facts: String(input?.facts ?? "").slice(0, 4000),
    question: String(input?.question ?? "").slice(0, 300),
  }))
  .handler(async ({ data }) => {
    try {
      const text = await askGateway(
        [
          "You are Fork, an academic decision tool for college students.",
          "You are given numbers already computed by a deterministic simulation engine.",
          "Write 3 short paragraphs (max 40 words each) interpreting the tradeoffs for this student.",
          "Rules: use only the figures given, never invent or recompute numbers, never guarantee graduation,",
          "employment, salary or admission, never say the student should become anything, and never mention",
          "personal characteristics. Plain language, calm and specific. No markdown, no headings, no bullets.",
          "Separate paragraphs with a blank line.",
        ].join(" "),
        `Student question: ${data.question}\n\nEngine output:\n${data.facts}`,
      );

      return {
        paragraphs: text
          .split(/\n{2,}/)
          .map((p) => p.replace(/\s+/g, " ").trim())
          .filter(Boolean)
          .slice(0, 3),
        error: null as string | null,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : "AI interpretation unavailable";
      return { paragraphs: [] as string[], error: message };
    }
  });
