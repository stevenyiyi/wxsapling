export default class chatRecorders {
  constructor() {
    this.indexedDB =
      window.indexedDB ||
      window.webkitIndexedDB ||
      window.mozIndexedDB ||
      window.OIndexedDB ||
      window.msIndexedDB;
    this.dbVersion = 1;
    // Create/open database
    this.dbRequest = this.indexedDB.open("chatRecordersDB", this.dbVersion);
    this.dbRequest.onerror = (event) => {
      console.log("Error creating/accessing IndexedDB database");
    };
    this.db = null;
    this.dbRequest.onsuccess = (event) => {
      console.log("Success creating/accessing IndexedDB database");
      this.db = this.dbRequest.result;
      this.db.onerror = (event) => {
        console.log("Error creating/accessing IndexedDB database");
      };
    };

    // For future use. Currently only in latest Firefox versions
    this.dbRequest.onupgradeneeded = (event) => {
      this.createObjectStore(event.target.result);
    };
  }

  createObjectStore(dataBase) {
    // Create an objectStore
    console.log("Creating objectStore");
    let object_store = dataBase.createObjectStore("chatRecorders", {
      keyPath: "ts"
    });
    object_store.createIndex("to", "to", { unique: false });
    object_store.createIndex("from", "from", { unique: false });
    dataBase.onerror = (e) => {
      console.log("Error Create Database.");
      console.log(e);
    };
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
  putChatInDb(chat_message) {
    console.log("Putting chat message in IndexedDB");
    return new Promise((resolve, reject) => {
      // Open a transaction to the database
      let transaction = this.db.transaction(["chatRecorders"], "readwrite");

      // Put the blob into the dabase
      let reqput = transaction.objectStore("chatRecorders").put(chat_message);
      reqput.onsuccess = () => {
        console.log("Put chat message success!");
        resolve();
      };
      reqput.onerror = (e) => {
        console.log("Put chat message error:");
        console.log(e);
        reject(e);
      };
    });
  }
  getChatInDb(cursor, count) {
    console.log(`getting chat message in IndexedDB, cursor:${cursor}`);
    return new Promise((resolve, reject) => {
      // Open a transaction to the database
      let transaction = this.db.transaction(["chatRecorders"], "readonly");
      let objectStore = transaction.objectStore("chatRecorders");
      let reqGet = objectStore.index("ts").openCursor(null, "prev");
      let result = [];
      reqGet.onsuccess = (event) => {
        let cursorGet = event.target.result;
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
      reqGet.onerror = (e) => {
        console.log(e);
        reject(e);
      };
    });
  }
}
