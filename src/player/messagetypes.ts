export type AwgWorkletMessage = {
  command: AwgMessageCommand;
  args: any;
};

export enum AwgMessageCommand {
  mml,
  soundLevels,
  muteTrack,
  soloTrack,
  velocityOffset,
  seekToTop,
  seek,
  position,
  play,
  pause,
  stop,
}
