import '@testing-library/jest-dom';

// Polyfill window.matchMedia if needed in jsdom
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => {},
  }),
});

// Polyfill ResizeObserver for Recharts
global.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
};

// Polyfill window.URL.createObjectURL and revokeObjectURL if not present
if (typeof window !== 'undefined') {
  if (typeof window.URL.createObjectURL !== 'function') {
    window.URL.createObjectURL = (_blob: unknown) =>
      `blob:mock-url-${Math.random().toString(36).substring(2, 9)}`;
  }
  if (typeof window.URL.revokeObjectURL !== 'function') {
    window.URL.revokeObjectURL = () => {};
  }
}

// Lightweight, compliant browser-local IndexedDB mock with transaction lifecycle
interface MockDatabaseState {
  version: number;
  stores: Map<string, { keyPath?: string; data: Map<unknown, unknown> }>;
}

const mockDatabases = new Map<string, MockDatabaseState>();

class MockIDBRequest {
  public result: unknown = undefined;
  public error: DOMException | Error | null = null;
  public onsuccess: ((event: unknown) => void) | null = null;
  public onerror: ((event: unknown) => void) | null = null;
}

class MockIDBOpenDBRequest extends MockIDBRequest {
  public onupgradeneeded: ((event: unknown) => void) | null = null;
  public onblocked: ((event: unknown) => void) | null = null;
}

class MockIDBTransaction {
  public db: MockIDBDatabase;
  public mode: IDBTransactionMode;
  public error: DOMException | Error | null = null;
  public oncomplete: ((event: unknown) => void) | null = null;
  public onerror: ((event: unknown) => void) | null = null;
  public onabort: ((event: unknown) => void) | null = null;

  private aborted = false;
  private pendingOperations: (() => void)[] = [];
  private activeRequests = 0;

  constructor(db: MockIDBDatabase, mode: IDBTransactionMode) {
    this.db = db;
    this.mode = mode;
  }

  public objectStore(storeName: string): MockIDBObjectStore {
    const storeState = this.db._getStoreState(storeName);
    if (!storeState) {
      throw new DOMException(`NotFoundError: One of the specified stores was not found: ${storeName}`);
    }
    return new MockIDBObjectStore(this, storeName, storeState);
  }

  public abort(error?: DOMException | Error): void {
    if (this.aborted) return;
    this.aborted = true;
    this.error = error || new DOMException('Transaction was aborted by user or system', 'AbortError');
    this.pendingOperations = []; // discard staged operations
    queueMicrotask(() => {
      if (this.onabort) {
        this.onabort({ target: this, type: 'abort' });
      }
    });
  }

  public _enqueueCommit(op: () => void): void {
    if (!this.aborted) {
      this.pendingOperations.push(op);
    }
  }

  public _registerRequest(req: MockIDBRequest, executor: () => { result?: unknown; error?: Error | DOMException | unknown }): void {
    if (this.aborted) return;
    this.activeRequests++;

    queueMicrotask(() => {
      if (this.aborted) return;
      try {
        const { result, error } = executor();
        if (error) {
          req.error = error instanceof Error || error instanceof DOMException ? error : new Error(String(error));
          if (req.onerror) req.onerror({ target: req, type: 'error' });
          if (!this.aborted) {
            this.error = req.error;
            if (this.onerror) this.onerror({ target: this, type: 'error' });
          }
        } else {
          req.result = result;
          if (req.onsuccess) req.onsuccess({ target: req, type: 'success' });
        }
      } catch (err: unknown) {
        const domErr = err instanceof Error || err instanceof DOMException ? err : new Error(String(err));
        req.error = domErr;
        if (req.onerror) req.onerror({ target: req, type: 'error' });
        if (!this.aborted) {
          this.error = domErr;
          if (this.onerror) this.onerror({ target: this, type: 'error' });
        }
      } finally {
        this.activeRequests--;
        if (this.activeRequests === 0 && !this.aborted && !this.error) {
          // Commit all staged mutations to the persistent table
          for (const op of this.pendingOperations) {
            op();
          }
          this.pendingOperations = [];
          queueMicrotask(() => {
            if (!this.aborted && !this.error && this.oncomplete) {
              this.oncomplete({ target: this, type: 'complete' });
            }
          });
        }
      }
    });
  }
}

class MockIDBObjectStore {
  private tx: MockIDBTransaction;
  public name: string;
  private state: { keyPath?: string; data: Map<unknown, unknown> };

  constructor(tx: MockIDBTransaction, name: string, state: { keyPath?: string; data: Map<unknown, unknown> }) {
    this.tx = tx;
    this.name = name;
    this.state = state;
  }

  public put(value: Record<string, unknown>, key?: unknown): MockIDBRequest {
    const req = new MockIDBRequest();
    const effectiveKey = key ?? (this.state.keyPath ? value[this.state.keyPath] : undefined);
    if (effectiveKey === undefined) {
      throw new DOMException('DataError: No key provided and no keyPath match');
    }

    const storedValue = {
      ...value,
      blob: value.blob,
    };

    this.tx._registerRequest(req, () => {
      this.tx._enqueueCommit(() => {
        this.state.data.set(effectiveKey, storedValue);
      });
      return { result: effectiveKey };
    });

    return req;
  }

  public get(key: unknown): MockIDBRequest {
    const req = new MockIDBRequest();
    this.tx._registerRequest(req, () => {
      const val = this.state.data.get(key) as Record<string, unknown> | undefined;
      const cloned = val ? { ...val, blob: val.blob } : undefined;
      return { result: cloned };
    });
    return req;
  }

  public delete(key: unknown): MockIDBRequest {
    const req = new MockIDBRequest();
    this.tx._registerRequest(req, () => {
      this.tx._enqueueCommit(() => {
        this.state.data.delete(key);
      });
      return { result: undefined };
    });
    return req;
  }

  public clear(): MockIDBRequest {
    const req = new MockIDBRequest();
    this.tx._registerRequest(req, () => {
      this.tx._enqueueCommit(() => {
        this.state.data.clear();
      });
      return { result: undefined };
    });
    return req;
  }
}

class MockIDBDatabase {
  public name: string;
  public version: number;
  private _state: MockDatabaseState;

  constructor(name: string, state: MockDatabaseState) {
    this.name = name;
    this.version = state.version;
    this._state = state;
  }

  public get objectStoreNames(): { contains: (name: string) => boolean; length: number; [index: number]: string } {
    const names = Array.from(this._state.stores.keys());
    const result: { contains: (name: string) => boolean; length: number; [index: number]: string } = {
      contains: (n: string) => this._state.stores.has(n),
      length: names.length,
    };
    names.forEach((name, i) => {
      result[i] = name;
    });
    return result;
  }

  public createObjectStore(storeName: string, options?: { keyPath?: string }): MockIDBObjectStore {
    if (this._state.stores.has(storeName)) {
      throw new DOMException(`ConstraintError: Object store ${storeName} already exists`);
    }
    const storeState = { keyPath: options?.keyPath, data: new Map<unknown, unknown>() };
    this._state.stores.set(storeName, storeState);
    const dummyTx = new MockIDBTransaction(this, 'readwrite');
    return new MockIDBObjectStore(dummyTx, storeName, storeState);
  }

  public transaction(storeNames: string | string[], mode: IDBTransactionMode = 'readonly'): MockIDBTransaction {
    const names = Array.isArray(storeNames) ? storeNames : [storeNames];
    for (const n of names) {
      if (!this._state.stores.has(n)) {
        throw new DOMException(`NotFoundError: Object store "${n}" not found in database "${this.name}".`);
      }
    }
    return new MockIDBTransaction(this, mode);
  }

  public _getStoreState(storeName: string) {
    return this._state.stores.get(storeName);
  }

  public close(): void {
    // no-op
  }
}

const mockIndexedDB = {
  open(name: string, version = 1): MockIDBOpenDBRequest {
    const req = new MockIDBOpenDBRequest();

    queueMicrotask(() => {
      let dbState = mockDatabases.get(name);
      const isNew = !dbState;
      const oldVersion = dbState ? dbState.version : 0;

      if (!dbState) {
        dbState = { version, stores: new Map() };
        mockDatabases.set(name, dbState);
      } else if (version > dbState.version) {
        dbState.version = version;
      }

      const db = new MockIDBDatabase(name, dbState);
      req.result = db;

      if (isNew || version > oldVersion) {
        if (req.onupgradeneeded) {
          req.onupgradeneeded({
            target: req,
            oldVersion,
            newVersion: version,
            type: 'upgradeneeded',
          });
        }
      }

      if (req.onsuccess) {
        req.onsuccess({ target: req, type: 'success' });
      }
    });

    return req;
  },

  deleteDatabase(name: string): MockIDBRequest {
    const req = new MockIDBRequest();
    mockDatabases.delete(name);
    queueMicrotask(() => {
      if (req.onsuccess) req.onsuccess({ target: req, type: 'success' });
    });
    return req;
  },
};

Object.defineProperty(window, 'indexedDB', {
  writable: true,
  configurable: true,
  value: mockIndexedDB,
});

(globalThis as unknown as { indexedDB: unknown }).indexedDB = mockIndexedDB;
(globalThis as unknown as { __resetMockIndexedDB: () => void }).__resetMockIndexedDB = () => mockDatabases.clear();

