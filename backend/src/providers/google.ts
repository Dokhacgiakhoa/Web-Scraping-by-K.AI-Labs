import { GoogleGenerativeAI } from "@google/generative-ai";
import { AiPlan, AiProviderClient, PageContext, SYSTEM_PROMPT, parsePlan } from "../lib/aiTypes";

export class GoogleProvider implements AiProviderClient {
  constructor(private apiKey: string) {}

  async classify(prompt: string, pageContext: PageContext): Promise<AiPlan> {
    const client = new GoogleGenerativeAI(this.apiKey);
    const model = client.getGenerativeModel({
      model: "gemini-1.5-flash",
      systemInstruction: SYSTEM_PROMPT,
    });
    const result = await model.generateContent(
      `Page context: ${JSON.stringify(pageContext)}\nUser request: ${prompt}`
    );
    const raw = result.response.text();
    return parsePlan(raw);
  }
}
