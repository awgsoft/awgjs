import "../ext/string.extenstions";
import { ToneBank } from "../module/tonebank";
import { Sequence } from "../sequence/sequence";
import { Parse } from "./parse";
import { ParseMmlTrack } from "./parsemmltrack";

export class ParseMml extends Parse {
  private sequence: Sequence;
  private parseTracks: Array<ParseMmlTrack>;
  private isInTrack: boolean;
  private isInTone: boolean;
  private curToneNum: number;
  private curModuleNum: number;
  private toneBank: ToneBank;

  constructor() {
    super();

    this.sequence = new Sequence();
    this.parseTracks = [];

    this.isInTrack = false;
    this.isInTone = false;
    this.curToneNum = 1;
    this.curModuleNum = 0;
    this.toneBank = ToneBank.instance;
  }

  /**
   * parse
   */
  public parse(mml: string): Sequence {
    // parse mml
    const mmlLines = mml.split(/\r\n|\r|\n/);
    for (let line of mmlLines) {
      line = line.ltrim();
      // TODO:comment
      const trkno = line.getNumbers();
      if (!trkno) {
        // not track data
        this.isInTrack = false;
      } else if (this.isInTone) {
        // not channel data but tone data
        this.isInTrack = false;
      } else {
        this.isInTrack = true;
      }
      if (!this.isInTrack) {
        // parse definition part
        this._parseDefinition(line);
      } else {
        // parse track data
        const trkdata = line.substr(trkno.length);
        const noArray = trkno.split(/,/);
        for (let j = 0; j < noArray.length; j++) {
          const num = parseInt(noArray[j]);
          if (!num) {
            continue;
          }
          if (this.parseTracks.length < num || !this.parseTracks[num]) {
            //this.tracks[no] = new AwgParseMmlTrack();
            this._addTrack(num);
          }
          this.parseTracks[num].parse(trkdata);
        }
      }
    }
    return this.sequence;
  }

  /**
   * getCommand
   */
  protected getCommand(mml: string): string {
    const top1 = mml.substr(0, 1);
    let command = "";

    // 1 char
    switch (top1) {
      case "@":
      case "{":
      case "}":
      case ";":
      case "'":
      case ",":
      case "+":
      case "-":
        command = top1;
        break;
    }

    return command;
  }

  private _addTrack(trackNum: number) {
    const track = this.sequence.addTrack(trackNum);
    this.parseTracks[trackNum] = new ParseMmlTrack(track);
  }
  private _parseDefinition(mml: string) {
    this.curBuf = mml;
    while (this.curBuf.length > 0) {
      const num = this.curBuf.getNumber();
      if (num) {
        if (this.isInTone) {
          //this.curModuleNum = parseInt(num);
          this._parseToneModules();
        } else {
          // error
          break;
        }
      }
      if (this.isCommand("@")) {
        // start of tone definition
        if (this.isInTone) {
          // error
          break;
        }
        this._startParseTone();
      } else if (this.isCommand("}")) {
        // end of tone definition
        if (!this.isInTone) {
          // error
          break;
        }
        this._endParseTone();
      } else if (this.isCommand(";") || this.isCommand("'")) {
        // comment
        break;
      }
      // TODO:comment
    }
  }

  private _startParseTone() {
    this.readNextCommand(true);
    // value
    const num = this.readNextNumber(true);
    if (num === "") {
      // TODO:error
      return;
    }
    this.curToneNum = parseInt(num);
    if (!this.isCommand("{")) {
      // TODO:error
      return;
    }
    this.readNextCommand(true);
    this.isInTone = true;
    this.toneBank.addTone(this.curToneNum);
  }

  private _endParseTone() {
    this.readNextCommand(true);
    this.isInTone = false;
    this.toneBank.getTone(this.curToneNum).connectModules();
  }

  private _parseToneModules() {
    // module number
    let num = this.readNextNumber(true);
    if (num === "") {
      // TODO:error
      return;
    }
    this.curModuleNum = parseInt(num);

    // module type
    num = this.readNextNumber(true);
    if (num === "") {
      // TODO:error
      return;
    }
    const type = parseInt(num);
    if (!this.isCommand(",")) {
      // TODO:error
      return;
    }
    this.readNextCommand(true);
    switch (type) {
      case 1: // OSC
        this._parseOscillator();
        break;
      case 2: // EG
        this._parseEnvelope();
        break;
      case 3: // LAYER
        this._parseLayer();
        break;
      //case 4: // MEM
      //case 5: // ADH
      //case 6: // VCF
      //case 7: // PCM
    }
  }

  private _parseOscillator() {
    const values = [];
    for (let i = 0; i < 6; i++) {
      const number = this.readNextSignedNumber(true);
      if (number === "") {
        // TODO:error
        return;
      }
      values.push(parseInt(number));
      if (this.isCommand(",")) this.readNextCommand(true);
    }
    this.toneBank.getTone(this.curToneNum).addOscillator({
      moduleNum: this.curModuleNum,
      modulatorNums: [values[5]],
      osc: {
        waveForm: values[0],
        multiple: values[1],
        detune: values[2],
        totalLevel: values[3],
        feedback: values[4],
      },
    });
  }

  private _parseEnvelope() {
    const values = [];
    for (let i = 0; i < 6; i++) {
      const num = this.readNextNumber(true);
      if (num === "") {
        // TODO:error
        return;
      }
      values.push(parseInt(num));
      if (this.isCommand(",")) this.readNextCommand(true);
    }
    this.toneBank.getTone(this.curToneNum).addEnvelope({
      moduleNum: this.curModuleNum,
      modulatorNums: [values[5]],
      eg: {
        ar: values[0],
        dr: values[1],
        sr: values[2],
        rr: values[3],
        sl: values[4],
      },
    });
  }

  private _parseLayer() {
    const values = [];
    let num = "";
    while ((num = this.readNextNumber(true)) !== "") {
      values.push(parseInt(num));
      if (this.isCommand(",")) this.readNextCommand(true);
    }
    if (values.length < 2) {
      // TODO:error
      return;
    }
    const mode = values[0];
    values.shift();
    this.toneBank.getTone(this.curToneNum).addLayer({
      moduleNum: this.curModuleNum,
      modulatorNums: values,
      layer: {
        mode: mode,
      },
    });
  }
}
