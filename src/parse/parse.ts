export abstract class Parse {
  protected curBuf: string;
  protected curLoop: string;
  protected loopStack: Array<string>;
  protected loopCount: Array<number>;
  protected loopCurBuf: Array<string>;
  protected loopIndex: number;
  protected doLoopStack: number;
  protected doLoopEnd: boolean;

  constructor() {
    this.curBuf = "";

    // loop
    this.curLoop = "";
    this.loopStack = [];
    this.loopCount = [];
    this.loopCurBuf = [];
    this.loopIndex = 0;
    this.doLoopStack = 0; // 0: not processing loop 1-: processing loop
    this.doLoopEnd = false; // processing ']n'
  }

  public abstract parse(mml: string): void;
  protected abstract getCommand(command: string): string;

  protected isCommand(command: string): boolean {
    return this.getCommand(this.curBuf) === command;
  }

  protected readNextCommand(moveCurrent: boolean): string {
    const command = this.getCommand(this.curBuf);
    if (command === "") return command;

    if (!moveCurrent) return command;

    this.curBuf = this.curBuf.substr(command.length);
    this.curBuf = this.curBuf.ltrim();

    // loop
    // save command strings to loop stack
    this._pushToLoopStack(command);

    return command;
  }

  protected readNextNumber(moveCurrent: boolean): string {
    const number = this.curBuf.getNumber();
    if (!number || number == "") return "";

    if (!moveCurrent) return number;

    this.curBuf = this.curBuf.substr(number.length);
    this.curBuf = this.curBuf.ltrim();

    // loop
    // save number strings to loop stack
    this._pushToLoopStack(number);

    return number;
  }

  protected readNextSignedNumber(moveCurrent: boolean): string {
    // sign
    let sign = "";
    if (this.isCommand("+")) {
      sign = "+";
      this.readNextCommand(true);
    }
    if (this.isCommand("-")) {
      sign = "-";
      this.readNextCommand(true);
    }
    const number = this.curBuf.getNumber();
    if (!number || number === "") return "";

    if (!moveCurrent) return sign + number;

    this.curBuf = this.curBuf.substr(number.length);
    this.curBuf = this.curBuf.ltrim();

    // loop
    // save number strings to loop stack
    this._pushToLoopStack(number);

    return sign + number;
  }

  private _pushToLoopStack(str: string): void {
    // save command strings to loop stack
    const stackBegin = this.doLoopStack + 1;
    let stackEnd = this.loopIndex;
    if (this.doLoopEnd) stackEnd--; // Don't save ']n' to current loop stack
    for (let i = stackBegin; i <= stackEnd; i++) {
      this.loopStack[i] += str;
    }
  }
}
