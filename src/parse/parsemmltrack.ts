import { Track } from "../sequence/track";
import { Parse } from "./parse";
import { EventType } from "../sequence/sequenceevent";

export class ParseMmlTrack extends Parse {
  private track: Track;

  private eventTime: number;
  private tempo: number;
  private tick: number;
  private octave: number;
  private velocity: number;
  private detune: number;
  private len: number;
  private q: number;
  private pan: number;
  private tie: boolean;

  constructor(track: Track) {
    super();

    this.track = track;

    this.eventTime = 0;
    this.tempo = 120; // beat per minute
    this.tick = 48; // count per 1/4 note
    this.octave = 4;
    this.velocity = 10;
    this.detune = 0;
    this.len = 48;
    this.q = 8;
    this.pan = 64;
    this.tie = false;
  }

  /**
   * parse
   */
  public parse(mml: string): void {
    this.curBuf = mml;
    while (this.curBuf.length > 0) {
      if (this.curBuf.isNote()) {
        this._onNote();
      } else if (this.isCommand("r")) {
        this._onRest();
      } else if (this.isCommand("o")) {
        this._onOctave();
      } else if (this.isCommand("<")) {
        this._onOctaveUp();
      } else if (this.isCommand(">")) {
        this._onOctaveDown();
      } else if (this.isCommand("l")) {
        this._onLength();
      } else if (this.isCommand("q")) {
        this._onQ();
      } else if (this.isCommand("v")) {
        this._onVelocity();
      } else if (this.isCommand("(")) {
        this._onVelocityUp();
      } else if (this.isCommand(")")) {
        this._onVelocityDown();
      } else if (this.isCommand("t")) {
        this._onTempo();
      } else if (this.isCommand("@")) {
        this._onToneChange();
      } else if (this.isCommand("D")) {
        this._onDetune();
      } else if (this.isCommand("[")) {
        this._onLoopStart();
      } else if (this.isCommand("]")) {
        this._onLoopEnd();
      } else if (this.isCommand("/")) {
        this._onLoopOut();
      } else {
        // unknown command
        break;
      }
      if (this.curBuf.length === 0) this._onBufTerminated();
    }
  }

  protected getCommand(mml: string): string {
    const top1 = mml.substr(0, 1);
    const top2 = mml.substr(0, 2);
    const top3 = mml.substr(0, 3);
    let command = "";

    // more than 3 char
    switch (top3) {
      case "MPF":
      case "MAF":
        command = top3;
        break;
    }
    if (command.length > 0) return command;

    // more than 2 char
    switch (top2) {
      case "MP":
      case "MA":
        command = top2;
        break;
    }
    if (command.length > 0) return command;

    // 1 char
    switch (top1) {
      case "c":
      case "d":
      case "e":
      case "f":
      case "g":
      case "a":
      case "b":
      case "r":
      case "+":
      case "-":
      case ".":
      case "o":
      case ">":
      case "<":
      case ")":
      case "(":
      case "l":
      case "q":
      case "v":
      case "D":
      case "Y":
      case "J":
      case "@":
      case "t":
      case "p":
      case "&":
      case "%":
      case "[":
      case "]":
      case "/":
      case ";":
      case "N":
      case ",":
        command = top1;
        break;
    }

    return command;
  }

  private _addEvent(time: number, event: EventType, value: number) {
    this.track.addEvent(time, event, value);
  }

  private _onBufTerminated() {
    if (this.doLoopStack > 0) {
      if (this.loopCount[this.doLoopStack] > 0) {
        // do loop
        this._doLoop();
        return;
      }
      // loop end
      // clear stack of current loop
      this.loopStack[this.loopIndex] = "";
      this.loopCurBuf[this.loopIndex] = "";
      // pop buffer from stack
      for (let i = this.loopIndex; i >= 0; i--) {
        this.doLoopStack = i;
        if (this.loopCurBuf[i] && this.loopCurBuf[i].length > 0) break;
      }
      this.curBuf = this.loopCurBuf[this.doLoopStack];
      this.loopIndex--;
    }
  }

  private _doLoop() {
    // push current MML
    if (this.doLoopStack != this.loopIndex) {
      this.loopCurBuf[this.doLoopStack] = this.curBuf;
      this.doLoopStack = this.loopIndex;
    }

    // pop loop MML from stack
    if (this.loopCount[this.doLoopStack] > 0) {
      this.curBuf = this.loopStack[this.doLoopStack];
      this.loopCount[this.doLoopStack]--;
    }
  }

  private _onNote() {
    const noteChar = this.readNextCommand(true);
    let noteNumber = Track.getNoteNumber(this.octave, noteChar);
    // sharp/flat
    if (this.isCommand("+")) {
      noteNumber++;
      this.readNextCommand(true);
    } else if (this.isCommand("-")) {
      noteNumber--;
      this.readNextCommand(true);
    }
    // length
    let len = this.len;
    const num = this.readNextNumber(true);
    if (num !== "") {
      len = (this.tick * 4) / parseInt(num);
    }
    // .
    let lenOrg = len;
    while (this.isCommand(".")) {
      lenOrg /= 2;
      len += lenOrg;
      this.readNextCommand(true);
    }
    // portament

    // note on
    this._addEvent(this.eventTime, EventType.NoteOn, noteNumber);
    // tie(&)
    if (this.isCommand("&")) {
      this.readNextCommand(true);
      this.tie = true;
    } else {
      // note off
      const offTime = (len * this.q) / 8; // calculate gate time
      this._addEvent(offTime, EventType.NoteOff, noteNumber);
      len -= offTime;
    }

    this.eventTime = len;
  }

  private _onRest() {
    this.readNextCommand(true);
    // length
    let len = this.len;
    const num = this.readNextNumber(true);
    if (num !== "") {
      len = (this.tick * 4) / parseInt(num);
    }
    // .
    let lenOrg = len;
    while (this.isCommand(".")) {
      lenOrg /= 2;
      len += lenOrg;
      this.readNextCommand(true);
    }

    // nop
    this._addEvent(this.eventTime, EventType.Nop, 0);
    // tie(&)
    if (this.isCommand("&")) {
      this.readNextCommand(true);
      this.tie = true;
    } else {
      if (this.tie) {
        // note off after rest
        const offTime = (len * this.q) / 8; // calculate gate time
        this._addEvent(offTime, EventType.NoteOff, 0);
        len -= offTime;
      }
      this.tie = false;
    }

    this.eventTime = len;
  }

  private _onOctave() {
    this.readNextCommand(true);
    // value
    const num = this.readNextNumber(true);
    if (num === "") {
      // TODO:error
      return;
    }
    this.octave = parseInt(num);
  }

  private _onOctaveUp() {
    this.readNextCommand(true);
    this.octave++;
  }

  private _onOctaveDown() {
    this.readNextCommand(true);
    this.octave--;
  }

  private _onLength() {
    this.readNextCommand(true);
    // value
    const num = this.readNextNumber(true);
    if (num === "") {
      // TODO:error
      return;
    }
    this.len = (this.tick * 4) / parseInt(num);
  }

  private _onQ() {
    this.readNextCommand(true);
    // value
    const num = this.readNextNumber(true);
    if (num === "") {
      // TODO:error
      return;
    }
    this.q = parseInt(num);
  }

  private _onVelocity() {
    this.readNextCommand(true);
    // value
    const num = this.readNextNumber(true);
    if (num === "") {
      // TODO:error
      return;
    }
    this.velocity = parseInt(num);
    this._addEvent(this.eventTime, EventType.Velocity, this.velocity);
    this.eventTime = 0;
  }

  private _onVelocityUp() {
    this.readNextCommand(true);
    // value
    let num = this.readNextNumber(true);
    if (num === "") {
      num = "1";
    }
    // TODO: error check
    this.velocity += parseInt(num);
    this._addEvent(this.eventTime, EventType.Velocity, this.velocity);
    this.eventTime = 0;
  }

  private _onVelocityDown() {
    this.readNextCommand(true);
    // value
    let num = this.readNextNumber(true);
    if (num === "") {
      num = "1";
    }
    // TODO: error check
    this.velocity -= parseInt(num);
    this._addEvent(this.eventTime, EventType.Velocity, this.velocity);
    this.eventTime = 0;
  }

  private _onTempo() {
    this.readNextCommand(true);
    // value
    const num = this.readNextNumber(true);
    if (num === "") {
      // TODO:error
      return;
    }
    this.tempo = parseInt(num);
    this._addEvent(this.eventTime, EventType.Tempo, this.tempo);
    this.eventTime = 0;
  }

  private _onToneChange() {
    this.readNextCommand(true);
    // value
    const num = this.readNextNumber(true);
    if (num === "") {
      // TODO:error
      return;
    }
    const n = parseInt(num);
    this._addEvent(this.eventTime, EventType.ToneChange, n);
    this.eventTime = 0;
  }

  private _onDetune() {
    this.readNextCommand(true);
    // value
    const number = this.readNextSignedNumber(true);
    if (!number) {
      // TODO:error
      return;
    }
    const value = parseInt(number);
    this._addEvent(this.eventTime, EventType.Detune, value);
    this.eventTime = 0;
  }

  private _onLoopStart() {
    this.readNextCommand(true);
    this.loopIndex++;
    this.loopStack[this.loopIndex] = "";
    this.loopCount[this.loopIndex] = 0;
  }

  private _onLoopEnd() {
    this.doLoopEnd = true;
    this.readNextCommand(true);
    // loop count
    const num = this.readNextNumber(true);
    let count = 2;
    if (num !== "") {
      count = parseInt(num);
    }
    this.loopCount[this.loopIndex] = count - 1;
    this.doLoopEnd = false;

    this._doLoop();
  }

  private _onLoopOut() {
    if (this.loopIndex == 0) {
      // TODO:error
      return;
    }
    this.readNextCommand(true);
    if (
      this.loopIndex == this.doLoopStack &&
      this.loopCount[this.loopIndex] == 0
    ) {
      this._onBufTerminated();
    }
  }
}
