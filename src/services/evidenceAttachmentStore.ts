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

// In-memory fallback map for environments where IndexedDB is unavailable or mock-failed
const inMemoryStore = new Map<string, StoredBinaryAttachment>();
let isSimulatedQuotaFailure = false;

function isIndexedDBAvailable(): boolean {
  try {
    return typeof window !== 'undefined' && !!window.indexedDB;
  } catch {
    return false;
  }
}

let dbInstancePromise: Promise<IDBDatabase> | null = null;

function getDb(): Promise<IDBDatabase> {
  if (dbInstancePromise) return dbInstancePromise;

  dbInstancePromise = new Promise((resolve, reject) => {
    if (!isIndexedDBAvailable()) {
      reject(new Error('IndexedDB is not supported in this browser environment.'));
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
        reject(request.error || new Error('Failed to open IndexedDB binary store.'));
      };

      request.onblocked = () => {
        console.warn('IndexedDB binary store opening is blocked by another tab.');
      };
    } catch (err) {
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
   * Store binary blob/file in browser-local IndexedDB
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

    const item: StoredBinaryAttachment = {
      blobKey,
      fileName: metadata.fileName,
      fileSize: size,
      mimeType: metadata.mimeType,
      blob: fileOrBlob,
      evidenceId: metadata.evidenceId,
      createdAt: new Date().toISOString(),
    };

    if (!isIndexedDBAvailable()) {
      inMemoryStore.set(blobKey, item);
      return blobKey;
    }

    try {
      const db = await getDb();
      await new Promise<void>((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readwrite');
        const store = tx.objectStore(STORE_NAME);

        const request = store.put(item);

        request.onsuccess = () => resolve();
        request.onerror = () => {
          const err = request.error;
          if (err?.name === 'QuotaExceededError') {
            reject(
              new Error(
                'Browser storage failure: IndexedDB quota exceeded. Please select a smaller file or remove previous attachments.'
              )
            );
          } else {
            reject(err || new Error('Failed to write binary attachment to IndexedDB.'));
          }
        };

        tx.onabort = () => {
          const err = tx.error;
          if (err?.name === 'QuotaExceededError') {
            reject(
              new Error(
                'Browser storage failure: IndexedDB quota exceeded. Please select a smaller file or remove previous attachments.'
              )
            );
          } else {
            reject(err || new Error('IndexedDB transaction aborted.'));
          }
        };
      });

      // Keep in-memory mirror for fast retrieval
      inMemoryStore.set(blobKey, item);
      return blobKey;
    } catch (err: any) {
      if (err?.name === 'QuotaExceededError' || err?.message?.includes('quota')) {
        throw new Error(
          'Browser storage failure: IndexedDB quota exceeded. Please select a smaller file or remove previous attachments.'
        );
      }
      // If IndexedDB failed (e.g. storage disabled in strict privacy mode), fallback to inMemory
      console.warn('IndexedDB write failed, falling back to in-memory store:', err);
      inMemoryStore.set(blobKey, item);
      return blobKey;
    }
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
      });
    } catch {
      return inMemoryStore.get(blobKey) || null;
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

        request.onsuccess = () => resolve();
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

    if (!isIndexedDBAvailable()) return;

    try {
      const db = await getDb();
      await new Promise<void>((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readwrite');
        const store = tx.objectStore(STORE_NAME);
        const request = store.clear();

        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });
    } catch (err) {
      console.warn('Failed to clear IndexedDB store', err);
    }
  }
}
