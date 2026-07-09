import OpenAI from "openai";
import { AiPlan, AiProviderClient, PageContext, SYSTEM_PROMPT, parsePlan } from "../lib/aiTypes";

export class OpenAiProvider implements AiProviderClient {
  constructor(private apiKey: string) {}

  async classify(prompt: string, pageContext: PageContext): Promise<AiPlan> {
    const client = new OpenAI({ apiKey: this.apiKey });
    const completion = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        {
          role: "user",
          content: `Page context: ${JSON.stringify(pageContext)}\nUser request: ${prompt}`,
        },
      ],
      temperature: 0,
    });
    const raw = completion.choices[0]?.message?.content ?? "";
    return parsePlan(raw);
  }
}
