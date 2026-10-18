export interface GroqChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export class GroqService {
  private static apiUrl = 'https://api.groq.com/openai/v1/chat/completions';
  private static defaultModel = 'llama-3.3-70b-versatile';

  /**
   * Check if Groq API key is configured.
   */
  public static isConfigured(): boolean {
    const apiKey = process.env.GROQ_API_KEY;
    return Boolean(apiKey && apiKey.trim() !== '' && !apiKey.includes('your_groq_api_key'));
  }

  /**
   * Send a chat completion request to Groq API with retries & rate-limit handling.
   */
  public static async generateCompletion(
    messages: GroqChatMessage[],
    options: { temperature?: number; responseFormatJson?: boolean } = {}
  ): Promise<string> {
    const apiKey = process.env.GROQ_API_KEY;
    if (!this.isConfigured()) {
      throw new Error('Groq API key is not configured in backend environment.');
    }

    const { temperature = 0.2, responseFormatJson = true } = options;

    const formattedMessages = [...messages];
    if (responseFormatJson) {
      const hasJsonKeyword = formattedMessages.some((m) => m.content.toLowerCase().includes('json'));
      if (!hasJsonKeyword && formattedMessages.length > 0) {
        formattedMessages[0] = {
          ...formattedMessages[0],
          content: `${formattedMessages[0].content}\nRespond strictly in valid JSON format.`,
        };
      }
    }

    const payload: any = {
      model: process.env.GROQ_MODEL || this.defaultModel,
      messages: formattedMessages,
      temperature,
    };

    if (responseFormatJson) {
      payload.response_format = { type: 'json_object' };
    }

    let attempts = 0;
    const maxAttempts = 3;
    let lastError: any = null;

    while (attempts < maxAttempts) {
      attempts++;
      try {
        const response = await fetch(this.apiUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${apiKey}`,
          },
          body: JSON.stringify(payload),
        });

        if (response.status === 429) {
          // Rate limited - wait before retrying
          console.warn(`⚠️ [GroqService] Rate limited (429). Attempt ${attempts}/${maxAttempts}. Waiting 2s...`);
          await new Promise((resolve) => setTimeout(resolve, 2000));
          continue;
        }

        if (!response.ok) {
          const errText = await response.text();
          throw new Error(`Groq API Error HTTP ${response.status}: ${errText}`);
        }

        const data = (await response.json()) as any;
        const content = data?.choices?.[0]?.message?.content;

        if (!content) {
          throw new Error('Groq API returned an empty response choices payload.');
        }

        return content;
      } catch (err: any) {
        lastError = err;
        console.warn(`⚠️ [GroqService] Completion attempt ${attempts} failed: ${err.message}`);
        if (attempts < maxAttempts) {
          await new Promise((resolve) => setTimeout(resolve, 1000 * attempts));
        }
      }
    }

    throw lastError || new Error('Groq API service unavailable after maximum retry attempts.');
  }
}
