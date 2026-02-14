import OpenAI from "openai";
import { LlmContext, LlmProvider } from "../types";

export class OpenAiChatProvider implements LlmProvider {
  public readonly name: string;
  private readonly openai: OpenAI;
  private readonly model: string;

  public constructor(apiKey: string, model: string) {
    this.openai = new OpenAI({ apiKey });
    this.model = model;
    this.name = `openai:${model}`;
  }

  public async generateReply(context: LlmContext): Promise<string> {
    const transcriptLines = context.transcript
      .map((item) => `${item.username}: ${item.text}`)
      .join("\n");

    const completion = await this.openai.chat.completions.create({
      model: this.model,
      temperature: 0.3,
      max_tokens: 120,
      messages: [
        {
          role: "system",
          content:
            "Olet suomalainen puheavustaja Discordissa. Vastaa aina suomeksi. " +
            "Pidä vastaus lyhyenä (1-2 virkettä), itsevarmana ja rauhallisen miehekkäänä, mutta kohteliaana. " +
            "Jos pyyntö on epäselvä, kysy täsmälleen yksi lyhyt tarkentava kysymys."
        },
        {
          role: "user",
          content:
            `Konteksti (viimeisimmät puheenvuorot):\n${transcriptLines || "(ei kontekstia)"}` +
            `\n\nViimeisin puhuja: ${context.latestSpeaker}` +
            `\nViimeisin pyyntö: ${context.latestUtterance}`
        }
      ]
    });

    return completion.choices[0]?.message?.content?.trim() || "Voitko toistaa lyhyesti?";
  }
}
