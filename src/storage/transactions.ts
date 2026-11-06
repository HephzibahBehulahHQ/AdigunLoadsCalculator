/** A request succeeding does not mean its transaction has committed. */
export function readCommitted<T>(
  database: IDBDatabase,
  storeName: string,
  requestFactory: (store: IDBObjectStore) => IDBRequest<T>,
): Promise<T> {
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(storeName, "readonly");
    let result: T;
    let succeeded = false;
    const failed = () =>
      reject(
        transaction.error ||
          new Error(
            "Local data could not be read. Your saved data has not been changed. Try reopening the project.",
          ),
      );
    transaction.oncomplete = () => {
      if (succeeded) resolve(result);
      else failed();
    };
    transaction.onabort = failed;
    transaction.onerror = failed;
    try {
      const request = requestFactory(transaction.objectStore(storeName));
      request.onsuccess = () => {
        result = request.result;
        succeeded = true;
      };
      request.onerror = () =>
        reject(
          request.error ||
            transaction.error ||
            new Error("Local data could not be read."),
        );
    } catch (error) {
      try {
        transaction.abort();
      } catch {
        /* The transaction may already have ended. */
      }
      reject(error);
    }
  });
}
