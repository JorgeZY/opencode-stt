import { existsSync } from 'node:fs';
import path from 'node:path';

export class StreamingPreview {
  constructor(sherpaOnnx, config, root) {
    const directory = path.resolve(root, config.streamingModelDirectory);
    const encoder = path.join(directory, 'encoder.int8.onnx');
    const decoder = path.join(directory, 'decoder.int8.onnx');
    const tokens = path.join(directory, 'tokens.txt');
    this.available = [encoder, decoder, tokens].every(existsSync);
    if (!this.available) return;

    this.recognizer = new sherpaOnnx.OnlineRecognizer({
      featConfig: { sampleRate: 16000, featureDim: 80 },
      modelConfig: {
        paraformer: { encoder, decoder },
        tokens,
        numThreads: config.threads,
        provider: 'cpu',
        debug: false
      },
      decodingMethod: 'greedy_search',
      enableEndpoint: false
    });
  }

  start() {
    if (this.available) this.stream = this.recognizer.createStream();
  }

  accept(samples) {
    if (!this.available || !this.stream) return '';
    this.stream.acceptWaveform({ sampleRate: 16000, samples });
    while (this.recognizer.isReady(this.stream)) this.recognizer.decode(this.stream);
    return this.recognizer.getResult(this.stream).text.trim();
  }

  finish() {
    if (!this.available || !this.stream) return '';
    this.stream.inputFinished();
    while (this.recognizer.isReady(this.stream)) this.recognizer.decode(this.stream);
    const text = this.recognizer.getResult(this.stream).text.trim();
    this.stream = undefined;
    return text;
  }
}
