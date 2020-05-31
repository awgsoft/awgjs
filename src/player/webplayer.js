import { Sequence } from "../sequence/sequence";

export class WebPlayer {
  //    sequence;
  //    private bufsize: number;
  //    private audioctx: AudioContext;
  // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
  constructor(sequence) {
    // AWG
    this.sequence = sequence;
    this.sequence.seekToTop();

    // eslint-disable-next-line @typescript-eslint/no-this-alias
    var self = this;
    var audioProc = function onAudioProcess(ev) {
      var buf0 = ev.outputBuffer.getChannelData(0);
      var buf1 = ev.outputBuffer.getChannelData(1);
      for (var i = 0; i < self.bufsize; ++i) {
        if (self.sequence) {
          if (self.sequence.isEot()) {
            buf0[i] = 0;
            buf1[i] = 0;
          } else if (!self.sequence.isProcessing()) {
            var data = self.sequence.getWaveData();
            buf0[i] = data[0];
            buf1[i] = data[1];
          }
        }
      }
    };

    // Web Audio API
    this.bufsize = 4096;
    this.audioctx = new window.AudioContext();

    this.scrproc = this.audioctx.createScriptProcessor(this.bufsize);
    this.scrproc.onaudioprocess = audioProc;
    this.scrproc.connect(this.audioctx.destination);
  }

  // mute (trackNum, muted) {
  //     this.sequence.mute(trackNum, muted);
  // }

  // isMuted (trackNum) {
  //     return this.sequence.isMuted(trackNum);
  // }

  // onAudioProcess (ev) {
  //     var buf0 = ev.outputBuffer.getChannelData(0);
  //     var buf1 = ev.outputBuffer.getChannelData(1);
  //     for(var i = 0; i < this.bufsize; ++i) {
  //         if( this.seq ){
  //             if( this.seq.eot ) {
  //                 buf0[i] = 0;
  //                 buf1[i] = 0;
  //             } else if( !this.seq.processing ){
  //                 var data = this.seq.getWaveData();
  //                 buf0[i] = data[0];
  //                 buf1[i] = data[1];
  //             }
  //         }
  //     }
  //     // if( this.seq && this.seq.isEot() )
  //     //     this.onEndOfSequence();
  // }

  // onEndOfSequence () {
  //     //this.stop();
  //     //this.seq.seekToTop();
  // }

  // play () {
  //     this.sequence.seekToTop();
  //     //this.scrproc.connect(this.audioctx.destination);
  // }

  // stop () {
  //     //this.scrproc.disconnect();
  // }
}
