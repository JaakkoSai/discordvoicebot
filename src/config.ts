import { AppConfig, SessionMode, SttProviderName, TtsProviderName } from "./types";

function required(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`Missing required env var: ${name}`);
  }
  return value;
}

function optional(name: string): string | undefined {
  const value = process.env[name]?.trim();
  return value ? value : undefined;
}

function toInt(name: string, fallback: number): number {
  const value = process.env[name];
  if (!value) {
    return fallback;
  }
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    throw new Error(`Env var ${name} must be a positive integer`);
  }
  return parsed;
}

function toBool(name: string, fallback: boolean): boolean {
  const value = process.env[name];
  if (value === undefined) {
    return fallback;
  }
  return value.toLowerCase() === "true";
}

function toMode(name: string, fallback: SessionMode): SessionMode {
  const value = process.env[name];
  if (!value) {
    return fallback;
  }
  if (value === "wakeword" || value === "always" || value === "off") {
    return value;
  }
  throw new Error(`Env var ${name} must be one of wakeword|always|off`);
}

function toSttProvider(name: string, fallback: SttProviderName): SttProviderName {
  const value = process.env[name];
  if (!value) {
    return fallback;
  }
  if (value === "openai" || value === "whispercpp") {
    return value;
  }
  throw new Error(`Env var ${name} must be one of openai|whispercpp`);
}

function toTtsProvider(name: string, fallback: TtsProviderName): TtsProviderName {
  const value = process.env[name];
  if (!value) {
    return fallback;
  }
  if (value === "azure" || value === "google" || value === "local") {
    return value;
  }
  throw new Error(`Env var ${name} must be one of azure|google|local`);
}

export function loadConfig(): AppConfig {
  return {
    discordToken: required("DISCORD_TOKEN"),
    discordClientId: required("DISCORD_CLIENT_ID"),
    discordGuildId: optional("DISCORD_GUILD_ID"),
    openaiApiKey: required("OPENAI_API_KEY"),
    openaiModel: process.env.OPENAI_MODEL?.trim() || "gpt-4o-mini",
    sttProvider: toSttProvider("STT_PROVIDER", "openai"),
    sttOpenAiModel: process.env.STT_OPENAI_MODEL?.trim() || "gpt-4o-mini-transcribe",
    whisperCppBin: process.env.WHISPERCPP_BIN?.trim() || "whisper-cli",
    whisperCppModel: optional("WHISPERCPP_MODEL"),
    ttsProvider: toTtsProvider("TTS_PROVIDER", "azure"),
    azureSpeechKey: optional("AZURE_SPEECH_KEY"),
    azureSpeechRegion: optional("AZURE_SPEECH_REGION"),
    ttsVoiceFiMale: process.env.TTS_VOICE_FI_MALE?.trim() || "fi-FI-HarriNeural",
    googleTtsVoiceFiMale: process.env.GOOGLE_TTS_VOICE_FI_MALE?.trim() || "fi-FI-Standard-B",
    googleProjectId: optional("GOOGLE_PROJECT_ID"),
    maxUtteranceSeconds: toInt("MAX_UTTERANCE_SECONDS", 8),
    userCooldownSeconds: toInt("USER_COOLDOWN_SECONDS", 10),
    modeDefault: toMode("MODE_DEFAULT", "wakeword"),
    postTextResponses: toBool("POST_TEXT_RESPONSES", true),
    debugRecordAudio: toBool("DEBUG_RECORD_AUDIO", false)
  };
}

export const FI_WAKEWORDS = ["hei botti", "hei bot"];
