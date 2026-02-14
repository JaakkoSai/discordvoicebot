import { TtsProvider, TtsSpeakOptions } from "../types";

function escapeXml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll("\"", "&quot;")
    .replaceAll("'", "&apos;");
}

export class AzureTtsProvider implements TtsProvider {
  public readonly name = "azure-tts";
  private readonly key: string;
  private readonly region: string;
  private readonly maleVoice: string;

  public constructor(key: string, region: string, maleVoice: string) {
    this.key = key;
    this.region = region;
    this.maleVoice = maleVoice;
  }

  public async speak(text: string, options: TtsSpeakOptions): Promise<Buffer> {
    const pitch = options.voiceStyle === "deep" ? "-14%" : "-2%";
    const rate = options.voiceStyle === "deep" ? "-4%" : "0%";
    const ssml =
      `<speak version="1.0" xml:lang="${options.language}">` +
      `<voice name="${this.maleVoice}">` +
      `<prosody pitch="${pitch}" rate="${rate}">${escapeXml(text)}</prosody>` +
      `</voice></speak>`;

    const url = `https://${this.region}.tts.speech.microsoft.com/cognitiveservices/v1`;
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/ssml+xml",
        "X-Microsoft-OutputFormat": "ogg-48khz-16bit-mono-opus",
        "Ocp-Apim-Subscription-Key": this.key,
        "User-Agent": "discord-fi-voice-bot"
      },
      body: ssml
    });

    if (!response.ok) {
      const body = await response.text();
      throw new Error(`Azure TTS failed: ${response.status} ${body}`);
    }

    const bytes = await response.arrayBuffer();
    return Buffer.from(bytes);
  }
}
