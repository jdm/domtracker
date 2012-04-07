var keyMapping;

function keyCodeToString(keyCode) {
  if (isAlphaNum(keyCode)) {
    return String.fromCharCode(keyCode).toLowerCase();
  }
  if (keyMapping)
    return keyMapping[keyCode];

  // Format: 'readable name' : (keycode | [mac keycode, windows keycode])
  var mapping = {
    ';' : 59,
    '=' : [61, 107],
    ',' : 188,
    '.' : 190,
    '/' : 191,
    '`' : 192,
    '[' : 219,
    '\\' : [220, 222],
    ']' : 221,
    '\'' : [222, 192],
    'backspace' : 8,
    'tab' : 9,
    'return' : 13,
    'enter' : 14,
    'pageup' : 33,
    'pagedown' : 34,
    'end' : 35,
    'home' : 36,
    'left' : 37,
    'right' : 39,
    'up' : 38,
    'down' : 40,
    'insert' : 45,
    'delete' : 46,
    'space' : 32,
    'escape' : 27,
    'f1' : 112,
    'f2' : 113,
    'f3' : 114,
    'f4' : 115,
    'f5' : 116,
    'f6' : 117,
    'f7' : 118,
    'f8' : 119,
    'f9' : 120,
    'f10' : 121,
    'f11' : 122,
    'f12' : 123,
    '-' : 109,
    'shift' : 16
  };
  keyMapping = {};
  for (var prop in mapping) {
    //XXX we currently default to mac keycodes when given a choice
    var val = typeof mapping[prop] == "Array" ? mapping[prop][0] : mapping[prop];
    keyMapping[val] = prop;
  }
  return keyMapping[keyCode];
}

function isNum(c) {
  return (c >= '0'.charCodeAt(0) && c <= '9'.charCodeAt(0));
}

function isAlpha(c) {
  return (c >= 'A'.charCodeAt(0) && c <= 'Z'.charCodeAt(0));
}

function isAlphaNum(c) {
  return isAlpha(c) || isNum(c);
}

function EditorInput() {
  this.numChannels = 8;
  this.numPatterns = 1;
  this.numColumns = 5;
  
  this.channel = 0;
  this.column = 0;
  this.row = 0;
  this.pattern = 0;
  this.position = 0;
  
  this.selRowStart = 0;
  this.selRowEnd = 0;
  this.selColStart = 0;
  this.selChannelStart = 0;
  this.selColEnd = 0;
  this.selChannelEnd = 0;
  this.inSelection = false;
}

EditorInput.prototype = {
  adjustColumn: function(mod) {
    this.column += mod;
    if (this.column == this.numColumns) {
      if (this.adjustChannel(1)) {
        this.column = 0;        
      } else {
        this.column--;
      }
    } else if (this.column == -1) {
      if (this.adjustChannel(-1)) {
        this.column = this.numColumns - 1;
      } else {
        this.column++;
      }
    }
    this.updateUI();
  },

  adjustRow: function(mod, stayWithinPattern) {
    this.row += mod;
    if (this.row == 64) {
      if (!stayWithinPattern && this.adjustPattern(1)) {
        this.row = 0;
      } else {
        this.row--;
      }      
    } else if (this.row == -1) {
      if (!stayWithinPattern && this.adjustPattern(-1)) {
        this.row = 63;
      } else {
        this.row++;
      }
    }
    this.updateUI();
  },
  
  adjustChannel: function(mod) {
    this.channel += mod;
    if (this.channel == -1) {
      this.channel++;
      return false;
    } else if (this.channel == this.numChannels) {
      this.channel--;
      return false;
    }
    return true;
  },
  
  adjustPattern: function(mod) {
    this.position += mod;
    if (this.position == this.mod.positionCount) {
      this.position--;
      return false;
    } else if (this.position == -1) {
      this.position++;
      return false;
    }
    this.pattern = this.mod.positions[this.position];
    if (this.position < this.positionOffset)
      this.positionOffset--;
    else if (this.position == this.positionOffset + this.displayedPositions)
      this.positionOffset++;
    this.generateStaticEditorUI();
    this.generateEditorUI();
    this.updateUI();
    return true;
  },
  
  adjustSample: function(mod) {
    var instr = document.getElementById('instrument');
    var sample = instr.selectedIndex + mod;
    if (sample == 0) {
      sample++;
    } else if (sample == instr.getElementsByTagName('option').length) {
      sample--;
    }
    instr.selectedIndex = sample;
  },
  
  overwriteValue: function(keyCode) {
    var row = this.mod.patterns[this.pattern][this.row][this.channel];
    switch (this.column) {
      case 0:
        if (isNum(keyCode))
          break;
        row.period = periodFromKey(keyCodeToString(keyCode));
        row.sample = parseInt(document.getElementById('instrument').selectedIndex + 1);
        this.adjustRow(parseInt(document.getElementById('notegap').value));
        modPlayer.prepareChannel(modPlayer.channels[this.channel],
                                 {'period': row.period, 'sample': row.sample});
        playerEngine.playing = PLAYING_SAMPLE;
        break;
      case 1:
        return;
      case 2:
        if (!isNum(keyCode))
          return;
        break;
      case 3:
        if (!isNum(keyCode) && (keyCode < 'A'.charCodeAt(0) || keyCode > 'F'.charCodeAt(0)))
          return;
        row.effect = parseInt(String.fromCharCode(keyCode), 16);
        break;
      case 4:
        if (!isNum(keyCode) && (keyCode < 'A'.charCodeAt(0) || keyCode > 'F'.charCodeAt(0)))
          return;
        row.effectParameter = parseInt(padNumber(row.effectParameter, 16).substr(1) +
                                parseInt(String.fromCharCode(keyCode), 16), 16);
        break;
    }
    this.generateEditorUI();
    this.updateUI();
  },

  handleKeypress: function(ev) {
    if (ev.altKey || ev.target != document.body)
      return;

    var keyCode = ev.keyCode || ev.which;
    var key = keyCodeToString(keyCode);
    //console.log(key);
    if (!ev.metaKey && (isAlphaNum(keyCode) ||
         ['[', ']', ';', '\'', ',', '.', '/', '\\'].indexOf(key) != -1)) {
      this.overwriteValue(keyCode);
      ev.preventDefault();
      return;
    }

    switch (key) {
      case 'left':
        if (ev.metaKey) {
          this.adjustPattern(-1);
        } else {
          this.adjustColumn(-1);          
        }
        this.updateSelection(ev);
        this.updateUI();
        break;

      case 'right':
        if (ev.metaKey) {
          this.adjustPattern(1);
        } else {
          this.adjustColumn(1);          
        }
        this.updateSelection(ev);
        this.updateUI();
        break;

      case 'up':
        if (ev.metaKey) {
          this.adjustSample(-1);
        } else {
          this.adjustRow(-1);          
        }
        this.updateSelection(ev);
        this.updateUI();
        break;

      case 'down':
        if (ev.metaKey) {
          this.adjustSample(1);
        } else {
          this.adjustRow(1);
        }
        this.updateSelection(ev);
        this.updateUI();
        break;
      
      case 'home':
        if (this.column == 0)
          this.row = 0;
        this.column = 0;
        this.channel = 0;
        this.updateSelection(ev);
        this.updateUI();
        break;

      case 'end':
        if (this.column == this.numColumns - 1 && this.channel == this.numChannels - 1)
          this.row = 63;
        this.column = this.numColumns - 1;
        this.channel = this.numChannels - 1;
        this.updateSelection(ev);
        this.updateUI();
        break;
      
      case 'shift':
        this.updateSelection(ev, true);
        break;

      case 'backspace':
        for (var i = this.row; i < 63; i++) {
          this.mod.patterns[this.pattern][i][this.channel] = this.mod.patterns[this.pattern][i + 1][this.channel];
        }
        this.mod.patterns[this.pattern][63][this.channel] =
            {'period': 0, 'sample': 0, 'effect': 0, 'effectParameter': 0};
        this.generateEditorUI();
        this.updateUI();
        break;

      case 'delete':
        var startCol, endCol, startChannel, endChannel, startRow, endRow;
        if (this.inSelection) {
          startCol = this.selColStart;
          endCol = this.selColEnd;
          startChannel = this.selChannelStart;
          endChannel = this.selChannelEnd;
          startRow = this.selRowStart;
          endRow = this.selRowEnd;
        } else {
          startCol = this.column;
          endCol = this.column;
          startChannel = this.channel;
          endChannel = this.channel;
          startRow = this.row;
          endRow = this.row;
        }

        for (var j = startRow; j <= endRow; j++) {
          for (var k = startChannel; k <= endChannel; k++) {
            var start = k == startChannel ? startCol : 0;
            var end = k == endChannel ? endCol : this.numColumns - 1;
            for (var i = start; i <= end; i++) {
              var cols = [];
              switch (i) {
                case 0: cols.push("period"); break;
                case 1: cols.push("sample"); break;
                case 2: cols.push("volume"); break;
                case 3: cols.push("effect"); /* fallthrough */
                case 4: cols.push("effectParameter"); break;
              }
              for (var l = 0; l < cols.length; l++)
              this.mod.patterns[this.pattern][j][k][cols[l]] = 0;
            }
          }
        }
        this.generateEditorUI();
        this.updateUI();
        break;
      
      case 'f5':
        stop();
        var row = this.row;
        modPlayer.loadPosition(this.position);
        modPlayer.loadRow(row);
        play();
        break;
      
      case 'f6':
        playFromStart();
        break;
      
      case 'f7':
        stop();
        modPlayer.loadPosition(this.position);
        playerEngine.playing = PLAYING_PATTERN;
        this.playingPosition = this.position;
        break;
      
      case 'f8':
        stop();
        break;
      
      case 'return':
        if (!ev.ctrlKey)
          return;
        //stop();
        var row = this.row;
        if (modPlayer.currentPosition != this.position)
          modPlayer.loadPosition(this.position);
        modPlayer.loadRow(row);
        playerEngine.playing = PLAYING_ROW;
        this.playingRow = row;
        break;
      
      case 'e':
        if (!ev.metaKey)
          return;
        openSampleEditor(document.getElementById('instrument').selectedIndex);
        break;

      default:
        return;
    }
    ev.preventDefault();
  },
  
  updateSelection: function(ev, force) {
    if (!ev.shiftKey && !force) {
      this.inSelection = false;
      return;
    }

    if (!this.inSelection) {
      this.inSelection = true;
      this.selRowStart = this.selRowEnd = this.row;
      this.selColStart = this.selColEnd = this.column;
      this.selChannelStart = this.selChannelEnd = this.channel;
    } else {
      var key = keyCodeToString(ev.which);
      var vertChange = key == 'up' ? -1 : key == 'down' ? 1 : 0;
      var horizChange = key == 'left' ? -1 : key == 'right' ? 1 : 0;

      if (horizChange == -1) {
        if (this.channel < this.selChannelStart) {
          this.selChannelStart = this.channel;
          this.selColStart = this.column;
        } else if (this.channel == this.selChannelStart) {
          if (this.column < this.selColStart) {
            this.selColStart = this.column;
          } else if (this.column >= this.selColStart) {
            this.selColEnd = this.column;
            this.selChannelEnd = this.channel;
          }
        } else {
          this.selChannelEnd = this.channel;
          this.selColEnd = this.column;
        }

      } else if (horizChange == 1) {
        if (this.channel < this.selChannelEnd) {
          this.selChannelStart = this.channel;
          this.selColStart = this.column;
        } else if (this.channel == this.selChannelStart) {
          if (this.column < this.selColEnd) {
            this.selColStart = this.column;
            this.selChannelStart = this.channel;
          } else if (this.column >= this.selColEnd) {
            this.selColEnd = this.column;
          }
        } else {
          if (this.channel == this.selChannelEnd) {
            if (this.column < this.selColEnd) {
              this.selChannelStart = this.channel;
              this.selColStart = this.column;
            }
          } 
          if (this.column >= this.selColEnd || this.channel >= this.selChannelEnd)
            this.selColEnd = this.column;
          
          this.selChannelEnd = this.channel;
        }
      }

      if (vertChange == -1) {
        if (this.row < this.selRowStart)
          this.selRowStart = this.row;
        else
          this.selRowEnd = this.row;
      } else if (vertChange == 1) {
        if (this.row < this.selRowEnd)
          this.selRowStart = this.row;
        else
          this.selRowEnd = this.row;
      }
    }
  },
  
  positionOffset: 0,
  displayedPositions: 20,
  
  generateStaticEditorUI: function() {
    var instr = document.getElementById('instrument');
    while (instr.childNodes.length > 0) {
      instr.removeChild(instr.firstChild);
    }
    for (var i = 0; i < this.mod.samples.length; i++) {
      var elem = document.createElement('option');
      elem.textContent = (i + 1) + ". " + this.mod.samples[i].name;
      instr.appendChild(elem);
    }

    var self = this;
    
    var patterns = document.getElementById('pattern-list');
    while (patterns.childNodes.length > 0) {
      patterns.removeChild(patterns.firstChild);
    }
    var elem = document.createElement('div');
    elem.textContent = "<";
    elem.setAttribute('class', 'position-button');
    $(elem).mousedown(function(ev) {
      if (self.positionOffset == 0)
        return;
      self.positionOffset--;
      self.generateStaticEditorUI();
    });
    patterns.appendChild(elem);
    for (var i = 0; i < this.displayedPositions; i++) {
      elem = document.createElement('div');
      if (this.positionOffset + i < this.mod.positionCount) {
        elem.textContent = this.mod.positions[this.positionOffset + i];
        $(elem).mousedown((function(val) {
            return function(ev) {
              self.position = self.positionOffset + val;
              self.pattern = self.mod.positions[self.position];
              self.generateStaticEditorUI();
              self.generateEditorUI();
              self.updateUI();
            };})(i));
      } else {
        elem.textContent = "-";
      }
      if (this.position == this.positionOffset + i)
        elem.setAttribute('class', 'pattern-selected');
      patterns.appendChild(elem);
    }
    elem = document.createElement('div');
    elem.textContent = ">";
    elem.setAttribute('class', 'position-button');
    $(elem).mousedown(function(ev) {
      if (self.positionOffset + self.displayedPositions == self.mod.positionCount)
        return;
      self.positionOffset++;
      self.generateStaticEditorUI();
    });
    patterns.appendChild(elem);
  },
  
  generateEditorUI: function() {
    if (!this.mod)
      return;

    var channels = $('.channel');
    channels.each(function() { this.parentNode.removeChild(this); });

    var pattern = this.mod.patterns[this.pattern];

    for (var i = 0; i < this.numChannels; i++) {
      var channel = document.createElement('span');
      $(channel).addClass('channel');
      document.getElementById('channels').appendChild(channel);

      var header = document.createElement('div');
      $(header).addClass('header');
      if (modPlayer.channels[i].muted)
        $(header).addClass('muted');
      header.textContent = "Channel " + (i + 1);
      (function(val) {$(header).mousedown(function(ev) {
        modPlayer.channels[val].muted ^= 1;
        if (modPlayer.channels[val].muted)
          $(this).addClass('muted');
        else
          $(this).removeClass('muted');
      });})(i);
      channel.appendChild(header);
      
      for (var j = 0; j < 64; j++) {
        var row = pattern[j][i];
        var rowElem = document.createElement('div');
        $(rowElem).addClass('row');

        var elem = document.createElement('span');
        var hasContent = !!row.period;
        $(elem).addClass(hasContent ? 'note' : 'blank');
        elem.textContent = hasContent ? periodToDisplay(row.period) : '...';
        rowElem.appendChild(elem);

        elem = document.createElement('span');
        hasContent = !!row.sample;
        $(elem).addClass(hasContent ? 'instrument' : 'blank');
        elem.textContent = hasContent ? padNumber(row.sample, 10) : '..';
        rowElem.appendChild(elem);

        elem = document.createElement('span');
        hasContent = false;
        $(elem).addClass(hasContent ? 'volume' : 'blank');
        elem.textContent = '..';
        rowElem.appendChild(elem);

        elem = document.createElement('span');
        $(elem).addClass(effectToClass(row.effect, row.effectParameter));
        elem.textContent = !!row.effect || !!row.effectParameter ?
                             row.effect.toString(16).toUpperCase() : '.';
        rowElem.appendChild(elem);

        elem = document.createElement('span');
        $(elem).addClass(effectToClass(row.effect, row.effectParameter));
        elem.textContent = !!row.effect || !!row.effectParameter ?
                             padNumber(row.effectParameter, 16) : '..';
        rowElem.appendChild(elem);

        channel.appendChild(rowElem);
      }
    }    
  },
  
  updateUI: function() {
    $('.row-highlight').removeClass('row-highlight');
    $('.highlight').removeClass('highlight');
    $('.selected').removeClass('selected');
    var channels = $('.channel');
    var idx = 0;
    var self = this;
    var highlightedCol;

    $(channels).each(function() {
      var row = $($(this).find('.row')[self.row]);
      row.addClass('row-highlight');
      if (idx == self.channel) {
        highlightedCol = row.find('span')[self.column];
        $(highlightedCol).addClass('highlight');
      }

      if (self.inSelection && idx >= self.selChannelStart &&
          idx <= self.selChannelEnd) {
        for (var k = self.selRowStart; k <= self.selRowEnd; k++) {
          var aRow = $($(this).find('.row')[k]);
          var start = self.selChannelStart == idx ? self.selColStart : 0;
          var end = self.selChannelEnd == idx ? self.selColEnd : self.numColumns;
          for (var j = start; j <= end; j++) {
            $(aRow.find('span')[j]).addClass('selected');
          }
        }
      }

      idx++;
    });
    
    if (highlightedCol) {
      $('html,body').animate({scrollTop: $(highlightedCol).offset().top - window.innerHeight/2}, 0);
    }
  },
  
  loadMOD: function(mod) {
    this.mod = mod;
    this.numPatterns = mod.patternCount;
    this.numChannels = mod.channelCount;
    this.position = 0;
    this.pattern = mod.positions[this.position];
    this.generateStaticEditorUI();
    this.generateEditorUI();
    this.updateUI();
  },

  // Used to disable any delayed UI updates that might occur
  // and overwrite an immediate UI update that has taken place
  inhibitFurtherUpdates: function() {
    if (this.pendingUpdates > 0)
      this.inhibitUpdates = true;
  },
  
  pendingUpdates: 0,
  inhibitUpdates: false,
  
  triggerUpdate: function(currentPlayer) {
    // We can ignore updates when we're previewing sample sounds
    if (!this.mod || playerEngine.playing == PLAYING_SAMPLE)
      return;

    // Since the actual UI updates can be delayed to sync with the sound buffer,
    // we need to perform the actual logical checks here if we plan to update
    // the player at all.

    // If we run off the end of a pattern when in single-pattern repeat mode, reset to
    // the repeating pattern.
    if (playerEngine.playing == PLAYING_PATTERN && this.playingPosition != currentPlayer.currentPosition)
      currentPlayer.loadPosition(this.playingPosition);
    this.playingPosition = currentPlayer.currentPosition;
    
    if (this.inhibitUpdates)
      return;
    
    var self = this;
    var player = {
      currentPosition: currentPlayer.currentPosition,
      currentRow: currentPlayer.currentRow
    };

    this.pendingUpdates++;
    setTimeout(function() {
      self.pendingUpdates--;
      var inhibited = self.inhibitUpdates;
      if (!self.pendingUpdates) {
        self.inhibitUpdates = false;
      }
      if (inhibited)
        return;

      var lastPosition = self.position;
      self.position = player.currentPosition;
      if (lastPosition != self.position)
        self.generateStaticEditorUI(); //XXX won't keep current scrolled in view
      var oldPattern = self.pattern;
      self.pattern = self.mod.positions[self.position];
                 
      self.row = player.currentRow;

      if (oldPattern != self.pattern)
        self.generateEditorUI();
      self.updateUI();
    }, audioSyncDelay);
  },
  
  mod: null
};

function validNote(period) {
  var noteNum = ModPeriodToNoteNumber[period];
  return noteNum >= 1 && noteNum <= 120;
}

function periodFromKey(key) {
  var baseOctave = 2;
  var idx = ["q", "w", "e", "r", "t", "y", "u", "i", "o", "p", "[", "]",
             "a", "s", "d", "f", "g", "h", "j", "k", "l", ";", "'", "\\",
             "z", "x", "c", "v", "b", "n", "m", ",", ".", "/", "", ""].indexOf(key);
  return ModPeriodTable[0][idx % 12 + (baseOctave + Math.floor(idx / 12)) * 12];
}

function periodToDisplay(period) {
  var noteNum = ModPeriodToNoteNumber[period];
  var name = ["C-", "C#", "D-", "D#", "E-", "F-", "F#", "G-", "G#", "A-", "A#", "B-"][(noteNum) % 12];
  return name + (Math.floor(noteNum / 12) + 2);
}

function effectToClass(fx, parameter) {
  switch (fx) {
  case 0x00:
    return 'blank'; //arpeggio!!!
  case 0x01:
    return 'portamentoup';
  case 0x02:
    return 'portamentodown';
  case 0x03:
    return 'portamento';
  case 0x04:
    return 'vibrato';
  case 0x05:
    return 'potamento-volslide';
  case 0x06:
    return 'vibrato-volslide';
  case 0x07:
    return 'tremolo';
  case 0x08:
    return 'panning';
  case 0x09:
    return 'offset';
  case 0x0a:
    return 'volumeslide';
  case 0x0b:
    return 'positionjump';
  case 0x0c:
    return 'setvolume';
  case 0x0d:
    return 'patternbreak';
  case 0x0e:
    switch ((parameter & 0xF0) >> 4) {
      case 0x00:
        return 'setfilter';
      case 0x01:
        return 'fineslideup';
      case 0x02:
        return 'fineslidedown';
      case 0x03:
        return 'setglissando';
      case 0x04:
        return 'setvibrato';
      case 0x05:
        return 'setfinetune';
      case 0x06:
        return 'looppattern';
      case 0x07:
        return 'settremolo';
      case 0x08:
        return 'blank';
      case 0x09:
        return 'retrigger';
      case 0x0a:
        return 'finevolumeslideup';
      case 0x0b:
        return 'finevolumeslidedown';
      case 0x0c:
        return 'cutsample';
      case 0x0d:
        return 'delaysample';
      case 0x0e:
        return 'delaypattern';
      case 0x0f:
        return 'invertloop';
    }
  case 0x0f:
    return 'setspeed';
  default:
    return 'blank';
  }
}

function padNumber(num, base) {
  return (num < base ? "0" : "") + num.toString(base).toUpperCase();
}

function SampleEditor() {
}

SampleEditor.prototype = {
  handleKeypress: function(ev) {
    if (ev.altKey || ev.ctrlKey || ev.metaKey || ev.target != document.body)
      return;

    var keyCode = ev.keyCode || ev.which;
    var key = keyCodeToString(keyCode);
    //console.log(keyCode);
    if (!ev.metaKey && (isAlphaNum(keyCode) ||
         ['[', ']', ';', '\'', ',', '.', '/', '\\'].indexOf(key) != -1)) {
      this.previewSample(keyCode);
      ev.preventDefault();
      return;
    }

    switch (key) {
      case 'escape':
        this.stopPreview();
        closeSampleEditor();
        break;
      
      case 'f8':
        this.stopPreview();
        break;
      
      case 'pagedown':
        if (this.currentInstrument == editor.mod.sampleCount - 1)
          break;
        this.currentInstrument++;
        this.drawWaveform(document.getElementById('sample-display'));
        document.getElementById('instrument').selectedIndex = this.currentInstrument;
        break;
      
      case 'pageup':
        if (this.currentInstrument == 0)
          break;
        this.currentInstrument--;
        this.drawWaveform(document.getElementById('sample-display'));
        document.getElementById('instrument').selectedIndex = this.currentInstrument;
        break;

      default:
        return;
    }
    ev.preventDefault();
  },
  
  stopPreview: function() {
    if (this.fakeChannel)
      this.fakeChannel.playing = false;
    playerEngine.playing = STOPPED;
  },
  
  previewSample: function(keyCode) {
    this.fakeChannel = modPlayer.createChannel();
    var note = {
      period: periodFromKey(keyCodeToString(keyCode)),
      sample: this.currentInstrument + 1
    };
    modPlayer.prepareChannel(this.fakeChannel, note);
    playerEngine.playing = PLAYING_PREVIEW;
    this.lastPlayPosition = 0;
    var self = this;
    var callback = function(timestamp) {
      if (self.fakeChannel.samplePosition != self.lastPlayPosition) {
        var samplePosition = self.fakeChannel.samplePosition;
        var playing = self.fakeChannel.playing;
        setTimeout(function() {
          self.drawWaveform(document.getElementById('sample-display'), playing, samplePosition);
        }, audioSyncDelay);
        this.lastPlayPosition = self.fakeChannel.samplePosition;
      }
      if (self.fakeChannel.playing)
        requestAnimationFrame(callback);
    };
    requestAnimationFrame(callback);
  },
  
  getPreviewSource: function() {
    return this.fakeChannel;
  },
  
  drawWaveform: function(canvas, playing, samplePosition) {
    var sample = editor.mod.sampleData[this.currentInstrument];
    var yOffset = Math.floor(canvas.height / 2);
    var lasty = -(sample[0] - 128);
    var length = sample.length;

    function sampleData(index) {
      return ((sample[index] + 128) & 0xFF) - 128;
    }
    
    function scaledXpos(x) {
      return x * length / canvas.width;
    }

    var context = canvas.getContext("2d");
    context.beginPath();
    context.rect(0, 0, canvas.width, canvas.height);
    context.fillStyle = "#000000";
    context.fill();

    context.beginPath();
    context.strokeStyle = "#FF0000";
    for (var x = 0; x < canvas.width; x++) {
      var findex = scaledXpos(x);
      var index = Math.floor(findex);
      var index2 = index + 1;
      if (index2 >= sample.length)
        index2 = sample.length - 1;
      var t = findex - index;
      var y1 = -sampleData(index);
      var y2 = -sampleData(index2);
      var y = Math.floor((1.0 - t) * y1 + t * y2);
      context.lineTo(x, y + yOffset);
      lasty = y;
    }
    context.stroke();
    
    var metaSample = editor.mod.samples[this.currentInstrument];
    if (metaSample.repeatLength > 2) {
      var x = Math.floor(metaSample.repeatOffset / length * canvas.width);
      context.beginPath();
      context.strokeStyle = "#888888";
      context.moveTo(x, 0);
      context.lineTo(x, canvas.height);
      x = Math.floor((metaSample.repeatOffset + metaSample.repeatLength) / length * canvas.width);
      context.moveTo(x, 0);
      context.stroke(x, canvas.height);
    }
    
    if (playing) {
      context.beginPath();
      context.strokeStyle = "#FFFFFF";
      var x = Math.floor(samplePosition / length * canvas.width);
      context.moveTo(x, 0);
      context.lineTo(x, canvas.height);
      context.stroke();
    }
  },
  
  fakeChannel: null,
  currentInstrument: 0,
  lastPlayPosition: 0
};

var requestAnimationFrame = window.requestAnimationFrame || window.mozRequestAnimationFrame ||
                            window.webkitRequestAnimationFrame || window.msRequestAnimationFrame;

function openSampleEditor(sampleIndex) {
  var sampler = document.getElementById('sample-editor');
  sampleEditor.currentInstrument = sampleIndex;
  
  focusedInputHandler.push(sampleEditor);

  var canvas = document.getElementById('sample-display');;
  canvas.width = "1500";
  canvas.height = "256";
  sampleEditor.drawWaveform(canvas);
  sampler.style.display = "block";  
}

function closeSampleEditor() {
  document.getElementById('sample-editor').style.display = "none";
  focusedInputHandler.pop();
}

var modPlayer;
var editor;
var sampleEditor;
var playerEngine;
var focusedInputHandler = [];

var STOPPED = 0;
var PLAYING = 1;
var PLAYING_SAMPLE = 2;
var PLAYING_PATTERN = 3;
var PLAYING_ROW = 4;
var PLAYING_PREVIEW = 5;

function play() {
  playerEngine.playing = PLAYING;
}

function playFromStart() {
  stop();
  modPlayer.loadPosition(0);
  play();
}

function stop() {
  playerEngine.playing = STOPPED;
  for (var i = 0; i < editor.mod.channelCount; i++) {
    modPlayer.channels[i].playing = false;
  }
  if (sampleEditor.fakeChannel)
    sampleEditor.fakeChannel.playing = false;
}

/* load from harddrive using HTML5 File API */
function loadLocal(file) {
  var reader = new FileReader();
  /* ugly-ass closure nonsense */
  reader.onload = (function(theFile) {
		     return function(e) {
		       /* actually load mod once we're passed the file data */
		       theFile = e.target.result; /* get the data string out of the blob object */
		       var modFile = new ModFile(theFile);
                       editor.loadMOD(modFile);
		       modPlayer = new ModPlayer(modFile, 44100);
                       playerEngine.createDevice(modPlayer);
		       //play();
		       //document.getElementById('status').innerText = '';
		     };
		   })(file);

  reader.readAsBinaryString(file);
  //document.getElementById('status').innerText = '';
}

function loadRemote(path) {
  var fetch = new XMLHttpRequest();
  fetch.open('GET', path);
  fetch.overrideMimeType("text/plain; charset=x-user-defined");
  fetch.onloadend = function() {
      /* munge response into a binary string */
      var t = this.responseText || "" ;
      var ff = [];
      var mx = t.length;
      var scc= String.fromCharCode;
      for (var z = 0; z < mx; z++) {
	ff[z] = scc(t.charCodeAt(z) & 255);
      }
      var binString = ff.join("");
      
      var modFile = new ModFile(binString);
      modPlayer = new ModPlayer(modFile, 44100);
      playerEngine.createDevice(modPlayer);
      editor.loadMOD(modFile);
      //play();
      //document.getElementById('status').innerText = '';
  };
  //document.getElementById('status').innerText = 'loading...';
  fetch.send();
}

var audioSyncDelay = 0;

$(document).ready(function() {
  editor = new EditorInput();
  sampleEditor = new SampleEditor();
  focusedInputHandler.push(editor);

  playerEngine = new ModulePlayer(sampleEditor);
                    
  audioSyncDelay = 'webkitAudioContext' in window ? 0 : 400;

  $(window).keydown(function(ev) {
    focusedInputHandler[focusedInputHandler.length - 1].handleKeypress(ev);
  });

  editor.generateEditorUI();
  editor.updateUI();
  loadRemote('sundance.mod');
});

