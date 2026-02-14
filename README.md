# Discord Voice Bot (Finnish STT + LLM + TTS, low-cost first)

Production-oriented Discord bot built with Node.js + TypeScript + `discord.js` v14 + `@discordjs/voice`.

Features:
- Joins voice and receives audio from multiple speakers (`selfDeaf: false`, `receiver.subscribe(...AfterSilence...)`).
- Decodes Opus -> PCM using `prism-media`.
- Converts to 16k mono WAV for STT.
- Wakeword-first low-cost behavior (`hei botti`, `hei bot`) to minimize LLM calls.
- Replies by speaking back in the same voice channel via TTS queue.
- Finnish replies, concise style, configurable deep/normal voice style.

## 1) Discord App/Bot Setup

1. Go to Discord Developer Portal: https://discord.com/developers/applications
2. Create a new application.
3. Create a bot user under **Bot**.
4. Enable intents:
   - `SERVER MEMBERS INTENT` (optional but useful for better display names)
   - `MESSAGE CONTENT INTENT` is not required here
   - Voice support requires `GuildVoiceStates` intent in code (already enabled in client setup)
5. OAuth2 URL Generator:
   - Scopes: `bot`, `applications.commands`
   - Bot permissions: `Connect`, `Speak`, `Send Messages`, `Read Message History`
6. Invite the bot with generated URL.

## 2) Install & Run

```bash
npm install
cp .env.example .env
# edit .env
npm run dev
```

Build/start production mode:

```bash
npm run build
npm start
```

## 3) Environment Variables

See `.env.example`.

Required:
- `DISCORD_TOKEN`
- `DISCORD_CLIENT_ID`
- `OPENAI_API_KEY`

Recommended:
- `DISCORD_GUILD_ID` for fast guild-local slash command registration during development
- `OPENAI_MODEL` (cheap default: `gpt-4o-mini`; switch anytime)
- `STT_PROVIDER=openai|whispercpp`
- `TTS_PROVIDER=azure|google|local`
- `ADMIN_USER_IDS=123...,456...` (comma-separated trusted users)
- `ALLOW_ONLY_ADMINS_FOR_CONTROL_COMMANDS=true`
- `ALLOWED_SPEAKER_USER_IDS=` (optional comma-separated allowlist for who can trigger replies)

Azure TTS (default):
- `AZURE_SPEECH_KEY`
- `AZURE_SPEECH_REGION`
- `TTS_VOICE_FI_MALE=fi-FI-HarriNeural` (default Finnish male neural voice used by this project)

Google fallback:
- `GOOGLE_APPLICATION_CREDENTIALS` (standard Google auth env var)
- Optional `GOOGLE_PROJECT_ID`
- `GOOGLE_TTS_VOICE_FI_MALE=fi-FI-Standard-B`

Cost control:
- `MAX_UTTERANCE_SECONDS=8`
- `USER_COOLDOWN_SECONDS=10`
- `GUILD_COOLDOWN_SECONDS=4`
- `MAX_TTS_QUEUE_ITEMS=4`
- `MAX_REPLY_CHARS=280`
- `MODE_DEFAULT=wakeword`
- `POST_TEXT_RESPONSES=true`
- `DEBUG_RECORD_AUDIO=false`
- `LOG_CONTENT=false` (do not log transcript/reply text)

## 4) Usage

1. Join a voice channel yourself.
2. Run `/join`.
3. Say: `hei botti ...` (or `hei bot ...`).
4. Bot transcribes Finnish, runs understanding, and replies with Finnish TTS in the same voice channel.

Slash commands:
- `/join`
- `/leave`
- `/settextchannel [channel]`
- `/mode [wakeword|always|off]`
- `/voice [deep|normal]`
- `/privacy`
- `/cost`

## 5) Cost Strategy (implemented)

- Default `wakeword` mode (skip LLM unless wakeword detected).
- Short max utterance capture window.
- Per-user cooldown.
- Per-guild cooldown.
- TTS queue size cap.
- 1-2 sentence constrained LLM output.
- Silence segmentation (`AfterSilence` 800ms) and no raw audio storage by default.

## 6) Abuse-Resistance Defaults

- Control commands (`/join`, `/leave`, `/mode`, `/voice`, `/settextchannel`) are admin-gated.
  - Allowed if user is in `ADMIN_USER_IDS`, or has `Manage Server` when `ALLOW_ONLY_ADMINS_FOR_CONTROL_COMMANDS=true`.
- Optional speaker allowlist (`ALLOWED_SPEAKER_USER_IDS`) blocks untrusted users from triggering STT/LLM/TTS.
- Mentions are neutralized in bot text replies to avoid `@everyone` abuse.
- Transcript/reply content is not logged unless `LOG_CONTENT=true`.

## 7) STT/TTS Provider Notes

STT:
- `openai` provider (cloud, easy to run).
- `whispercpp` provider (local, cheapest per request, more CPU). Requires `WHISPERCPP_MODEL`.

TTS:
- Default `azure` provider with Finnish male neural voice.
- Automatic fallback to `google` if Azure is not configured and Google credentials are available.
- `local` provider is placeholder (quality/availability varies by machine voices).

Voice style mapping:
- `/voice deep`: lower pitch/rate for more "manly/deep" delivery.
- `/voice normal`: milder pitch/rate.

## 8) Privacy / Consent Note

This bot listens and transcribes voice when joined to a voice channel.
- Raw audio is not stored by default (`DEBUG_RECORD_AUDIO=false`).
- Inform channel participants and obtain required consent.
- Use `/mode off` or `/leave` to stop active processing.

Check your local laws and Discord server rules before use.

## 9) DAVE / E2EE Compatibility Note

Discord voice encryption requirements are tightening (DAVE/e2ee rollout timeline includes **March 1, 2026** milestones).

What to watch:
- Keep `discord.js` and `@discordjs/voice` on current releases.
- Monitor their release notes for encryption/voice transport updates.
- Re-test join/receive/playback flows after dependency upgrades.
- Verify your runtime has supported crypto libs on your platform.

References:
- Discord blog (DAVE): https://discord.com/blog/encryption-for-voice-and-video-on-discord
- Discord support notice (DAVE timeline): https://support-dev.discord.com/hc/en-us/articles/29755948322199-DAVE-Implementation-for-Voice-Bots

## 10) Security Checklist (Before Going Public)

- [ ] Confirm `.env` is not tracked: `git ls-files | findstr /I ".env"`.
- [ ] Keep only minimal Discord bot permissions: `Connect`, `Speak`, `Send Messages`, `Read Message History`.
- [ ] Set `ALLOW_ONLY_ADMINS_FOR_CONTROL_COMMANDS=true`.
- [ ] Set `ADMIN_USER_IDS` to your Discord user ID.
- [ ] Keep `DEBUG_RECORD_AUDIO=false` in production.
- [ ] Keep `LOG_CONTENT=false` in production.
- [ ] Rotate tokens immediately if accidentally exposed.

## 11) Smoke Test Checklist

- [ ] Bot starts and logs in successfully.
- [ ] Slash commands are visible in guild.
- [ ] `/join` joins your current voice channel.
- [ ] Speaking in channel emits transcribe logs.
- [ ] Without wakeword in `wakeword` mode, bot does not call LLM.
- [ ] With `hei botti`, bot calls LLM and generates short Finnish response.
- [ ] Bot queues and plays TTS only after brief silence.
- [ ] `/voice deep` audibly changes speaking style.
- [ ] `/mode off` prevents any reply.
- [ ] `/cost` shows current cost controls and model/provider names.
- [ ] `/leave` disconnects cleanly.
