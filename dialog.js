function Dialog() {
  this.dialog = document.getElementById('load-dialog');
}

Dialog.prototype = {
  open: function(title) {
    var self = this;
    focusedInputHandler.push({
      handleKeypress: function(ev) {
        switch (keyCodeToString(ev.which)) {
          case 'escape':
            self.close();
            break;
          default:
            return;
        }
        ev.preventDefault();
      }
    });
    
    var elem = document.createElement('legend');
    elem.id = 'load-dialog-title';
    elem.textContent = title;
    this.dialog.appendChild(elem);
  },
  
  close: function() {
    this.dialog.style.display = 'none';
    while (this.dialog.childNodes.length > 0)
      this.dialog.removeChild(this.dialog.firstChild);
    focusedInputHandler.pop();
    this.selected = -1;
  },
  
  appendDefaultButtons: function(callback) {
    var elem = document.createElement('button');
    elem.id = 'load-dialog-ok';
    elem.textContent = 'Ok';
    var self = this;
    elem.onclick = function() {
      if (callback())
        self.close();
    };
    this.dialog.appendChild(elem);

    elem = document.createElement('button');
    elem.id = 'load-dialog-cancel';
    elem.textContent = 'Cancel';
    elem.onclick = function() { self.close(); };
    this.dialog.appendChild(elem);
  },
  
  appendLabelledInput: function(id, type, text) {
    var elem = document.createElement('label');
    elem.setAttribute('for', id);
    elem.textContent = text;
    this.dialog.appendChild(elem);
    elem = document.createElement('input');
    elem.type = type;
    elem.id = id;
    this.dialog.appendChild(elem);
  },
  
  center: function() {
    this.dialog.style.display = 'block';
    this.dialog.style.left = (this.dialog.parentNode.offsetWidth - this.dialog.offsetWidth) / 2 + "px";
    this.dialog.style.top = (this.dialog.parentNode.parentNode.offsetHeight - this.dialog.offsetHeight) / 2 + "px";
  }
};