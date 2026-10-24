import {
  MAX_BINARY_ATTACHMENT_BYTES,
  BINARY_ATTACHMENT_SIZE_LABEL,
  isAllowedBinaryMimeType,
  ALLOWED_BINARY_FORMAT_LABELS,
} from '../domain/evidenceRules';

export interface StoredBinaryAttachment {
  blobKey: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  blob: Blob;
  evidenceId?: string;
  createdAt: string;
}

const DB_NAME = 'jansahabhag_binary_store';
const STORE_NAME = 'evidence_attachments';
const DB_VERSION = 1;

// In-memory cache for fast retrieval after durable commit
const inMemoryStore = new Map<string, StoredBinaryAttachment>();
let isSimulatedQuotaFailure = false;
let isSimulatedTransactionFailure = false;
let isSimulatedOpenFailure = false;

function isIndexedDBAvailable(): boolean {
  try {
    return typeof window !== 'undefined' && typeof window.indexedDB !== 'undefined' && window.indexedDB !== null;
  } catch {
    return false;
  }
}

let dbInstancePromise: Promise<IDBDatabase> | null = null;

function getDb(): Promise<IDBDatabase> {
  if (isSimulatedOpenFailure) {
    return Promise.reject(
      new Error('Browser storage failure: Simulated IndexedDB open failure (permission denied or storage disabled).')
    );
  }

  if (dbInstancePromise) return dbInstancePromise;

  dbInstancePromise = new Promise((resolve, reject) => {
    if (!isIndexedDBAvailable()) {
      dbInstancePromise = null;
      reject(new Error('Browser storage failure: IndexedDB is not supported or storage is disabled in this browser.'));
      return;
    }

    try {
      const request = window.indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = (event: IDBVersionChangeEvent) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME, { keyPath: 'blobKey' });
        }
      };

      request.onsuccess = () => {
        resolve(request.result);
      };

      request.onerror = () => {
        dbInstancePromise = null;
        reject(request.error || new Error('Browser storage failure: Failed to open IndexedDB binary store.'));
      };

      request.onblocked = () => {
        console.warn('IndexedDB binary store opening is blocked by another tab.');
      };
    } catch (err) {
      dbInstancePromise = null;
      reject(err);
    }
  });

  return dbInstancePromise;
}

export class EvidenceAttachmentStore {
  public static readonly STORAGE_ENGINE_LABEL = 'Browser-Local IndexedDB (No remote upload)';

  /**
   * For testing quota failure resilience
   */
  public static setSimulateQuotaFailure(fail: boolean): void {
    isSimulatedQuotaFailure = fail;
  }

  /**
   * For testing non-quota transaction failure resilience (e.g. abort, I/O error, hardware failure)
   */
  public static setSimulateTransactionFailure(fail: boolean): void {
    isSimulatedTransactionFailure = fail;
  }

  /**
   * For testing open failure resilience (e.g. storage disabled, strict privacy mode)
   */
  public static setSimulateOpenFailure(fail: boolean): void {
    isSimulatedOpenFailure = fail;
    if (fail) {
      dbInstancePromise = null;
    }
  }

  /**
   * Clears ONLY the in-memory mirror cache without touching IndexedDB.
   * This is used by tests to simulate a fresh browser session/page reload
   * and prove genuine persistence in IndexedDB.
   */
  public static clearMemoryCacheOnly(): void {
    inMemoryStore.clear();
  }

  /**
   * Returns current count of items in in-memory mirror cache
   */
  public static getMemoryCacheSize(): number {
    return inMemoryStore.size;
  }

  /**
   * Resets active DB connection instance promise
   */
  public static resetDbConnection(): void {
    dbInstancePromise = null;
  }

  /**
   * Store binary blob/file in browser-local IndexedDB.
   * Resolves strictly on tx.oncomplete.
   * Rejects with a visible storage error on any failure; never silently succeeds into temporary memory.
   */
  public static async saveAttachment(
    blobKey: string,
    fileOrBlob: Blob,
    metadata: {
      fileName: string;
      mimeType: string;
      fileSize?: number;
      evidenceId?: string;
    }
  ): Promise<string> {
    if (isSimulatedQuotaFailure) {
      const quotaErr = new DOMException('The quota has been exceeded.', 'QuotaExceededError');
      throw new Error(
        `Browser storage failure: IndexedDB quota exceeded. Please select a smaller file or remove previous attachments. (${quotaErr.name})`
      );
    }

    if (isSimulatedTransactionFailure) {
      throw new Error(
        'Browser storage failure: IndexedDB transaction aborted. Unable to write attachment to disk.'
      );
    }

    const size = metadata.fileSize ?? fileOrBlob.size;
    if (size > MAX_BINARY_ATTACHMENT_BYTES) {
      throw new Error(
        `Attachment size (${(size / (1024 * 1024)).toFixed(1)} MB) exceeds browser-local demo limit of ${BINARY_ATTACHMENT_SIZE_LABEL}.`
      );
    }

    if (!isAllowedBinaryMimeType(metadata.mimeType)) {
      throw new Error(
        `Unsupported media type "${metadata.mimeType}". Allowed formats: ${ALLOWED_BINARY_FORMAT_LABELS}.`
      );
    }

    if (!isIndexedDBAvailable()) {
      throw new Error(
        'Browser storage failure: IndexedDB is not supported or storage is disabled in this browser. Evidence cannot be saved durably.'
      );
    }

    const item: StoredBinaryAttachment = {
      blobKey,
      fileName: metadata.fileName,
      fileSize: size,
      mimeType: metadata.mimeType,
      blob: fileOrBlob,
      evidenceId: metadata.evidenceId,
      createdAt: new Date().toISOString(),
    };

    const db = await getDb();

    await new Promise<void>((resolve, reject) => {
      let isSettled = false;
      const settleError = (err: Error) => {
        if (!isSettled) {
          isSettled = true;
          reject(err);
        }
      };

      try {
        const tx = db.transaction(STORE_NAME, 'readwrite');
        const store = tx.objectStore(STORE_NAME);

        const request = store.put(item);

        // Crucial invariant: Resolve save ONLY on transaction oncomplete, NOT request.onsuccess,
        // so late abort or commit quota failure is observed.
        tx.oncomplete = () => {
          if (!isSettled) {
            isSettled = true;
            resolve();
          }
        };

        tx.onerror = () => {
          const err = tx.error;
          if (err?.name === 'QuotaExceededError' || err?.message?.toLowerCase().includes('quota')) {
            settleError(
              new Error(
                'Browser storage failure: IndexedDB quota exceeded. Please select a smaller file or remove previous attachments.'
              )
            );
          } else {
            settleError(
              new Error(
                `Browser storage failure: IndexedDB transaction error (${err?.message || 'Transaction failed'}).`
              )
            );
          }
        };

        tx.onabort = () => {
          const err = tx.error;
          if (err?.name === 'QuotaExceededError' || err?.message?.toLowerCase().includes('quota')) {
            settleError(
              new Error(
                'Browser storage failure: IndexedDB quota exceeded. Please select a smaller file or remove previous attachments.'
              )
            );
          } else {
            settleError(
              new Error(
                `Browser storage failure: IndexedDB transaction aborted (${err?.message || 'Transaction aborted'}).`
              )
            );
          }
        };

        request.onerror = () => {
          const err = request.error;
          if (err?.name === 'QuotaExceededError' || err?.message?.toLowerCase().includes('quota')) {
            settleError(
              new Error(
                'Browser storage failure: IndexedDB quota exceeded. Please select a smaller file or remove previous attachments.'
              )
            );
          } else {
            settleError(
              new Error(
                `Browser storage failure: IndexedDB put request error (${err?.message || 'Put request failed'}).`
              )
            );
          }
        };
      } catch (err: unknown) {
        settleError(
          new Error(
            `Browser storage failure: Failed to start IndexedDB transaction (${err instanceof Error ? err.message : String(err)}).`
          )
        );
      }
    });

    // Populate in-memory mirror cache ONLY after the transaction has successfully completed and committed
    inMemoryStore.set(blobKey, item);
    return blobKey;
  }

  /**
   * Retrieve binary attachment by stable blob key
   */
  public static async getAttachment(blobKey: string): Promise<StoredBinaryAttachment | null> {
    if (inMemoryStore.has(blobKey)) {
      return inMemoryStore.get(blobKey) || null;
    }

    if (!isIndexedDBAvailable()) {
      return null;
    }

    try {
      const db = await getDb();
      return await new Promise<StoredBinaryAttachment | null>((resolve, reject) => {
        try {
          const tx = db.transaction(STORE_NAME, 'readonly');
          const store = tx.objectStore(STORE_NAME);
          const request = store.get(blobKey);

          request.onsuccess = () => {
            const result = request.result as StoredBinaryAttachment | undefined;
            if (result) {
              inMemoryStore.set(blobKey, result);
              resolve(result);
            } else {
              resolve(null);
            }
          };

          request.onerror = () => {
            reject(request.error || new Error('Failed to read from IndexedDB.'));
          };
        } catch (err) {
          reject(err);
        }
      });
    } catch (err) {
      console.warn('Failed to retrieve attachment from IndexedDB', err);
      return null;
    }
  }

  /**
   * Delete attachment by blob key
   */
  public static async deleteAttachment(blobKey: string): Promise<void> {
    inMemoryStore.delete(blobKey);
    if (!isIndexedDBAvailable()) return;

    try {
      const db = await getDb();
      await new Promise<void>((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readwrite');
        const store = tx.objectStore(STORE_NAME);
        const request = store.delete(blobKey);

        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error || request.error);
        tx.onabort = () => reject(tx.error);
        request.onerror = () => reject(request.error);
      });
    } catch (err) {
      console.warn('Failed to delete attachment from IndexedDB', err);
    }
  }

  /**
   * Creates a blob URL for preview or download
   */
  public static async getAttachmentBlobUrl(blobKey: string): Promise<string | null> {
    const record = await this.getAttachment(blobKey);
    if (!record || !record.blob) return null;

    try {
      if (typeof window !== 'undefined' && window.URL && typeof window.URL.createObjectURL === 'function') {
        return window.URL.createObjectURL(record.blob);
      }
    } catch {
      // fallback
    }
    return null;
  }

  /**
   * Revoke blob URL to release memory
   */
  public static revokeAttachmentBlobUrl(url: string): void {
    try {
      if (typeof window !== 'undefined' && window.URL && typeof window.URL.revokeObjectURL === 'function') {
        window.URL.revokeObjectURL(url);
      }
    } catch {
      // ignore
    }
  }

  /**
   * Estimate current storage usage in bytes
   */
  public static async estimateStorageUsage(): Promise<{
    usedBytes: number;
    quotaBytes?: number;
    availableBytes?: number;
  }> {
    let totalBytes = 0;
    for (const item of inMemoryStore.values()) {
      totalBytes += item.fileSize || item.blob?.size || 0;
    }

    if (
      typeof navigator !== 'undefined' &&
      navigator.storage &&
      typeof navigator.storage.estimate === 'function'
    ) {
      try {
        const est = await navigator.storage.estimate();
        return {
          usedBytes: est.usage ?? totalBytes,
          quotaBytes: est.quota,
          availableBytes: est.quota && est.usage ? est.quota - est.usage : undefined,
        };
      } catch {
        // Fallback
      }
    }

    return {
      usedBytes: totalBytes,
      quotaBytes: 50 * 1024 * 1024, // 50 MB demo estimate
    };
  }

  /**
   * Reset/clear all stored attachments
   */
  public static async clearAll(): Promise<void> {
    inMemoryStore.clear();
    isSimulatedQuotaFailure = false;
    isSimulatedTransactionFailure = false;
    isSimulatedOpenFailure = false;

    if (!isIndexedDBAvailable()) return;

    try {
      const db = await getDb();
      await new Promise<void>((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readwrite');
        const store = tx.objectStore(STORE_NAME);
        const request = store.clear();

        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error || request.error);
        tx.onabort = () => reject(tx.error);
        request.onerror = () => reject(request.error);
      });
    } catch (err) {
      console.warn('Failed to clear IndexedDB store', err);
    }
  }
}
