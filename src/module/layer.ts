import { Module } from "./module";

export enum MixMode {
  Add,
  Ring,
  Sync,
  Unknown,
}

export type LAYER = {
  mode: MixMode;
};

export class Layer extends Module implements LAYER {
  public mode: MixMode;

  constructor({
    moduleNum,
    modulatorNums,
    layer,
  }: {
    moduleNum: number;
    modulatorNums: Array<number>;
    layer: LAYER;
  }) {
    super(moduleNum, modulatorNums);
    this.mode = layer.mode;
  }

  /**
   * getWaveData
   */
  public getWaveData(curTime: number, keyOffTime: number): number {
    // if( m_bMute ){
    //     return 0;
    // }
    let data = 0.0;
    if (this.modulators.length === 0) {
      return data;
    }
    if (this.mode === MixMode.Add) {
      for (let i = 0; i < this.modulators.length; i++) {
        if (this.modulators[i])
          data += this.modulators[i].getWaveData(curTime, keyOffTime);
      }
    } else if (this.mode === MixMode.Ring) {
      if (this.modulators[0])
        data = this.modulators[0].getWaveData(curTime, keyOffTime);
      for (let i = 1; i < this.modulators.length; i++) {
        if (this.modulators[i]) {
          data *= this.modulators[i].getWaveData(curTime, keyOffTime);
          data /= 0.5 / 4;
        }
      }
    }

    return data;
  }
}
