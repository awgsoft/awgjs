export class Table {
  // Singleton instance
  private static _instance: Table;

  // for OSC
  public volumeMax: number;
  public phaseMax: number;
  public randomMax: number;
  public pitchTable: Array<number>;
  public pulseWaveTable: Array<number>;
  public sinWaveTable: Array<number>;
  public triWaveTable: Array<number>;
  public sawUpWaveTable: Array<number>;
  public sawDownWaveTable: Array<number>;
  public noiseWaveTable: Array<number>;
  public feedbackTable: Array<number>;
  // for EG
  public egARTable: Array<number>;
  public egDRTable: Array<number>;
  public egSRTable: Array<number>;
  public egRRTable: Array<number>;
  public egSLTable: Array<number>;
  public velocityTable: Array<number>;
  public volumeTable: Array<number>;

  public static readonly FEEDBACK_MAX = 7;
  public static readonly VELOCITY_MIN = 0;
  public static readonly VELOCITY_MAX = 15;
  public static readonly VELOCITY_LIMIT = 31;

  private constructor() {
    // for OSC
    this.volumeMax = 0.5;
    this.phaseMax = 3600;
    this.randomMax = 16000;
    this.pitchTable = new Array<number>();
    this.pulseWaveTable = new Array<number>(this.phaseMax);
    this.sinWaveTable = new Array<number>(this.phaseMax);
    this.triWaveTable = new Array<number>(this.phaseMax);
    this.sawUpWaveTable = new Array<number>(this.phaseMax);
    this.sawDownWaveTable = new Array<number>(this.phaseMax);
    this.noiseWaveTable = new Array<number>(this.randomMax);
    this.feedbackTable = new Array<number>(Table.FEEDBACK_MAX + 1);
    // for EG
    this.egARTable = new Array<number>(32);
    this.egDRTable = new Array<number>(32);
    this.egSRTable = new Array<number>(32);
    this.egRRTable = new Array<number>(16);
    this.egSLTable = new Array<number>(16);
    this.velocityTable = new Array(Table.VELOCITY_LIMIT + 1);
    this.volumeTable = new Array(128);

    this._initPitchTable();
    this._initWaveTables();
    this._initFeedbackTable();
    this._initEgTable();
    this._initVolumeTable();
  }

  public static get instance(): Table {
    if (!this._instance) {
      this._instance = new Table();
    }

    return this._instance;
  }

  /**
   * getPitch
   */
  public getPitch(note: number, detune: number): number {
    note += Math.trunc(detune / 100);
    detune %= 100;
    let freq = this.pitchTable[note];
    if (detune > 0) {
      freq = freq * Math.pow(2, detune / 1200.0);
    } else if (detune < 0) {
      freq = freq / Math.pow(2, -detune / 1200.0);
    }
    return freq;
  }

  private _initPitchTable(): void {
    // set note'A'
    this.pitchTable[9] = 55; // O1
    this.pitchTable[21] = 110; // O2
    this.pitchTable[33] = 220; // O3
    this.pitchTable[45] = 440; // O4
    this.pitchTable[57] = 880; // O5
    this.pitchTable[69] = 1760; // O6
    this.pitchTable[81] = 3520; // O7
    this.pitchTable[93] = 7040; // O8
    // set other notes
    const d9_12 = Math.pow(2, 9.0 / 12.0);
    for (let i = 0; i < 8; i++) {
      for (let j = 0; j < 12; j++) {
        if (j != 9) {
          this.pitchTable[i * 12 + j] =
            (this.pitchTable[i * 12 + 9] * Math.pow(2, j / 12.0)) / d9_12;
        }
      }
    }
  }

  private _initWaveTables(): void {
    this._initPulseWaveTable();
    this._initSinWaveTable();
    this._initTriWaveTable();
    this._initSawUpWaveTable();
    this._initSawDownWaveTable();
    this._initNoiseWaveTable();
  }

  private _initPulseWaveTable(): void {
    for (let i = 0; i < this.phaseMax; i++) {
      if (i > this.phaseMax / 2) this.pulseWaveTable[i] = this.volumeMax;
      else this.pulseWaveTable[i] = -this.volumeMax;
    }
  }

  private _initSinWaveTable(): void {
    for (let i = 0; i < this.phaseMax; i++) {
      const phase = (i * 3.1415) / (this.phaseMax / 2);
      this.sinWaveTable[i] = this.volumeMax * Math.sin(phase);
    }
  }

  private _initTriWaveTable(): void {
    for (let i = 0; i < this.phaseMax; i++) {
      if (i < this.phaseMax / 4) {
        this.triWaveTable[i] = (this.volumeMax * i) / (this.phaseMax / 4);
      } else if (i < (this.phaseMax * 3) / 4) {
        this.triWaveTable[i] =
          this.volumeMax * 2 - (this.volumeMax * i) / (this.phaseMax / 4);
      } else {
        this.triWaveTable[i] =
          -this.volumeMax * 4 + (this.volumeMax * i) / (this.phaseMax / 4);
      }
    }
  }

  private _initSawUpWaveTable(): void {
    for (let i = 0; i < this.phaseMax; i++) {
      this.sawUpWaveTable[i] =
        -this.volumeMax + (this.volumeMax * 2 * i) / this.phaseMax;
    }
  }

  private _initSawDownWaveTable(): void {
    for (let i = 0; i < this.phaseMax; i++) {
      this.sawDownWaveTable[i] =
        this.volumeMax - (this.volumeMax * 2 * i) / this.phaseMax;
    }
  }

  private _initNoiseWaveTable(): void {
    for (let i = 0; i < this.randomMax; i++) {
      const r = Math.floor(Math.random() * this.randomMax) - this.randomMax / 2;
      this.noiseWaveTable[i] = (r / this.randomMax) * (this.volumeMax / 0.5);
      //console.log("rnd i="+i+" val="+r+" table="+this.waveTableNoise[i]);
    }
  }

  private _initFeedbackTable(): void {
    for (let i = 0; i <= Table.FEEDBACK_MAX; i++) {
      this.feedbackTable[i] = Math.pow(2, -(9 - i));
    }
  }

  private _initEgTable(): void {
    // Attack Rate
    this.egARTable[0] = -1;
    this.egARTable[31] = 0;
    for (let i = 1; i <= 30; i++) this.egARTable[i] = Math.pow(1.5, 30 - i);
    // Decay Rate
    for (let i = 0; i <= 31; i++) this.egDRTable[i] = (31 - i) * 50;
    // Sustain Rate
    this.egSRTable[0] = -1;
    this.egSRTable[31] = 0;
    for (let i = 0; i <= 30; i++) this.egSRTable[i] = Math.pow(1.4, 30 - i);
    // Release Rate
    this.egRRTable[0] = -1;
    this.egRRTable[15] = 0;
    for (let i = 1; i <= 14; i++) this.egRRTable[i] = Math.pow(1.8, 18 - i);
    // Sustain Level
    this.egSLTable[0] = 0;
    for (let i = 0; i <= 14; i++) this.egSLTable[i] = (16 - i) * 500 - 1;
  }

  private _initVolumeTable(): void {
    for (let i = 0; i <= 31; i++) {
      const e = (Math.log(16.0 / (i + 1)) / Math.log(2.0)) * -0.5;
      this.velocityTable[i] = Math.pow(10, e) * this.volumeMax;
    }

    for (let i = 0; i <= 127; i++) {
      const e = i / 127.0;
      this.volumeTable[i] = Math.pow(e, 8) * this.volumeMax;
    }
  }
}
