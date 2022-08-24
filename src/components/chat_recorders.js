(function () {
  //IndexedDB
  var indexedDB =
      window.indexedDB ||
      window.webkitIndexedDB ||
      window.mozIndexedDB ||
      window.OIndexedDB ||
      window.msIndexedDB,
    IDBTransaction =
      window.IDBTransaction ||
      window.webkitIDBTransaction ||
      window.OIDBTransaction ||
      window.msIDBTransaction,
    dbVersion = 1.0;

  // Create/open database
  var request = indexedDB.open("chatRecordersDB", dbVersion),
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
    getChatInDb = function () {
      console.log("getting chat message in IndexedDB");
      return new Promise((resolve, reject) => {
        // Open a transaction to the database
        var transaction = db.transaction(["chatRecorders"], "readonly");
        var objectStore = transaction.objectStore("chatRecorders");
        const countRequest = objectStore.count();
        countRequest.onsuccess = () => {
          var count = countRequest.result;
          console.log(countRequest.result);

          var reqget = objectStore.index("ts").openCursor(null, "prev");
          var result = [];
          reqget.onsuccess = function (event) {
            var cursor = event.target.result;
            //console.log(cursor);
            if (cursor) {
              result.push(cursor.value);
              cursor.continue();
            } else {
              console.log(result);
            }
            callback(result);
          };
          reqget.onerror = function (e) {
            console.log(e);
            callback(result);
          };
        };
      });
    };
  request.onerror = function (event) {
    console.log("Error creating/accessing IndexedDB database");
  };
  request.onsuccess = function (event) {
    console.log("Success creating/accessing IndexedDB database");
    db = request.result;

    db.onerror = function (event) {
      console.log("Error creating/accessing IndexedDB database");
    };

    // Interim solution for Google Chrome to create an objectStore. Will be deprecated
    if (db.setVersion) {
      if (db.version !== dbVersion) {
        var setVersion = db.setVersion(dbVersion);
        setVersion.onsuccess = function () {
          createObjectStore(db);
        };
      }
    }
  };

  // For future use. Currently only in latest Firefox versions
  request.onupgradeneeded = function (event) {
    createObjectStore(event.target.result);
  };
})();
