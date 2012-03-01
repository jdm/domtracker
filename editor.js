var keyMapping;

function keyCodeToString(keyCode) {
  if (isAlphaNum(keyCode)) {
    return String.fromCharCode(keyCode).toLowerCase();
  }
  if (keyMapping)
    return keyMapping[keyCode];

  var mapping = {
    DOM_VK_SEMICOLON: ';',
    DOM_VK_EQUALS: '=',
    DOM_VK_COMMA: ',',
    DOM_VK_PERIOD: '.',
    DOM_VK_SLASH: '/',
    DOM_VK_BACK_QUOTE: '`',
    DOM_VK_OPEN_BRACKET: '[',
    DOM_VK_BACK_SLASH: '\\',
    DOM_VK_CLOSE_BRACKEY: ']',
    DOM_VK_QUOTE: '\'',
    DOM_VK_BACK_SPACE: 'backspace',
    DOM_VK_TAB: 'tab',
    DOM_VK_RETURN: 'return',
    DOM_VK_ENTER: 'enter',
    DOM_VK_PAGE_UP: 'pageup',
    DOM_VK_PAGE_DOWN: 'pagedown',
    DOM_VK_END: 'end',
    DOM_VK_HOME: 'home',
    DOM_VK_LEFT: 'left',
    DOM_VK_RIGHT: 'right',
    DOM_VK_UP: 'up',
    DOM_VK_DOWN: 'down',
    DOM_VK_INSERT: 'insert',
    DOM_VK_DELETE: 'delete',
    DOM_VK_SPACE: 'space',
    DOM_VK_F1: 'f1',
    DOM_VK_F2: 'f2',
    DOM_VK_F3: 'f3',
    DOM_VK_F4: 'f4',
    DOM_VK_F5: 'f5',
    DOM_VK_F6: 'f6',
    DOM_VK_F7: 'f7',
    DOM_VK_F8: 'f8',
    DOM_VK_F9: 'f9',
    DOM_VK_F10: 'f10',
    DOM_VK_F11: 'f11',
    DOM_VK_F12: 'f12',
    DOM_VK_SUBTRACT: '-'
  };
  var keyMapping = {};
  for (var prop in mapping) {
    keyMapping[KeyEvent[prop]] = mapping[prop];
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
        playing = PLAYING_SAMPLE;
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
    //console.log(keyCode);
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
        break;

      case 'right':
        if (ev.metaKey) {
          this.adjustPattern(1);
        } else {
          this.adjustColumn(1);          
        }
        break;

      case 'up':
        if (ev.metaKey) {
          this.adjustSample(-1);
        } else {
          this.adjustRow(-1);          
        }
        break;

      case 'down':
        if (ev.metaKey) {
          this.adjustSample(1);
        } else {
          this.adjustRow(1);
        }
        break;
      
      case 'home':
        if (this.column == 0)
          this.row = 0;
        this.column = 0;
        this.channel = 0;
        this.updateUI();
        break;

      case 'end':
        if (this.column == this.numColumns - 1 && this.channel == this.numChannels - 1)
          this.row = 63;
        this.column = this.numColumns - 1;
        this.channel = this.numChannels - 1;
        this.updateUI();
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
        var cols = [];
        switch (this.column) {
          case 0: cols.push("period"); break;
          case 1: cols.push("sample"); break;
          case 2: cols.push("volume"); break;
          case 3: cols.push("effect"); /* fallthrough */
          case 4: cols.push("effectParameter"); break;
        }
        for (var i = 0; i < cols.length; i++)
          this.mod.patterns[this.pattern][this.row][this.channel][cols[i]] = 0;
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
        stop();
        modPlayer.loadPosition(0);
        play();
        break;
      
      case 'f7':
        stop();
        modPlayer.loadPosition(this.position);
        playing = PLAYING_PATTERN;
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
        playing = PLAYING_ROW;
        break;

      default:
        return;
    }
    ev.preventDefault();
  },
  
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
      header.textContent = "Channel " + (i + 1);
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
    var channels = $('.channel');
    var idx = 0;
    var self = this;
    var highlightedCol;
    $(channels).each(function() {
      var row = $($(this).find('.row')[self.row]);
      row.addClass('row-highlight');
      if (idx++ == self.channel) {
        highlightedCol = row.find('span')[self.column];
        $(highlightedCol).addClass('highlight');
      }
    });
    if (highlightedCol)
      highlightedCol.scrollIntoView(false);
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
  
  triggerUpdate: function(player) {
    if (!this.mod)
      return;
    if (playing == PLAYING_PATTERN && this.position != player.currentPosition) {
      player.loadPosition(this.position);
      return;
    }
    this.position = player.currentPosition;
    var oldPattern = this.pattern;
    this.pattern = this.mod.positions[this.position];
    if (playing == PLAYING_ROW && player.currentRow != this.row)
      playing = 2;
    this.row = player.currentRow;
    if (oldPattern != this.pattern)
      this.generateEditorUI();
    this.updateUI();
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

var modPlayer;
var editor;

var STOPPED = 0;
var PLAYING = 1;
var PLAYING_SAMPLE = 2;
var PLAYING_PATTERN = 3;
var PLAYING_ROW = 4;

var playing = 0;
var channels = 2;	//stereo
var sampleRate = 44100;
var bufferSize = 2048 * channels; 
var prebufferSize = 12 * channels * 1024; // defines the latency

var outputAudio = new Audio();

//writeAudio thanks to: http://www.toverlamp.org/static/HTML5-Guitar-Tab-Player/
// function that describes the audio chain
var currentWritePosition = 0;
var lastSampleOffset = 0;
function writeAudio() {
  if (playing == STOPPED) { return; }
  var currentSampleOffset = outputAudio.mozCurrentSampleOffset();
  var playHasStopped = currentSampleOffset == lastSampleOffset; // if audio stopped playing, just send data to trigger it to play again.
  while (currentSampleOffset + prebufferSize >= currentWritePosition || playHasStopped ) {
    // generate audio
    var audioData = modPlayer.getSamples(bufferSize, playing != PLAYING_SAMPLE);
    
    // write audio	
    var written = outputAudio.mozWriteAudio(audioData);
    currentWritePosition += written;	//portionSize;
    currentSampleOffset = outputAudio.mozCurrentSampleOffset();
    playHasStopped = 0;
    if (written < audioData.length) { // firefox buffer is full, stop writing
      return;
    }
  }
  lastSampleOffset = outputAudio.mozCurrentSampleOffset();
}

function play() {
  playing = PLAYING;
}

// setup audio output
function init() {
  //status = document.getElementById("status");
  if(outputAudio.mozSetup) {
    outputAudio.mozSetup(2, sampleRate);
    writeAudio(); // initial write
    var writeInterval = Math.floor(1000 * bufferSize / sampleRate);
    setInterval(writeAudio, writeInterval);
  }
}

function stop() {
  playing = STOPPED;
  for (var i = 0; i < editor.mod.channelCount; i++) {
    modPlayer.channels[i].playing = false;
  }
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
		       modPlayer = ModPlayer(modFile, 44100);
		       //play();
		       document.getElementById('status').innerText = '';
		     };
		   })(file);

  reader.readAsBinaryString(file);
  document.getElementById('status').innerText = '';
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
      editor.loadMOD(modFile);
      //play();
      //document.getElementById('status').innerText = '';
  };
  //document.getElementById('status').innerText = 'loading...';
  fetch.send();
}

$(document).ready(function() {
  editor = new EditorInput();
  $(window).keydown(editor.handleKeypress.bind(editor));
  editor.generateEditorUI();
  editor.updateUI();
  init();
  //dynamicAudio = new DynamicAudio({'swf': 'dynamicaudio.swf'});  
  loadRemote('sundance.mod');
});

