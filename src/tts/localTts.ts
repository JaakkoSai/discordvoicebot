import { TtsProvider, TtsSpeakOptions } from "../types";

export class LocalTtsProvider implements TtsProvider {
  public readonly name = "local-tts";

  public async speak(_text: string, _options: TtsSpeakOptions): Promise<Buffer> {
    throw new Error(
      "Local TTS is a placeholder. Configure AZURE or GOOGLE TTS for production Finnish voice quality."
    );
  }
}
