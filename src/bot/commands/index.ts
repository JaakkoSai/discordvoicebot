import { BotCommand } from "./types";
import { costCommand } from "./cost";
import { joinCommand } from "./join";
import { leaveCommand } from "./leave";
import { modeCommand } from "./mode";
import { privacyCommand } from "./privacy";
import { setTextChannelCommand } from "./setTextChannel";
import { voiceCommand } from "./voice";

export const commands: BotCommand[] = [
  joinCommand,
  leaveCommand,
  setTextChannelCommand,
  modeCommand,
  voiceCommand,
  privacyCommand,
  costCommand
];
