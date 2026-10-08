import { Transform } from 'node:stream';
import { Buffer } from 'node:buffer';

export class MediaProcessor {
  /**
   * Returns a Transform stream that simulates watermarking an image buffer.
   * Prepends a watermark string to the buffer data.
   */
  createWatermarkStream(watermarkText: string): Transform {
    let isFirstChunk = true;
    return new Transform({
      transform(chunk: Buffer, encoding, callback) {
        if (isFirstChunk) {
          const watermark = Buffer.from(`[WATERMARK:${watermarkText}]`);
          this.push(Buffer.concat([watermark, chunk]));
          isFirstChunk = false;
        } else {
          this.push(chunk);
        }
        callback();
      }
    });
  }

  /**
   * Processes a complete buffer, simulating audio normalization 
   * by amplifying bytes (up to 255).
   */
  normalizeAudioBuffer(audioData: Buffer, factor: number = 1.2): Buffer {
    const result = Buffer.alloc(audioData.length);
    for (let i = 0; i < audioData.length; i++) {
      const val = Math.floor(audioData[i] * factor);
      result[i] = val > 255 ? 255 : val;
    }
    return result;
  }
}
