import { AppConfig, SttProvider } from "../types";
import { OpenAiWhisperProvider } from "./openaiWhisper";
import { WhisperCppProvider } from "./whisperCpp";

export function createSttProvider(config: AppConfig): SttProvider {
  if (config.sttProvider === "whispercpp") {
    if (!config.whisperCppModel) {
      throw new Error("WHISPERCPP_MODEL must be set when STT_PROVIDER=whispercpp");
    }
    return new WhisperCppProvider(config.whisperCppBin, config.whisperCppModel);
  }

  return new OpenAiWhisperProvider(config.openaiApiKey, config.sttOpenAiModel);
}
