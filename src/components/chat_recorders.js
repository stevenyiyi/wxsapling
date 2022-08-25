(function () {
  //IndexedDB
  var indexedDB =
      window.indexedDB ||
      window.webkitIndexedDB ||
      window.mozIndexedDB ||
      window.OIndexedDB ||
      window.msIndexedDB,
    dbVersion = 1.0;

  // Create/open database
  var DBRequest = indexedDB.open("chatRecordersDB", dbVersion),
    db,
    createObjectStore = function (dataBase) {
      // Create an objectStore
      console.log("Creating objectStore");
      let object_store = dataBase.createObjectStore("chatRecorders", {
        keyPath: "ts"
      });
      object_store.createIndex("to", "to", { unique: false });
      object_store.createIndex("from", "from", { unique: false });
      dataBase.onerror = function (e) {
        console.log("Error Create Database.");
        console.log(e);
      };
    },
    getCount = function () {
      return new Promise((resolve, reject) => {
        var transaction = db.transaction(["chatRecorders"], "readonly");
        var objectStore = transaction.objectStore("chatRecorders");
        const countRequest = objectStore.count();
        countRequest.onsuccess = () => {
          var count = countRequest.result;
          console.log(countRequest.result);
          resolve(count);
        };
        countRequest.onerror = (e) => {
          reject(e);
        };
      });
    },
    putChatInDb = function (chat_message) {
      console.log("Putting chat message in IndexedDB");
      return new Promise((resolve, reject) => {
        // Open a transaction to the database
        var transaction = db.transaction(["chatRecorders"], "readwrite");

        // Put the blob into the dabase
        var reqput = transaction.objectStore("chatRecorders").put(chat_message);
        reqput.onsuccess = function () {
          console.log("Put chat message success!");
          resolve();
        };
        reqput.onerror = function (e) {
          console.log("Put chat message error:");
          console.log(e);
          reject(e);
        };
      });
    },
    getChatInDb = function (cursor, count) {
      console.log(`getting chat message in IndexedDB, cursor:${cursor}`);
      return new Promise((resolve, reject) => {
        // Open a transaction to the database
        var transaction = db.transaction(["chatRecorders"], "readonly");
        var objectStore = transaction.objectStore("chatRecorders");
        var reqGet = objectStore.index("ts").openCursor(null, "prev");
        var result = [];
        reqGet.onsuccess = function (event) {
          var cursorGet = event.target.result;
          cursorGet.advance(cursor);
          //console.log(cursor);
          if (cursorGet) {
            result.push(cursor.value);
            if (result.length === count) {
              resolve(result);
            } else {
              cursorGet.continue();
            }
          } else {
            console.log(result);
            resolve(result);
          }
        };
        reqGet.onerror = function (e) {
          console.log(e);
          reject(e);
        };
      });
    };
  DBRequest.onerror = function (event) {
    console.log("Error creating/accessing IndexedDB database");
  };
  DBRequest.onsuccess = function (event) {
    console.log("Success creating/accessing IndexedDB database");
    db = DBRequest.result;

    db.onerror = function (event) {
      console.log("Error creating/accessing IndexedDB database");
    };
  };

  // For future use. Currently only in latest Firefox versions
  DBRequest.onupgradeneeded = function (event) {
    createObjectStore(event.target.result);
  };
})();
