import { Tone } from "./tone";

export class ToneBank {
  // Singleton instance
  private static _instance: ToneBank;

  private tones: Array<Tone>;

  private constructor() {
    this.tones = new Array<Tone>();

    this._createPresetTones();
  }

  public static get instance(): ToneBank {
    if (!this._instance) {
      this._instance = new ToneBank();
    }

    return this._instance;
  }

  public doesExist(toneNum: number): boolean {
    return this.tones[toneNum] !== undefined;
  }

  public getTone(toneNum: number): Tone {
    return this.tones[toneNum];
  }

  public addTone(toneNum: number): Tone {
    this.tones[toneNum] = new Tone();
    return this.tones[toneNum];
  }

  private _createPresetTones() {
    // @1(pulse) - @6(noise)
    for (let i = 1; i <= 6; i++) {
      const tone = this.addTone(i);
      tone.addOscillator({
        moduleNum: 1,
        modulatorNums: [0],
        osc: {
          waveForm: i,
          multiple: 10,
          detune: 0,
          totalLevel: 0,
          feedback: 0,
        },
      });
      tone.addEnvelope({
        moduleNum: 2,
        modulatorNums: [1],
        eg: {
          ar: 20,
          dr: 20,
          sr: 5,
          rr: 10,
          sl: 7,
        },
      });
      tone.connectModules();
    }
  }
}
