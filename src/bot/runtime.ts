import { AppConfig, LlmProvider, SttProvider, TtsProvider } from "../types";

export interface BotRuntime {
  config: AppConfig;
  stt: SttProvider;
  tts: TtsProvider;
  llm: LlmProvider;
}
