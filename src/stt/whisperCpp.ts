import { execFile } from "node:child_process";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { promisify } from "node:util";
import { SttProvider } from "../types";

const execFileAsync = promisify(execFile);

export class WhisperCppProvider implements SttProvider {
  public readonly name = "whispercpp";
  private readonly binPath: string;
  private readonly modelPath: string;

  public constructor(binPath: string, modelPath: string) {
    this.binPath = binPath;
    this.modelPath = modelPath;
  }

  public async transcribe(wavBuffer: Buffer, languageHint?: string): Promise<string> {
    if (!this.modelPath) {
      throw new Error("WHISPERCPP_MODEL is required when STT_PROVIDER=whispercpp");
    }

    const tempDir = await mkdtemp(join(tmpdir(), "discord-whispercpp-"));
    const wavPath = join(tempDir, "input.wav");
    const textPath = `${wavPath}.txt`;
    const lang = languageHint || "fi";

    try {
      await writeFile(wavPath, wavBuffer);
      await execFileAsync(
        this.binPath,
        ["-m", this.modelPath, "-f", wavPath, "-l", lang, "--no-timestamps", "--output-txt"],
        { maxBuffer: 10 * 1024 * 1024, timeout: 120_000 }
      );
      const text = await readFile(textPath, "utf8");
      return text.trim();
    } finally {
      await rm(tempDir, { recursive: true, force: true });
    }
  }
}
