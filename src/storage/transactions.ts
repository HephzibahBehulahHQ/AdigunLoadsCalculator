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
    let settled = false;
    const timer = setTimeout(() => {
      fail(
        new Error(
          "Local data read timed out. Your saved data has not been changed. Close older PowerLab tabs and retry.",
        ),
      );
      try {
        transaction.abort();
      } catch {
        /* A late completion must not revive this failed read. */
      }
    }, 8000);
    function fail(error: unknown) {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      reject(error);
    }
    const failed = () =>
      fail(
        transaction.error ||
          new Error(
            "Local data could not be read. Your saved data has not been changed. Try reopening the project.",
          ),
      );
    transaction.oncomplete = () => {
      if (settled) return;
      if (succeeded) {
        settled = true;
        clearTimeout(timer);
        resolve(result);
      } else failed();
    };
    transaction.onabort = failed;
    transaction.onerror = failed;
    try {
      const request = requestFactory(transaction.objectStore(storeName));
      request.onsuccess = () => {
        if (settled) return;
        result = request.result;
        succeeded = true;
      };
      request.onerror = () =>
        fail(
          request.error ||
            transaction.error ||
            new Error("Local data could not be read."),
        );
    } catch (error) {
      fail(error);
      try {
        transaction.abort();
      } catch {
        /* The transaction may already have ended. */
      }
    }
  });
}
