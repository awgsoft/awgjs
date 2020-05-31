import { Sequence } from "./sequence/sequence";
import { ParseMml } from "./parse/parsemml";
import { WebPlayer } from "./player/webplayer";
import { WorkletPlayer } from "./player/workletplayer";
import { WorkletPlayerOptions } from "./player/workletplayer";

export function readMml(mml: string): Sequence {
  const parser = new ParseMml();
  const seq = parser.parse(mml);
  return seq;
}

let player: WebPlayer;
export function playScriptProc(seq: Sequence): void {
  // (deprecated)play by script processor
  player = new WebPlayer(seq);
}

let worklet: WorkletPlayer;
export function load(mml: string, options?: WorkletPlayerOptions): void {
  if (mml) {
    worklet = new WorkletPlayer(mml, options);
  }
}

export function play(mml?: string, options?: WorkletPlayerOptions): void {
  if (mml) {
    worklet = new WorkletPlayer(mml, options);
  } else {
    worklet.play();
  }
}

export function getTracks(seq: Sequence): Array<number> {
  if (seq) return seq.getTracks();
  else return [];
}

export function getSoundLevels(seq: Sequence): Array<number> {
  if (worklet) {
    return worklet.getSoundLevels();
  } else if (player) {
    if (seq) return seq.getSoundLevels();
  }

  return [];
}

export function getPosition(): { currentTick: number; totalTick: number } {
  if (worklet) return worklet.getPosition();
  else return { currentTick: 0, totalTick: 0 };
}

export function mute(seq: Sequence, trackNum: number, muted: boolean): void {
  if (worklet) {
    worklet.mute(trackNum, muted);
  } else if (player) {
    if (seq) seq.mute(trackNum, muted);
  }
}

export function isMuted(seq: Sequence, trackNum: number): boolean {
  if (seq) return seq.isMuted(trackNum);
  else return false;
}

export function setSolo(trackNum: number, solo: boolean): void {
  if (worklet) {
    worklet.setSolo(trackNum, solo);
  }
}

export function setVelocityOffset(trackNum: number, offset: number): void {
  if (worklet) worklet.setVelocityOffset(trackNum, offset);
}

export function seekToTop(): void {
  if (worklet) worklet.seekToTop();
}

export function pause(): void {
  if (worklet) worklet.pause();
}

interface Window {
  // ReadMml(mml: string): Sequence;
  // Play(seq: Sequence): void;
  Awg: {
    // (deprecated)for Script Processor
    readMml(mml: string): Sequence;
    playScriptProc(seq: Sequence): void;
    // for audio worklet
    load(mml: string, options: WorkletPlayerOptions): void;
    play(): void;
    getTracks(seq: Sequence): Array<number>;
    getSoundLevels(seq: Sequence): Array<number>;
    getPosition(): { currentTick: number; totalTick: number };
    mute(seq: Sequence, trackNum: number, muted: boolean): void;
    isMuted(seq: Sequence, trackNum: number): boolean;
    setSolo(trackNum: number, solo: boolean): void;
    setVelocityOffset(trackNum: number, offset: number): void;
    seekToTop(): void;
    pause(): void;
  };
}

declare let AudioWorkletNode: AudioWorkletNode;
declare let window: Window;

// window.ReadMml = ReadMml;
// window.Play = Play;
window.Awg = {
  readMml: readMml,
  playScriptProc: playScriptProc,
  load: load,
  play: play,
  getTracks: getTracks,
  getSoundLevels: getSoundLevels,
  getPosition: getPosition,
  mute: mute,
  isMuted: isMuted,
  setSolo: setSolo,
  setVelocityOffset: setVelocityOffset,
  seekToTop: seekToTop,
  pause: pause,
};
