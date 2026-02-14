import { AppConfig, TtsProvider } from "../types";
import { logger } from "../utils/logger";
import { AzureTtsProvider } from "./azureTts";
import { GoogleTtsProvider } from "./googleTts";
import { LocalTtsProvider } from "./localTts";

function hasGoogleCredentials(): boolean {
  return Boolean(process.env.GOOGLE_APPLICATION_CREDENTIALS || process.env.GOOGLE_API_KEY);
}

export function createTtsProvider(config: AppConfig): TtsProvider {
  if (config.ttsProvider === "azure") {
    if (config.azureSpeechKey && config.azureSpeechRegion) {
      return new AzureTtsProvider(
        config.azureSpeechKey,
        config.azureSpeechRegion,
        config.ttsVoiceFiMale
      );
    }
    logger.warn("Azure TTS selected but AZURE_SPEECH_KEY/REGION missing, falling back");
  }

  if (config.ttsProvider === "google" || hasGoogleCredentials()) {
    try {
      return new GoogleTtsProvider(config.googleTtsVoiceFiMale, config.googleProjectId);
    } catch (error) {
      logger.warn("Google TTS initialization failed, falling back to local", { error });
    }
  }

  return new LocalTtsProvider();
}
