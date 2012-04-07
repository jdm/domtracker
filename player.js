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
  
  advanceFrame: function() {
    if (this.playing == PLAYING_SAMPLE)
      return false;

    // When we should advance to the next row when previewing a row,
    // we don't do so in the playback engine but display a row advance
    // in the UI.
    if (this.playing == PLAYING_ROW) {
      this.playing = PLAYING_SAMPLE;
      editor.adjustRow(1);
      editor.inhibitFurtherUpdates();
      return false;
    }

    return true;
  },

  createDevice: function(player) {
    this.player = player;
    var self = this;

    this.refill = function(sampleBuffer) {
      //console.log("delta = " + (Date.now() - self.lastRebuffer) + ", asked for " + sampleBuffer.length);
      if (self.playing == STOPPED)
        return;

      self.lastRebuffer = Date.now();

      editor.triggerUpdate(self.player);

      var buffer = self.playing == PLAYING_PREVIEW ?
        self.player.getSamplesForChannel(sampleBuffer.length, self.editor.getPreviewSource()) :
        self.player.getSamples(sampleBuffer.length, self);
      for (var i = 0; i < sampleBuffer.length; i++) {
        sampleBuffer[i] = buffer[i];
      }
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