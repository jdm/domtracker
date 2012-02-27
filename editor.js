var keyMapping;

function keyCodeToString(ev) {
  var keyCode = ev.keyCode || ev.which;
  var key = String.fromCharCode(keyCode);
  if ((keyCode >= 'a'.charCodeAt(0) && keyCode <= 'z'.charCodeAt(0)))
    return key;
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

function isAlpha(c) {
  return c >= 'a'.charCodeAt(0) && c <= 'z'.charCodeAt(0);
}

function ChannelData(numRows) {
  this.rows = [];
  while (numRows--) {
    this.rows.push({});
  }
}

ChannelData.prototype = {
  insertSpace: function(row) {
    this.rows.splice(row, 1, {});
    this.rows.pop();
  }
};

function Pattern(numChannels, numRows) {
  this.numRows = numRows;
  this.channelData = [];
  while (numChannels--) {
    this.channelData.push(new ChannelData(numRows));
  }
}

Pattern.prototype = {
};

function EditorInput() {
  this.numChannels = 2;
  this.numPatterns = 1;
  this.numColumns = 4;

  this.channel = 1;
  this.column = 1;
  this.row = 1;
  this.pattern = 1;

  this.patterns = [
    new Pattern(this.numChannels, 2)
  ];
}

EditorInput.prototype = {
  adjustColumn: function(mod) {
    this.column += mod;
    if (this.column > this.numColumns) {
      if (this.adjustChannel(1)) {
        this.column = 1;        
      } else {
        this.column--;
      }
    } else if (this.column == 0) {
      if (this.adjustChannel(-1)) {
        this.column = 2;        
      } else {
        this.column++;
      }
    }
    this.updateUI();
  },

  adjustRow: function(mod) {
    this.row += mod;
    if (this.row > this.patterns[this.pattern - 1].numRows) {
      if (this.adjustPattern(1)) {
        this.row = 0;
      } else {
        this.row--;
      }      
    } else if (this.row == 0) {
      if (this.adjustPattern(-1)) {
        this.row = this.patterns[this.pattern - 1].numRows;
      } else {
        this.row++;
      }
    }
    this.updateUI();
  },
  
  adjustChannel: function(mod) {
    this.channel += mod;
    if (this.channel == 0) {
      this.channel++;
      return false;
    } else if (this.channel > this.numChannels) {
      this.channel--;
      return false;
    }
    return true;
  },
  
  adjustPattern: function(mod) {
    this.pattern += mod;
    if (this.pattern == 0) {
      this.pattern++;
      return false;
    } else if (this.pattern > this.numPatterns) {
      this.pattern--;
      return false;
    }
    return true;
  },
  
  overwriteValue: function(ev) {
    
  },

  handleKeypress: function(ev) {
    var key = keyCodeToString(ev, ev.keyCode);
    console.log(key);
    if (isAlpha(key) ||
        ['[', ']', ';', '\'', ',', '.', '/', '\\'].indexOf(ev.key) != -1) {
      this.overwriteValue(ev.key);
      ev.preventDefault();
      return;
    }

    switch (key) {
      case 'left':
        this.adjustColumn(-1);
        break;
      case 'right':
        this.adjustColumn(1);
        break;
      case 'up':
        this.adjustRow(-1);
        break;
      case 'down':
        this.adjustRow(1);
        break;
      case 'home':
        if (this.column == 1)
          this.row = 1;
        this.column = 1;
        this.channel = 1;
        this.updateUI();
        break;
      case 'end':
        if (this.column == this.numColumns && this.channel == this.numChannels)
          this.row = this.patterns[this.pattern - 1].numRows;
        this.column = this.numColumns;
        this.channel = this.numChannels;
        this.updateUI();
        break;
      default:
        return;
    }
    ev.preventDefault();
  },
  
  generateEditorUI: function() {
    var channels = $('.channel');
    var pattern = this.patterns[this.pattern - 1];
    for (var i = 0; i < this.numChannels; i++) {
      var channel = channels[i];
      while (channel.childNodes.length > 0) {
        channel.removeChild(channel.firstChild);
      }
      var header = document.createElement('div');
      $(header).addClass('header');
      header.textContent = "Channel " + (i + 1);
      channel.appendChild(header);
      for (var j = 0; j < pattern.numRows; j++) {
        var row = pattern.channelData[i].rows[j];
        var rowElem = document.createElement('div');
        $(rowElem).addClass('row');

        var elem = document.createElement('span');
        var hasContent = 'note' in row;
        $(elem).addClass(hasContent ? 'note' : 'blank');
        elem.textContent = hasContent ? row.note : '...';
        rowElem.appendChild(elem);

        elem = document.createElement('span');
        hasContent = 'instrument' in row;
        $(elem).addClass(hasContent ? 'instrument' : 'blank');
        elem.textContent = hasContent ? row.instrument : '..';
        rowElem.appendChild(elem);

        elem = document.createElement('span');
        hasContent = 'volume' in row;
        $(elem).addClass(hasContent ? 'volume' : 'blank');
        elem.textContent = hasContent ? row.volume : '..';
        rowElem.appendChild(elem);

        elem = document.createElement('span');
        $(elem).addClass(effectToClass(row));
        elem.textContent = 'effect' in row ? row.effect : '...';
        rowElem.appendChild(elem);

        channel.appendChild(rowElem);
      }
    }
    
    function effectToClass(row) {
      if (!('effect' in row))
        return 'blank';
      switch (row.effect[0]) {
        case 'C':
          return 'setvolume';
        case 'D':
          return 'patternbreak';
        default:
          break;
      }
      return 'effect';
    }
  },
  
  updateUI: function() {
    $('.row-highlight').removeClass('row-highlight');
    $('.highlight').removeClass('highlight');
    var channels = $('.channel');
    var idx = 1;
    var self = this;
    $(channels).each(function() {
      var row = $($(this).find('.row')[self.row - 1]);
      row.addClass('row-highlight');
      if (idx++ == self.channel) {
        $(row.find('span')[self.column - 1]).addClass('highlight');
      }
    });
  }
};

window.onload = function() {
  var editor = new EditorInput();
  $(window).keypress(editor.handleKeypress.bind(editor));
  editor.generateEditorUI();
  editor.updateUI();
}
