let db;
const request = indexedDB.open('transaction', 1);

// this event will emit if the database version changes (nonexistant to version 1, v1 to v2, etc.)
request.onupgradeneeded = function(event) {
    // save a reference to the database 
    const db = event.target.result;
    // create an object store (table) called `new_transaction`, set it to have an auto incrementing primary key of sorts 
    db.createObjectStore('new_transaction', { autoIncrement: true });
  };

// upon a successful 
request.onsuccess = function(event) {
    // when db is successfully created with its object store (from onupgradedneeded event above) or simply established a connection, save reference to db in global variable
    db = event.target.result;
  
    // check if app is online, if yes run uploadTranactions() function to send all local db data to api
    if (navigator.onLine) {
      // we haven't created this yet, but we will soon, so let's comment it out for now
      uploadTranactions();
    }
  };
  
  request.onerror = function(event) {
    // log error here
    console.log(event.target.errorCode);
  };

// This function will be executed if we attempt to submit a new pizza and there's no internet connection
function saveRecord(record) {
    // open a new transaction with the database with read and write permissions 
    const transaction = db.transaction(['new_transaction'], 'readwrite');
  
    // access the object store for `new_transaction`
    const transactionObjectStore = transaction.objectStore('new_transaction');
  
    // add record to your store with add method
    transactionObjectStore.add(record);
  }

function uploadTransactions(){
    console.log("uploading transactions");
    const transaction = db.transaction(['new_transaction'], 'readwrite');

    const transactionStore = transaction.objectStore('new_transaction');

    const getAll = transactionStore.getAll();
    
    getAll.onsuccess = function(){
        console.log("number of transcations : "+getAll.result.length);
        if(getAll.result.length > 0){
                fetch("/api/transaction", {
                    method: "POST",
                    body: JSON.stringify(getAll.result),
                    headers: {
                      Accept: "application/json, text/plain, */*",
                      "Content-Type": "application/json"
                    }
                  })
                .then(response => response.json())
                .then(serverResponse => {
                    if(serverResponse.message){
                        throw new Error(serverResponse);
                    }
                    const transaction = db.transaction(['new_transaction'], 'readwrite');
                    const transactionStore = transaction.objectStore('new_transaction');
                    transactionStore.clear();
                })
                .catch(err => {
                    console.log(err);
                })     
        }
    }
}   



window.addEventListener('online', uploadTransactions);