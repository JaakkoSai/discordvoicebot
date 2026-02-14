import "dotenv/config";
import { createBotClient } from "./bot/client";
import { BotRuntime } from "./bot/runtime";
import { loadConfig } from "./config";
import { OpenAiChatProvider } from "./llm/openaiChat";
import { createSttProvider } from "./stt";
import { createTtsProvider } from "./tts";
import { logger } from "./utils/logger";

async function bootstrap(): Promise<void> {
  const config = loadConfig();

  const runtime: BotRuntime = {
    config,
    stt: createSttProvider(config),
    llm: new OpenAiChatProvider(config.openaiApiKey, config.openaiModel),
    tts: createTtsProvider(config)
  };

  logger.info("Starting bot", {
    stt: runtime.stt.name,
    llm: runtime.llm.name,
    tts: runtime.tts.name,
    modeDefault: config.modeDefault
  });

  const client = await createBotClient(runtime);
  await client.login(config.discordToken);
}

void bootstrap().catch((error) => {
  logger.error("Fatal startup error", { error });
  process.exit(1);
});
