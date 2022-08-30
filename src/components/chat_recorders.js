export default class chatRecorders {
  constructor(ver) {
    this.indexedDB =
      window.indexedDB ||
      window.webkitIndexedDB ||
      window.mozIndexedDB ||
      window.OIndexedDB ||
      window.msIndexedDB;
    this.dbVersion = ver;
    this.ready = this._open();
  }

  _createObjectStore() {
    // Create an objectStore
    console.log("Creating objectStore");
    let object_store = this.db.createObjectStore("chatRecorders", {
      keyPath: "ts",
      unique: true
    });
    object_store.createIndex("to", "to", { unique: false });
    object_store.createIndex("from", "from", { unique: false });
  }

  _open() {
    return new Promise((resolve, reject) => {
      // Create/open database
      this.dbRequest = this.indexedDB.open("chatRecordersDB", this.dbVersion);
      this.dbRequest.onerror = (event) => {
        reject(new Error("Error creating/accessing IndexedDB database"));
      };

      this.dbRequest.onsuccess = (event) => {
        console.log("Success creating/accessing IndexedDB database");
        this.db = this.dbRequest.result;
        resolve();
      };
      // For future use. Currently only in latest Firefox versions
      this.dbRequest.onupgradeneeded = (event) => {
        this.db = event.target.result;
        if (event.oldVersion < 1) {
          this._createObjectStore();
        }
        if (event.oldVersion < 5) {
          this.db.deleteObjectStore("chatRecorders");
          this._createObjectStore();
        }
        this.db.onerror = (e) => {
          reject(new Error("Error Create Database."));
        };
        resolve();
      };
    });
  }

  getCount() {
    return new Promise((resolve, reject) => {
      let transaction = this.db.transaction(["chatRecorders"], "readonly");
      let objectStore = transaction.objectStore("chatRecorders");
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
  }

  putChatInDb(messages) {
    console.log("Putting chat messages in IndexedDB");
    return new Promise((resolve, reject) => {
      // Open a transaction to the database
      let transaction = this.db.transaction(["chatRecorders"], "readwrite");
      transaction.oncomplete = (event) => {
        console.log("Put chat messages into db success!");
        resolve();
      };
      transaction.onerror = (event) => {
        console.log("Put chat messages error:");
        console.log(event);
        reject(event);
      };
      messages.forEach((message) => {
        // Put the message into the dabase
        if (!message.history) {
          let reqput = transaction.objectStore("chatRecorders").put(message);
          reqput.onsuccess = () => {
            console.log("Store chat message resquest success!");
          };
        }
      });
      transaction.commit();
    });
  }

  clear() {
    return new Promise((resolve, reject) => {
      // open a read/write db transaction, ready for clearing the data
      const transaction = this.db.transaction(["chatRecorders"], "readwrite");
      // report on the success of the transaction completing, when everything is done
      transaction.oncomplete = (event) => {
        console.log("Clear Transaction completed.");
        resolve();
      };

      transaction.onerror = (event) => {
        console.log(
          `Transaction not opened due to error: ${transaction.error}`
        );
        reject(transaction.error);
      };

      // create an object store on the transaction
      const objectStore = transaction.objectStore("chatRecorders");

      // Make a request to clear all the data out of the object store
      const objectStoreRequest = objectStore.clear();

      objectStoreRequest.onsuccess = (event) => {
        // report the success of our request
        console.log("Clear Request successful.");
      };
    });
  }

  getChatInDb(cursor, count) {
    console.log(`getting chat message in IndexedDB, cursor:${cursor}`);
    return new Promise((resolve, reject) => {
      // Open a transaction to the database
      let transaction = this.db.transaction(["chatRecorders"], "readonly");
      let objectStore = transaction.objectStore("chatRecorders");
      let reqGet = objectStore.openCursor(null, "prevunique");
      let result = [];
      reqGet.onsuccess = (event) => {
        let cursorGet = event.target.result;
        //console.log(cursor);
        if (cursorGet) {
          if (cursor > 0) {
            cursorGet.advance(cursor);
            cursor = 0;
          } else {
            let hmsg = cursorGet.value;
            hmsg.history = true;
            result.splice(0, 0, hmsg);
            console.log(hmsg);
            if (result.length === count) {
              resolve(result);
            } else {
              cursorGet.continue();
            }
          }
        } else {
          console.log("get chat message ended!");
          console.log(result);
          resolve(result);
        }
      };
      reqGet.onerror = (e) => {
        console.log(e);
        reject(e);
      };
    });
  }
}
