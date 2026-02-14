import OpenAI, { toFile } from "openai";
import { logger } from "../utils/logger";
import { SttProvider } from "../types";

export class OpenAiWhisperProvider implements SttProvider {
  public readonly name = "openai-whisper";
  private readonly openai: OpenAI;
  private readonly model: string;

  public constructor(apiKey: string, model: string) {
    this.openai = new OpenAI({ apiKey });
    this.model = model;
  }

  private async transcribeWithModel(
    wavBuffer: Buffer,
    languageHint: string | undefined,
    model: string
  ): Promise<string> {
    const file = await toFile(wavBuffer, "utterance.wav", { type: "audio/wav" });
    const result = await this.openai.audio.transcriptions.create({
      file,
      model,
      language: languageHint || "fi",
      response_format: "text"
    });

    if (typeof result === "string") {
      return result.trim();
    }

    if (result && typeof result === "object" && "text" in result) {
      const textValue = (result as { text?: string }).text;
      return textValue?.trim() || "";
    }

    return "";
  }

  public async transcribe(wavBuffer: Buffer, languageHint?: string): Promise<string> {
    try {
      return await this.transcribeWithModel(wavBuffer, languageHint, this.model);
    } catch (error) {
      if (this.model !== "whisper-1") {
        logger.warn("Primary STT model failed, retrying with whisper-1", { error });
        return await this.transcribeWithModel(wavBuffer, languageHint, "whisper-1");
      }
      throw error;
    }
  }
}
