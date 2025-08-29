import ModelClient, { isUnexpected } from "@azure-rest/ai-inference";
import { AzureKeyCredential } from "@azure/core-auth";

const token = import.meta.env.VITE_GITHUB_TOKEN;
const endpoint = "https://models.github.ai/inference";

export interface GitHubAIMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

export interface GitHubAIResponse {
  content: string;
  error?: string;
}

export class GitHubAIClient {
  private client: ReturnType<typeof ModelClient>;

  constructor() {
    if (!token) {
      throw new Error("GitHub token not found. Please set VITE_GITHUB_TOKEN in your environment variables.");
    }

    this.client = ModelClient(
      endpoint,
      new AzureKeyCredential(token)
    );
  }

  async chat(
    messages: GitHubAIMessage[],
    model: string = "deepseek/DeepSeek-R1-0528",
    maxTokens: number = 2048
  ): Promise<GitHubAIResponse> {
    try {
      const response = await this.client.path("/chat/completions").post({
        body: {
          messages,
          max_tokens: maxTokens,
          model: model
        }
      });

      if (isUnexpected(response)) {
        throw new Error(response.body.error?.message || "Unknown error occurred");
      }

      const content = response.body.choices?.[0]?.message?.content;
      if (!content) {
        throw new Error("No content received from the model");
      }

      return { content };
    } catch (error) {
      console.error("GitHub AI API error:", error);
      return {
        content: "",
        error: error instanceof Error ? error.message : "Unknown error occurred"
      };
    }
  }

  async streamChat(
    messages: GitHubAIMessage[],
    model: string = "deepseek/DeepSeek-R1-0528",
    maxTokens: number = 2048,
    onChunk: (chunk: string) => void
  ): Promise<GitHubAIResponse> {
    try {
      const response = await this.client.path("/chat/completions").post({
        body: {
          messages,
          max_tokens: maxTokens,
          model: model,
          stream: true
        }
      });

      if (isUnexpected(response)) {
        throw new Error(response.body.error?.message || "Unknown error occurred");
      }

      let fullContent = "";
      
      // Handle streaming response
      if (response.body && typeof response.body === 'object') {
        // For now, we'll collect the full response and simulate streaming
        // You may need to adjust this based on the actual streaming format
        const content = response.body.choices?.[0]?.message?.content;
        if (content) {
          fullContent = content;
          // Simulate streaming by sending chunks
          const chunks = content.split(' ');
          for (const chunk of chunks) {
            onChunk(chunk + ' ');
            await new Promise(resolve => setTimeout(resolve, 50)); // Small delay for streaming effect
          }
        }
      }

      return { content: fullContent };
    } catch (error) {
      console.error("GitHub AI streaming error:", error);
      return {
        content: "",
        error: error instanceof Error ? error.message : "Unknown error occurred"
      };
    }
  }
}

// Export a singleton instance
export const githubAIClient = new GitHubAIClient(); 