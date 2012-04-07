function ModulePlayer(editor) {
  this.editor = editor;
  this.channelCount = 2;
  this.sampleRate = 44100;
}

ModulePlayer.prototype = {
  player: null,
  editor: null,
  playing: 0,
  dev: null,
  channelCount: 0,
  sampleRate: 0,
  lastRebuffer: 0,

  createDevice: function(player) {
    this.player = player;
    var self = this;

    this.refill = function(sampleBuffer) {
      console.log("delta = " + (Date.now() - self.lastRebuffer) + ", asked for " + sampleBuffer.length);
      self.lastRebuffer = Date.now();
      if (self.playing == STOPPED)
        return;

      var buffer = self.playing == PLAYING_PREVIEW ?
        self.player.getSamplesForChannel(sampleBuffer.length, self.editor.getPreviewSource()) :
        self.player.getSamples(sampleBuffer.length, self.playing != PLAYING_SAMPLE);
      for (var i = 0; i < sampleBuffer.length; i++) {
        sampleBuffer[i] = buffer[i];
      }
      editor.triggerUpdate(self.player);
    };
    
    this.reinitDevice();
  },
  
  reinitDevice: function() {
    if (this.dev)
      this.dev.kill();
    var preBufferSize = 12 * this.channelCount * 1024;
    this.dev = audioLib.AudioDevice(this.refill, this.channelCount, preBufferSize, this.sampleRate);
  }  
};