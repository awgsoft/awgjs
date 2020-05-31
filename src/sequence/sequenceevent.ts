export enum EventType {
  Empty,
  Nop,
  NoteOn,
  NoteOff,
  ToneChange,
  Tempo,
  Velocity,
  Detune,
  Duty,
  PanFine,
}

// type Event = {
//     time: number;
//     event: EventType;
//     value: number;
// }

export class SequenceEvent {
  public time: number;
  public event: EventType;
  public value: number;

  constructor(time: number, event: EventType, value: number) {
    this.time = time;
    this.event = event;
    this.value = value;
  }

  public static get emptyEvent(): SequenceEvent {
    return new SequenceEvent(0, EventType.Empty, 0);
  }
}
