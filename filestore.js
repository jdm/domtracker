function FileStore() {
  this.files = null;
}

FileStore.prototype = {
  init: function(callback) {
    if (this.files) {
      callback();
      return;
    }

    this.files = new IDBStore({
      dbName: 'filestoredb',
      dbDescription: 'DB used for storing files',
      dbVersion: '1.0',
      storeName: 'filestore',
      keyPath: 'id',
      autoIncrement: true,
      onStoreReady: function(){
        callback();
      }
    });
  },
  
  getAll: function(callback) {
    var self = this;
    this.init(function() { self.files.getAll(callback); });
  },
  
  get: function(id, callback) {
    var self = this;
    this.init(function() { self.files.get(id, callback); });
  },
  
  put: function(filename, buffer, callback, id) {
    var self = this;
    function doPut() {
      var file = {
        name: filename,
        contents: buffer
      };
      if (id != null)
        file.id = id;
      self.files.put(file, callback);
    }
    this.init(doPut);
  }
};