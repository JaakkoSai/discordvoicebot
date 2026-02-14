function clampInt16(value: number): number {
  if (value > 32767) {
    return 32767;
  }
  if (value < -32768) {
    return -32768;
  }
  return value;
}

export function downmix48kStereoTo16kMono(pcm48kStereo: Buffer): Buffer {
  const frameCount = Math.floor(pcm48kStereo.length / 4);
  const outFrames = Math.floor(frameCount / 3);
  const out = Buffer.allocUnsafe(outFrames * 2);

  let outOffset = 0;
  for (let frame = 0; frame + 2 < frameCount; frame += 3) {
    const inOffset = frame * 4;
    const left = pcm48kStereo.readInt16LE(inOffset);
    const right = pcm48kStereo.readInt16LE(inOffset + 2);
    const mono = clampInt16(Math.round((left + right) / 2));
    out.writeInt16LE(mono, outOffset);
    outOffset += 2;
  }

  return out;
}

export function pcmToWav(
  pcm: Buffer,
  sampleRate: number,
  channels: number,
  bitsPerSample: number
): Buffer {
  const blockAlign = (channels * bitsPerSample) / 8;
  const byteRate = sampleRate * blockAlign;
  const dataSize = pcm.length;
  const header = Buffer.alloc(44);

  header.write("RIFF", 0, 4, "ascii");
  header.writeUInt32LE(36 + dataSize, 4);
  header.write("WAVE", 8, 4, "ascii");
  header.write("fmt ", 12, 4, "ascii");
  header.writeUInt32LE(16, 16);
  header.writeUInt16LE(1, 20);
  header.writeUInt16LE(channels, 22);
  header.writeUInt32LE(sampleRate, 24);
  header.writeUInt32LE(byteRate, 28);
  header.writeUInt16LE(blockAlign, 32);
  header.writeUInt16LE(bitsPerSample, 34);
  header.write("data", 36, 4, "ascii");
  header.writeUInt32LE(dataSize, 40);

  return Buffer.concat([header, pcm]);
}

export function discordPcm48kStereoToWav16kMono(pcm48kStereo: Buffer): Buffer {
  const mono16k = downmix48kStereoTo16kMono(pcm48kStereo);
  return pcmToWav(mono16k, 16_000, 1, 16);
}
