import { Table } from "../module/table";
import { Tone } from "../module/tone";
import { ToneBank } from "../module/tonebank";
import { WaveProcessor } from "./waveprocessor";
import { SequenceEvent } from "./sequenceevent";
import { EventType } from "./sequenceevent";

export class Track extends WaveProcessor {
  private curSample: number;
  private curSampleTotal: number;
  private curTick: number;
  private keyOffSample: number;
  private eot: boolean;
  private events: Array<SequenceEvent>;
  private curEvent: SequenceEvent;
  private curEventIndex: number;
  private nextEvent: SequenceEvent;
  private nextEventSample: number;
  //private sampleFreq: number;
  private tickResolution: number;
  private tempo: number;
  private noteNum: number;
  private detune: number;
  private curTone: Tone;
  private velocity: number;
  private velocityOffset: number;

  private muted: boolean;

  protected toneBank: ToneBank;
  protected table: Table;
  constructor() {
    super();
    this.curSample = 0; // current time(sample) from note on
    this.curSampleTotal = 0; // current time(sample) from top
    this.curTick = 0; // current time(tick)
    this.keyOffSample = 0; // Key-off time(sample)
    this.eot = false; // end of track
    this.events = [];
    this.curEvent = SequenceEvent.emptyEvent;
    this.curEventIndex = -1;
    this.nextEvent = SequenceEvent.emptyEvent;
    this.nextEventSample = 0;
    //
    this.sampleFreq = 44100;
    this.tickResolution = 48; // tick count per 1/4
    this.tempo = 120;
    this.noteNum = -1;
    this.detune = 0;
    this.velocity = 10;
    this.velocityOffset = 0;
    //
    this.muted = false;

    this.toneBank = ToneBank.instance;
    this.table = Table.instance;

    this.curTone = this.toneBank.getTone(1).clone();
  }

  /**
   * getWaveData
   */
  public getWaveData(): Array<number> {
    if (this.eot) {
      return [0.0, 0.0];
    }
    // Process Event
    if (!this.curEvent || this.curEvent.event === EventType.Empty) {
      // read next event
      if (this.curEventIndex + 1 < this.events.length) {
        if (this.curEventIndex < 0) {
          this.nextEvent = this.events[0];
          this.nextEventSample = this._tickToSample(this.nextEvent.time);
        } else {
          this.nextEvent = this.events[this.curEventIndex + 1];
          this.nextEventSample = this._tickToSample(this.nextEvent.time);
        }
      } else {
        this.eot = true;
      }
    }

    while (this.curSample >= this.nextEventSample) {
      if (this.curEventIndex >= this.events.length) {
        this.eot = true;
        break;
      }
      // read event
      this.curEvent = this.nextEvent;
      this.curEventIndex++;
      this._processEvent(this.curEvent);
      if (this.curEventIndex + 1 < this.events.length) {
        this.nextEvent = this.events[this.curEventIndex + 1];
        //this.processEvent(this.curEvent);
        // TODO: skip
        this.nextEventSample += this._tickToSample(this.nextEvent.time);
      } else {
        // no event
        this.eot = true;
        break;
      }
    }
    // Wave Data
    if (this.noteNum < 0 || this.muted) {
      this.curSample++;
      this.curSampleTotal++;
      const ret = [0.0, 0.0];
      this.calcSoundLevel(ret);
      return ret;
    }
    // TODO: LFO
    // TODO: Portament
    let data =
      this.curTone === undefined
        ? 0.0
        : this.curTone.getWaveData(this.curSample, this.keyOffSample);
    let velocity = this.velocity + this.velocityOffset;
    velocity = Math.min(
      Math.max(velocity, Table.VELOCITY_MIN),
      Table.VELOCITY_LIMIT
    );
    data *= this.table.velocityTable[velocity];
    this.curSample++;
    this.curSampleTotal++;
    // TODO: panpot
    //console.log("getWaveData-data:"+data);
    const ret = [data, data];
    this.calcSoundLevel(ret);
    return ret;
  }

  public addEvent(time: number, event: EventType, value: number): void {
    const ev = new SequenceEvent(time, event, value);
    this.events.push(ev);
  }

  public static getNoteNumber(octave: number, noteChar: string): number {
    let noteNumber = 0;
    switch (noteChar) {
      case "c":
        noteNumber = 0;
        break;
      case "d":
        noteNumber = 2;
        break;
      case "e":
        noteNumber = 4;
        break;
      case "f":
        noteNumber = 5;
        break;
      case "g":
        noteNumber = 7;
        break;
      case "a":
        noteNumber = 9;
        break;
      case "b":
        noteNumber = 11;
        break;
    }
    noteNumber += (octave - 1) * 12;
    return noteNumber;
  }

  public getCurrentTick(): number {
    // TODO: support multiple temo
    // this will not return correct value when there are multiple tempo commands in a tune.
    return this._sampleToTick(this.curSampleTotal);
  }

  public getTotalTick(): number {
    const e = this.events.reduce(function (
      prev: SequenceEvent,
      current: SequenceEvent
    ) {
      return new SequenceEvent(prev.time + current.time, EventType.Empty, 0);
    });
    return e.time;
  }

  public seekToTop(): void {
    this.curSample = 0; // current time(sample)
    this.curSampleTotal = 0;
    this.keyOffSample = -1; // Key-off time(sample)
    this.eot = false; // end of track
    this.curEvent = SequenceEvent.emptyEvent;
    this.curEventIndex = -1;
    this.nextEvent = SequenceEvent.emptyEvent;
    this.nextEventSample = 0;
  }

  public mute(muted: boolean): void {
    this.muted = muted;
  }

  /**
   * isMuted
   */
  public isMuted(): boolean {
    return this.muted;
  }

  public setVelocityOffset(offset: number): void {
    this.velocityOffset = offset;
  }

  /**
   * isEOT
   */
  public isEot(): boolean {
    return this.eot;
  }

  private _sampleToTick(time: number): number {
    return (time * ((this.tickResolution * this.tempo) / 60)) / this.sampleFreq;
  }

  private _tickToSample(tick: number): number {
    return (tick * this.sampleFreq) / ((this.tickResolution * this.tempo) / 60);
  }

  private _processEvent(event: SequenceEvent): void {
    switch (event.event) {
      case EventType.Nop:
        // do nothing
        break;
      case EventType.NoteOn:
        //console.log("processEvent - note on "+event.value);
        if (this.keyOffSample > -1) {
          // after note-off
          this.noteNum = event.value;
          // TODO:detune
          this.curTone.setNote(this.noteNum, this.detune);
          this.curSample = 0;
          this.keyOffSample = -1;
          this.nextEventSample = 0;
          // TODO:portament
          // TODO: tone change
          // set phase
        } else {
          // without note-off
          // change note(pitch) without note-off
          this.noteNum = event.value;
          this.keyOffSample = -1;
          this.curTone.setNote(this.noteNum, this.detune);
          // TODO: tone change
        }
        break;
      case EventType.NoteOff:
        //console.log("processEvent - note off");
        this.keyOffSample = this.curSample;
        break;
      case EventType.ToneChange:
        if (this.toneBank.doesExist(event.value)) {
          this.curTone = this.toneBank.getTone(event.value).clone();
          this.curTone.setNote(this.noteNum, this.detune);
        }
        break;
      case EventType.Tempo:
        this.tempo = event.value;
        break;
      case EventType.Velocity:
        this.velocity = event.value;
        break;
      case EventType.Detune:
        this.detune = event.value;
        break;
      case EventType.Duty:
        break;
      case EventType.PanFine:
        break;
    }
  }
}
