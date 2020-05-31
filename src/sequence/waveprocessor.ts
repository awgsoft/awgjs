export class WaveProcessor {
  protected sampleFreq: number;
  protected curLevel: Array<number>;
  private _levelBuf: number[][];
  private _levelBufLength: number;

  constructor() {
    this.sampleFreq = 44100;
    this.curLevel = [0.0, 0.0];
    this._levelBuf = [[], []];
    this._levelBufLength = 200;
  }

  public getSoundLevel(): Array<number> {
    return this.curLevel;
  }

  protected calcSoundLevel(samples: Array<number>): void {
    const data = [];
    for (let i = 0; i < samples.length; i++) {
      data[i] = Math.pow(samples[i], 2);
      this._levelBuf[i].push(data[i]);
    }

    if (this._levelBuf[0].length >= this._levelBufLength) {
      // buffer is full. calc sound level
      for (let i = 0; i < this._levelBuf.length; i++) {
        const sum = this._levelBuf[i].reduce(function (
          prev: number,
          current: number
        ) {
          return prev + current;
        });
        this.curLevel[i] =
          20 * Math.log10(Math.sqrt(sum / this._levelBufLength)) + 60;
        this.curLevel[i] *= 2;
        // console.log(this.curLevel[i]);
      }
      this._levelBuf = [[], []];
    }
  }
}
