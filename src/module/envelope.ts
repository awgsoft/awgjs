import { Module } from "./module";

export type EG = {
  ar: number;
  dr: number;
  sr: number;
  rr: number;
  sl: number;
};

enum EgState {
  Off,
  AR,
  DR,
  SR,
  RR,
}

export class Envelope extends Module implements EG {
  public ar: number;
  public dr: number;
  public sr: number;
  public rr: number;
  public sl: number;

  protected state: EgState;
  protected static readonly LEVEL_MAX = 8000;

  protected arTime: number;
  protected drTime: number;
  protected srTime: number;
  protected rrTime: number;

  constructor({
    moduleNum,
    modulatorNums,
    eg,
  }: {
    moduleNum: number;
    modulatorNums: Array<number>;
    eg: EG;
  }) {
    super(moduleNum, modulatorNums);
    this.ar = eg.ar;
    this.dr = eg.dr;
    this.sr = eg.sr;
    this.rr = eg.rr;
    this.sl = eg.sl;

    this.state = EgState.Off;
    this.arTime = 0;
    this.drTime = 0;
    this.srTime = 0;
    this.rrTime = 0;

    this._calcEnvelopeTime();
  }

  /**
   * getWaveData
   */
  public getWaveData(curTime: number, keyOffTime: number): number {
    let data = 1;
    if (this.modulators.length > 0 && this.modulators[0] !== undefined)
      data = this.modulators[0].getWaveData(curTime, keyOffTime);

    const state = this._getEgState(curTime, keyOffTime);
    //if( this.state != state )
    //    console.log("EG state:"+state);
    this.state = state;
    //console.log("Envstate:"+state);
    const level = this._getLevel(curTime, keyOffTime, state);
    //console.log("EG level:"+level);
    if (level === 0) return 0;

    return (data * level) / Envelope.LEVEL_MAX;
  }

  private _calcEnvelopeTime(): void {
    this.arTime = (this.table.egARTable[this.ar] * this.sampleFreq) / 1000;
    this.drTime = (this.table.egDRTable[this.dr] * this.sampleFreq) / 1000;
    this.srTime = (this.table.egSRTable[this.sr] * this.sampleFreq) / 1000;
    this.rrTime = (this.table.egRRTable[this.rr] * this.sampleFreq) / 1000;
  }

  private _getEgState(curTime: number, keyOffTime: number): EgState {
    let state = EgState.Off;
    if (keyOffTime >= 0 && curTime > keyOffTime) {
      // in ReleaseTime (after key-off)
      if (curTime <= keyOffTime + this.rrTime) {
        state = EgState.RR; // RR
      }
    } else if (this.table.egARTable[this.ar] < 0 || curTime <= this.arTime) {
      // AttackTime
      state = EgState.AR; // AR
    } else if (curTime <= this.arTime + this.drTime) {
      // DecayTime
      state = EgState.DR; // DR
    } else if (
      this.table.egSRTable[this.sr] < 0 ||
      curTime <= this.arTime + this.drTime + this.srTime
    ) {
      // SustainTime
      state = EgState.SR; // SR
    } else if (
      this.table.egRRTable[this.rr] < 0 ||
      curTime <= this.arTime + this.drTime + this.srTime + this.rrTime
    ) {
      // ReleaseTime
      state = EgState.RR; // RR
    }

    return state;
  }

  private _getLevel(curTime: number, keyOffTime: number, state: EgState) {
    let level = 0;
    let time = 0;
    switch (state) {
      case EgState.AR: // AR
        if (this.table.egARTable[this.ar] < 0) {
          level = 0;
        } else if (this.table.egARTable[this.ar] == 0) {
          level = Envelope.LEVEL_MAX;
        } else {
          level = (curTime * Envelope.LEVEL_MAX) / this.arTime;
        }
        break;
      case EgState.DR: // DR
        time = curTime - this.arTime;
        if (this.table.egDRTable[this.dr] == 0) {
          level = Envelope.LEVEL_MAX;
        } else {
          level =
            Envelope.LEVEL_MAX -
            ((Envelope.LEVEL_MAX - this.table.egSLTable[this.sl]) * time) /
              this.drTime;
        }
        break;
      case EgState.SR: // SR
        time = curTime - (this.arTime + this.drTime);
        if (this.table.egSRTable[this.sr] < 0) {
          level = this.table.egSLTable[this.sl];
        } else if (this.table.egSRTable[this.sr] == 0) {
          level = this.table.egSLTable[this.sl];
        } else {
          level =
            this.table.egSLTable[this.sl] -
            (this.table.egSLTable[this.sl] * time) / this.srTime;
        }
        break;
      case EgState.RR: // RR
        if (keyOffTime < 0 || curTime < keyOffTime) {
          // in ReleaseTime (before KeyOff)
          // (eg. Sustain is shorter than key-off)
          level = 0;
        } else {
          // calculate level at Key-Off
          const keyOffState = this._getEgState(keyOffTime, -1);
          const keyOffLevel = this._getLevel(keyOffTime, -1, keyOffState);
          if (this.table.egRRTable[this.rr] < 0) {
            level = keyOffLevel;
          } else if (this.table.egRRTable[this.rr] == 0) {
            level = 0;
          } else {
            time = curTime - keyOffTime;
            level = keyOffLevel - (keyOffLevel * time) / this.rrTime;
          }
        }
        break;
      default:
        // OFF
        level = 0;
        break;
    }
    if (level < 0) {
      level = 0;
    }

    return level;
  }
}
