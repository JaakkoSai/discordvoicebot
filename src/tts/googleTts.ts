import { v1 as TextToSpeechV1 } from "@google-cloud/text-to-speech";
import { TtsProvider, TtsSpeakOptions } from "../types";

export class GoogleTtsProvider implements TtsProvider {
  public readonly name = "google-tts";
  private readonly client: TextToSpeechV1.TextToSpeechClient;
  private readonly maleVoice: string;

  public constructor(maleVoice: string, projectId?: string) {
    this.maleVoice = maleVoice;
    this.client = new TextToSpeechV1.TextToSpeechClient(projectId ? { projectId } : undefined);
  }

  public async speak(text: string, options: TtsSpeakOptions): Promise<Buffer> {
    const [response] = await this.client.synthesizeSpeech({
      input: { text },
      voice: {
        languageCode: options.language,
        name: this.maleVoice,
        ssmlGender: "MALE"
      },
      audioConfig: {
        audioEncoding: "OGG_OPUS",
        speakingRate: options.voiceStyle === "deep" ? 0.92 : 1.0,
        pitch: options.voiceStyle === "deep" ? -4.0 : -1.0
      }
    });

    const audio = response.audioContent;
    if (!audio) {
      throw new Error("Google TTS returned empty audioContent");
    }
    return Buffer.isBuffer(audio) ? audio : Buffer.from(audio as Uint8Array);
  }
}
