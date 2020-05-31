import { AwgWorkletMessage } from "./messagetypes";
import { AwgMessageCommand } from "./messagetypes";

export class AwgWorkletNode extends AudioWorkletNode {
  public soundLevels: number[];
  public position: { currentTick: number; totalTick: number };

  constructor(context: AudioContext, processor: string) {
    super(context, processor);

    this.soundLevels = [];
    this.position = { currentTick: 0, totalTick: 0 };
    // this.port.onmessage = this.onMessage;
    this.port.onmessage = (event) => {
      const message: AwgWorkletMessage = event.data;
      switch (message.command) {
        case AwgMessageCommand.soundLevels:
          this.soundLevels = message.args;
          if (this.onSoundLevels) this.onSoundLevels(event.data.soundLevels);
          break;
        case AwgMessageCommand.position:
          this.position = message.args;
          break;
      }
    };
  }

  public onSoundLevels: ((levels: number[]) => void) | undefined;

  public updatePosition(): void {
    this.port.postMessage({
      command: AwgMessageCommand.position,
      args: {},
    });
  }

  public setMml(mml: string): void {
    this.port.postMessage({
      command: AwgMessageCommand.mml,
      args: mml,
    });
  }

  public mute(trackNum: number, muted: boolean): void {
    this.port.postMessage({
      command: AwgMessageCommand.muteTrack,
      args: {
        trackNum: trackNum,
        muted: muted,
      },
    });
  }

  public setSolo(trackNum: number, solo: boolean): void {
    this.port.postMessage({
      command: AwgMessageCommand.soloTrack,
      args: {
        trackNum: trackNum,
        solo: solo,
      },
    });
  }

  public setVelocityOffset(trackNum: number, offset: number): void {
    this.port.postMessage({
      command: AwgMessageCommand.velocityOffset,
      args: {
        trackNum: trackNum,
        offset: offset,
      },
    });
  }

  public seekToTop(): void {
    this.port.postMessage({
      command: AwgMessageCommand.seekToTop,
      args: {},
    });
  }

  public play(): void {
    this.port.postMessage({
      command: AwgMessageCommand.play,
      args: {},
    });
  }
  public pause(): void {
    this.port.postMessage({
      command: AwgMessageCommand.pause,
      args: {},
    });
  }
}
