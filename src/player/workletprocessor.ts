import { AwgWorkletMessage } from "./messagetypes";
import { AwgMessageCommand } from "./messagetypes";
import { Sequence } from "../sequence/sequence";
import { ParseMml } from "../parse/parsemml";

interface AudioWorkletProcessor {
  readonly port: MessagePort;
  process(
    inputs: Float32Array[][],
    outputs: Float32Array[][],
    parameters: Map<string, Float32Array>
  ): void;
}

declare let AudioWorkletProcessor: {
  prototype: AudioWorkletProcessor;
  new (options?: AudioWorkletNodeOptions): AudioWorkletProcessor;
};

export class AwgWorkletProcessor extends AudioWorkletProcessor {
  private sequence: Sequence;
  constructor() {
    super();
    this.sequence = new Sequence();

    this.port.onmessage = (event) => {
      const message: AwgWorkletMessage = event.data;
      switch (message.command) {
        case AwgMessageCommand.mml:
          this.setMml(String(message.args));
          break;
        case AwgMessageCommand.muteTrack:
          this.mute(message.args.trackNum, message.args.muted);
          break;
        case AwgMessageCommand.soloTrack:
          this.setSolo(message.args.trackNum, message.args.solo);
          break;
        case AwgMessageCommand.velocityOffset:
          this.setVelocityOffset(message.args.trackNum, message.args.offset);
          break;
        case AwgMessageCommand.seekToTop:
          this.seekToTop();
          break;
        case AwgMessageCommand.play:
          this.play();
          break;
        case AwgMessageCommand.pause:
          this.pause();
          break;
        case AwgMessageCommand.position:
          this.sendPosition();
          break;
      }
    };
    // this.port.onmessage = this.onMessage;
  }

  // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
  process(inputs: Float32Array[][], outputs: Float32Array[][]) {
    // 複数のInput、Outputがあった場合、最初のInput、Outputを取得する
    // let input = inputs[0];
    const output = outputs[0];

    // 複数のチャンネルがあった場合、最初のチャンネルを取得する.
    // let inputChannel0 = input[0];
    const outputChannel0 = output[0];

    const eot: boolean = this.sequence && this.sequence.isEot();
    for (let i = 0; i < outputChannel0.length; i++) {
      let data = [0.0, 0.0];
      if (this.sequence) {
        if (eot) {
          data = [0.0, 0.0];
        } else if (!this.sequence.isProcessing()) {
          data = this.sequence.getWaveData();
        }
        outputChannel0[i] = data[0];
      }
    }

    if (!eot) {
      this.sendSoundLevels();
    }

    // 処理を続ける
    return true;
  }

  private setMml(mml: string): void {
    const parser = new ParseMml();
    this.sequence = parser.parse(mml);
  }

  private mute(trackNum: number, muted: boolean): void {
    this.sequence.mute(trackNum, muted);
  }

  private setSolo(trackNum: number, solo: boolean): void {
    this.sequence.setSolo(trackNum, solo);
  }

  private setVelocityOffset(trackNum: number, offset: number): void {
    this.sequence.setVelocityOffset(trackNum, offset);
  }

  private seekToTop(): void {
    this.sequence.seekToTop();
  }

  private play(): void {
    this.sequence.play();
  }

  private pause(): void {
    this.sequence.pause();
  }

  private sendSoundLevels(): void {
    const levels = this.sequence.getSoundLevels();
    this.port.postMessage({
      command: AwgMessageCommand.soundLevels,
      args: levels,
    });
  }

  private sendPosition(): void {
    const current = this.sequence.getCurrentTick();
    const total = this.sequence.getTotalTick();
    this.port.postMessage({
      command: AwgMessageCommand.position,
      args: {
        currentTick: current,
        totalTick: total,
      },
    });
  }
}

declare global {
  interface AudioWorkletGlobalScope {
    // readonly attribute sampleRate;
    // readonly attribute bufferLength;
    registerProcessor(
      name: string,
      processor: new () => AudioWorkletProcessor
    ): void;
  }
  function registerProcessor(
    name: string,
    processor: new () => AudioWorkletProcessor
  ): void;
}

registerProcessor("awg-worklet-processor", AwgWorkletProcessor);
