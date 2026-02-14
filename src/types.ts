export type SessionMode = "wakeword" | "always" | "off";
export type VoiceStyle = "deep" | "normal";
export type SttProviderName = "openai" | "whispercpp";
export type TtsProviderName = "azure" | "google" | "local";

export interface AppConfig {
  discordToken: string;
  discordClientId: string;
  discordGuildId?: string;
  openaiApiKey: string;
  openaiModel: string;
  sttProvider: SttProviderName;
  sttOpenAiModel: string;
  whisperCppBin: string;
  whisperCppModel?: string;
  ttsProvider: TtsProviderName;
  azureSpeechKey?: string;
  azureSpeechRegion?: string;
  ttsVoiceFiMale: string;
  googleTtsVoiceFiMale: string;
  googleProjectId?: string;
  maxUtteranceSeconds: number;
  userCooldownSeconds: number;
  modeDefault: SessionMode;
  postTextResponses: boolean;
  debugRecordAudio: boolean;
}

export interface TranscriptEntry {
  userId: string;
  username: string;
  text: string;
  atMs: number;
}

export interface SttProvider {
  readonly name: string;
  transcribe(wavBuffer: Buffer, languageHint?: string): Promise<string>;
}

export interface LlmContext {
  transcript: TranscriptEntry[];
  latestSpeaker: string;
  latestUtterance: string;
}

export interface LlmProvider {
  readonly name: string;
  generateReply(context: LlmContext): Promise<string>;
}

export interface TtsSpeakOptions {
  voiceStyle: VoiceStyle;
  language: string;
}

export interface TtsProvider {
  readonly name: string;
  speak(text: string, options: TtsSpeakOptions): Promise<Buffer>;
}
