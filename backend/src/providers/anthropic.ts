import Anthropic from "@anthropic-ai/sdk";
import { AiPlan, AiProviderClient, PageContext, SYSTEM_PROMPT, parsePlan } from "../lib/aiTypes";

export class AnthropicProvider implements AiProviderClient {
  constructor(private apiKey: string) {}

  async classify(prompt: string, pageContext: PageContext): Promise<AiPlan> {
    const client = new Anthropic({ apiKey: this.apiKey });
    const message = await client.messages.create({
      model: "claude-sonnet-5",
      max_tokens: 512,
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: "user",
          content: `Page context: ${JSON.stringify(pageContext)}\nUser request: ${prompt}`,
        },
      ],
    });
    const block = message.content[0];
    const raw = block && block.type === "text" ? block.text : "";
    return parsePlan(raw);
  }
}
