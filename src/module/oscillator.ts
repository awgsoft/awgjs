import { Module } from "./module";

export type Osc = {
  waveForm: number;
  multiple: number;
  detune: number;
  totalLevel: number;
  feedback: number;
};

export class Oscillator extends Module implements Osc {
  public waveForm: number;
  public multiple: number;
  public detune: number;
  public totalLevel: number;
  public feedback: number;
  protected timeReso: number;
  protected phaseMax: number;
  protected noiseFreq: number;
  protected phaseCur: number;
  protected phaseInc: number;
  protected feedbackBuf: Array<number>;

  constructor({
    moduleNum,
    modulatorNums,
    osc,
  }: {
    moduleNum: number;
    modulatorNums: Array<number>;
    osc: Osc;
  }) {
    super(moduleNum, modulatorNums);
    this.waveForm = osc.waveForm;
    this.multiple = osc.multiple;
    this.detune = osc.detune;
    this.totalLevel = osc.totalLevel;
    this.feedback = osc.feedback;

    this.timeReso = this.sampleFreq;
    this.phaseMax = 3600;
    this.noiseFreq = 1;
    this.phaseCur = 0;
    this.phaseInc = 0;
    this.feedbackBuf = [0, 0];
  }

  /**
   * clone
   */
  // public clone(): <Oscillator> {
  //     let obj = new Oscillator(
  //         { moduleNum: this.moduleNum, waveForm: this.waveForm, multiple: this.multiple, detune: this.detune, totalLevel: this.totalLevel, feedback: this.feedback, modulatorNum: this.modulatorNum }        )
  //     return obj;
  // }

  /**
   * setPitch
   *
   */
  public setPitch(freq: number): void {
    if (this.waveForm == 6) {
      this.phaseMax = this.table.randomMax;
      this.phaseInc = 1;
    } else {
      this.phaseMax = this.table.phaseMax;
      this.phaseInc =
        (((freq * this.multiple) / 10) * this.phaseMax) / this.timeReso;
    }
    super.setPitch(freq);
  }

  /**
   * setNote
   */
  public setNote(note: number, detune: number): void {
    this.noiseFreq = 1;
    if (note < 36) {
      this.noiseFreq = 37 - note;
    }
    const freq = this.table.getPitch(note, detune + this.detune);
    if (this.waveForm == 6) {
      this.phaseMax = this.table.randomMax;
      this.phaseInc = 1;
    } else {
      this.phaseMax = this.table.phaseMax;
      this.phaseInc =
        (((freq * this.multiple) / 10) * this.phaseMax) / this.timeReso;
    }
    super.setNote(note, detune);
  }

  /**
   * getWaveData
   */
  public getWaveData(curTime: number, keyOffTime: number): number {
    let mod = 0;
    if (this.modulators.length > 0 && this.modulators[0] !== undefined)
      mod = this.modulators[0].getWaveData(curTime, keyOffTime);

    // calculate current phase
    this.phaseCur += this.phaseInc;
    this.phaseCur %= this.phaseMax;

    // FM modulation
    let phase =
      this.phaseCur + (mod * this.phaseMax * 2) / this.table.volumeMax;
    // FB
    if (curTime == 0) {
      this.feedbackBuf[0] = 0;
      this.feedbackBuf[1] = 0;
    }
    let fb = (this.feedbackBuf[0] + this.feedbackBuf[1]) / 2;
    let phaseFB = 0;
    if (this.feedback > 0) {
      fb *= this.table.feedbackTable[this.feedback];
      phaseFB = (fb * this.phaseMax * 4) / this.table.volumeMax;
    } else {
      phaseFB = 0;
    }
    phase += phaseFB;
    phase %= this.phaseMax;
    if (phase < 0) phase += this.phaseMax;

    let out = this._getWave(Math.floor(phase));
    out *= this.table.volumeTable[127 - this.totalLevel] / this.table.volumeMax;

    this.feedbackBuf[1] = this.feedbackBuf[0];
    this.feedbackBuf[0] = out;

    return out;
  }

  private _getWave(phase: number): number {
    let data = 0;
    switch (this.waveForm) {
      case 1:
        data = this._getPulseWave(phase);
        break;
      case 2:
        data = this._getSinWave(phase);
        break;
      case 3:
        data = this._getTriangleWave(phase);
        break;
      case 4:
        data = this._getSawUpWave(phase);
        break;
      case 5:
        data = this._getSawDownWave(phase);
        break;
      case 6:
        data = this._getNoiseWave(phase);
        break;
    }
    return data;
  }

  private _getPulseWave(phase: number): number {
    return this.table.pulseWaveTable[phase];
  }

  private _getSinWave(phase: number): number {
    return this.table.sinWaveTable[phase];
  }

  private _getTriangleWave(phase: number): number {
    return this.table.triWaveTable[phase];
  }

  private _getSawUpWave(phase: number): number {
    return this.table.sawUpWaveTable[phase];
  }

  private _getSawDownWave(phase: number): number {
    return this.table.sawDownWaveTable[phase];
  }

  private _getNoiseWave(phase: number): number {
    return this.table.noiseWaveTable[phase];
  }
}
