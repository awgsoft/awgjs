import { Table } from "./table";
import * as lodash from "lodash";

export abstract class Module {
  protected moduleNum: number;
  protected modulatorNums: Array<number>;
  protected sampleFreq: number;
  protected table: Table;
  protected modulators: Array<Module>;
  constructor(moduleNum: number, modulatorNums: Array<number>) {
    this.moduleNum = moduleNum;
    this.modulatorNums = lodash.cloneDeep(modulatorNums);
    this.sampleFreq = 44100;
    this.table = Table.instance;
    this.modulators = [];
  }

  public getModulatorNums(): Array<number> {
    return this.modulatorNums;
  }

  public setModulator(module: Module, index: number): void {
    this.modulators[index] = module;
  }

  /**
   * clone
   */
  // public abstract clone(): <T extends Module>() => any

  /**
   * setPitch
   *
   */
  public setPitch(freq: number): void {
    for (const mod of this.modulators) {
      mod.setPitch(freq);
    }
  }

  /**
   * setNote
   */
  public setNote(note: number, detune: number): void {
    for (const mod of this.modulators) {
      if (mod) mod.setNote(note, detune);
    }
  }

  /**
   * getWaveData
   */
  public abstract getWaveData(curTime: number, keyOffTime: number): number;
}
