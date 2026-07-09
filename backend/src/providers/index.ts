import { AiProviderClient } from "../lib/aiTypes";
import { OpenAiProvider } from "./openai";
import { AnthropicProvider } from "./anthropic";
import { GoogleProvider } from "./google";

export function buildProvider(provider: "OPENAI" | "ANTHROPIC" | "GOOGLE", apiKey: string): AiProviderClient {
  switch (provider) {
    case "OPENAI":
      return new OpenAiProvider(apiKey);
    case "ANTHROPIC":
      return new AnthropicProvider(apiKey);
    case "GOOGLE":
      return new GoogleProvider(apiKey);
  }
}
