import type { LocalAssessmentStorePort } from "../../ports/local-assessment-store.port";
import type { AssessmentRecord } from "../../domain/assessment-record";

const DB_NAME = "zelo-assessments";
const STORE_NAME = "records";

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => {
      request.result.createObjectStore(STORE_NAME, { keyPath: "id" });
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export class IndexedDbAssessmentStoreAdapter implements LocalAssessmentStorePort {
  async save(record: AssessmentRecord): Promise<void> {
    const db = await openDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, "readwrite");
      tx.objectStore(STORE_NAME).put(record);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }

  async listAll(): Promise<AssessmentRecord[]> {
    const db = await openDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, "readonly");
      const request = tx.objectStore(STORE_NAME).getAll();
      request.onsuccess = () => resolve(request.result as AssessmentRecord[]);
      request.onerror = () => reject(request.error);
    });
  }
}
