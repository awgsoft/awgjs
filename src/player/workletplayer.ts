import { AwgWorkletNode } from "./workletnode";

export type WorkletPlayerOptions = {
  solo: boolean;
  soloTrackNum: number;
  muteTracks: boolean[];
  velocityOffsets: number[];
};

export class WorkletPlayer {
  private context: AudioContext;
  private options?: WorkletPlayerOptions;
  private node?: AwgWorkletNode;
  // private soundLevels: number[];

  constructor(mml: string, options?: WorkletPlayerOptions) {
    // Web Audio API
    //this.bufsize = 4096;
    //this.soundLevels = [];
    this.options = options;
    this.context = new AudioContext();
    this.context.audioWorklet.addModule("./dist/awgproc.js").then(() => {
      this.node = new AwgWorkletNode(this.context, "awg-worklet-processor");

      if (this.node) {
        this.node.setMml(mml);

        if (this.options) {
          // solo
          if (this.options.solo)
            this.node.setSolo(this.options.soloTrackNum, this.options.solo);
          // mute
          const muteTracks = this.options.muteTracks;
          if (muteTracks) {
            for (let i = 0; i < muteTracks.length; i++) {
              if (muteTracks[i]) this.node.mute(i, muteTracks[i]);
            }
          }
          // velocity offset
          const velocityOffsets = this.options.velocityOffsets;
          if (velocityOffsets) {
            for (let i = 0; i < velocityOffsets.length; i++) {
              if (velocityOffsets[i])
                this.node.setVelocityOffset(i, velocityOffsets[i]);
            }
          }
        }
        this.node.connect(this.context.destination);
      }
    });
  }

  public getSoundLevels(): number[] {
    if (this.node) return this.node.soundLevels;
    else return [];
  }

  public set onSoundLevels(func: (levels: number[]) => void) {
    if (this.node) this.node.onSoundLevels = func;
  }

  public getPosition(): { currentTick: number; totalTick: number } {
    if (this.node) {
      this.node.updatePosition();
      // return current(not updated) position
      return this.node.position;
    } else return { currentTick: 0, totalTick: 0 };
  }

  public mute(trackNum: number, muted: boolean): void {
    if (this.node) this.node.mute(trackNum, muted);
  }

  public setSolo(trackNum: number, solo: boolean): void {
    if (this.node) this.node.setSolo(trackNum, solo);
  }

  public setVelocityOffset(trackNum: number, offset: number): void {
    if (this.node) this.node.setVelocityOffset(trackNum, offset);
  }

  public seekToTop(): void {
    if (this.node) this.node.seekToTop();
  }

  public play(): void {
    if (this.node) this.node.play();
  }

  public pause(): void {
    if (this.node) this.node.pause();
  }
}
