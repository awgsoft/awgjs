import { Module } from "./module";
import { Oscillator } from "./oscillator";
import { Osc } from "./oscillator";
import { Envelope } from "./envelope";
import { EG } from "./envelope";
import { Layer } from "./layer";
import { LAYER } from "./layer";
import * as lodash from "lodash";

export class Tone extends Module {
  private modules: Array<Module>;
  private carrier?: Module;
  constructor() {
    const modulatorNums = [0];
    super(0, modulatorNums);
    this.modules = new Array<Module>();
  }

  /**
   * clone
   */
  public clone(): Tone {
    return lodash.cloneDeep(this);
  }

  public getWaveData(curTime: number, keyOffTime: number): number {
    if (this.carrier === undefined) return 0;
    //return this.carrier.getWaveData(curTime, keyOffTime);
    const data = this.carrier.getWaveData(curTime, keyOffTime);
    //console.log("AwgTone.getWaveData - data:"+data);
    return data;
  }

  /**
   * connectModules
   */
  public connectModules(): void {
    for (let i = 0; i < this.modules.length; i++) {
      if (this.modules[i]) {
        // TODO: error check
        const modulatorNums = this.modules[i].getModulatorNums();
        for (let j = 0; j < modulatorNums.length; j++) {
          if (this.modules[modulatorNums[j]])
            this.modules[i].setModulator(this.modules[modulatorNums[j]], j);
        }
        this.carrier = this.modules[i]; // set last module as carrier
      }
    }
    if (this.carrier) this.modulators[0] = this.carrier;
  }

  /**
   * addOscillator()
   *   Add Oscillator to tone module
   */
  public addOscillator({
    moduleNum,
    modulatorNums,
    osc,
  }: {
    moduleNum: number;
    modulatorNums: Array<number>;
    osc: Osc;
  }): void {
    // TODO: error check
    // Create new module
    const module = new Oscillator({ moduleNum, modulatorNums, osc });
    // Add module
    this.modules[moduleNum] = module;
  }

  /**
   * addEnvelope()
   *   Add Envelope to tone module
   */
  public addEnvelope({
    moduleNum,
    modulatorNums,
    eg,
  }: {
    moduleNum: number;
    modulatorNums: Array<number>;
    eg: EG;
  }): void {
    // TODO: error check
    // Create new module
    const module = new Envelope({ moduleNum, modulatorNums, eg });
    // Add module
    this.modules[moduleNum] = module;
  }

  /**
   * addLayer()
   *   Add Layer to tone module
   */
  public addLayer({
    moduleNum,
    modulatorNums,
    layer,
  }: {
    moduleNum: number;
    modulatorNums: Array<number>;
    layer: LAYER;
  }): void {
    // TODO: error check
    // Create new module
    const module = new Layer({ moduleNum, modulatorNums, layer });
    // Add module
    this.modules[moduleNum] = module;
  }
}
