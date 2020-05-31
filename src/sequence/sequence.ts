import { Track } from "./track";

export class Sequence {
  private tracks: Array<Track>;
  private eot: boolean;
  private paused: boolean;
  private processing: boolean;
  private solo: boolean;
  private soloTrackNum: number;

  constructor() {
    this.tracks = new Array<Track>();
    this.eot = false;
    this.paused = true;
    //
    this.processing = false;
    //
    this.solo = false;
    this.soloTrackNum = 0;
  }

  /**
   * getWaveData
   */
  public getWaveData(): Array<number> {
    // Add samples of all tracks
    let activeTracks = 0;
    let num = 0;
    const data = [0.0, 0.0];
    if (this.paused) {
      // return silent while pausing
      return data;
    }

    this.processing = true;
    for (let i = 0; i < this.tracks.length; i++) {
      if (this.tracks[i]) {
        const sample = this.tracks[i].getWaveData();
        if (!this.solo || i === this.soloTrackNum) {
          for (let j = 0; j < data.length; j++) data[j] += sample[j];
        }
        num++;
        if (!this.tracks[i].isEot()) activeTracks++;
      }
    }
    for (let j = 0; j < data.length; j++) data[j] /= (num + 1) / 2;

    // TODO: master volume

    if (activeTracks === 0) this.eot = true;
    this.processing = false;
    return data;
  }

  /**
   * addTrack
   */
  public addTrack(trackNum: number): Track {
    const track = new Track();

    this.tracks[trackNum] = track;
    return track;
  }

  public getTracks(): Array<number> {
    const trackNums = new Array<number>();
    for (const key in this.tracks) trackNums.push(parseInt(key));

    return trackNums;
  }

  public getSoundLevels(): Array<number> {
    const levels = new Array<number>();
    for (const track of this.tracks) {
      if (track) levels.push(track.getSoundLevel()[0]);
    }
    return levels;
  }

  public getCurrentTick(): number {
    let tick = 0;
    for (const track of this.tracks) {
      if (track) tick = Math.max(tick, track.getCurrentTick());
    }
    return tick;
  }

  public getTotalTick(): number {
    let tick = 0;
    for (const track of this.tracks) {
      if (track) tick = Math.max(tick, track.getTotalTick());
    }
    return tick;
  }

  /**
   * seekToTop
   */
  public seekToTop(): void {
    for (let i = 0; i < this.tracks.length; i++) {
      if (this.tracks[i]) {
        this.tracks[i].seekToTop();
      }
    }
    this.eot = false;
  }

  public play(): void {
    if (this.isEot()) this.seekToTop();
    this.paused = false;
  }

  public pause(): void {
    this.paused = true;
  }

  /**
   * mute
   */
  public mute(trackNum: number, muted: boolean): void {
    if (this.tracks[trackNum]) {
      this.tracks[trackNum].mute(muted);
    }
  }

  /**
   * isMuted
   */
  public isMuted(trackNum: number): boolean {
    if (this.tracks[trackNum]) {
      return this.tracks[trackNum].isMuted();
    } else {
      return false;
    }
  }

  public setSolo(trackNum: number, solo: boolean): void {
    this.solo = solo;
    this.soloTrackNum = trackNum;
  }

  public setVelocityOffset(trackNum: number, offset: number): void {
    if (this.tracks[trackNum]) {
      this.tracks[trackNum].setVelocityOffset(offset);
    }
  }

  public isEot(): boolean {
    return this.eot;
  }

  public isProcessing(): boolean {
    return this.processing;
  }
}
