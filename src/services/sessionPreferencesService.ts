import { SessionTextTurn } from '../components/session/types';

export const LOW_DATA_STORAGE_KEY = 'jansahbhag_low_data_mode';
export const SESSION_VIEW_MODE_KEY = 'jansahbhag_session_view_mode';
export const SESSION_SEAT_PREFIX = 'jansahbhag_session_seat_';
export const SESSION_VISIT_PREFIX = 'jansahbhag_session_visit_';
export const SESSION_SEEN_TURNS_PREFIX = 'jansahbhag_session_seen_turns_';
export const SESSION_MISSED_TURNS_PREFIX = 'jansahbhag_session_missed_turns_';

function isStorageAvailable(): boolean {
  try {
    if (typeof window === 'undefined' || !window.localStorage) {
      return false;
    }
    const testKey = '__storage_test__';
    window.localStorage.setItem(testKey, testKey);
    window.localStorage.removeItem(testKey);
    return true;
  } catch {
    return false;
  }
}

export class SessionPreferencesService {
  /**
   * Checks whether Low Data Preference is active in browser demo state.
   */
  public static getLowDataPreference(): boolean {
    if (!isStorageAvailable()) return false;
    try {
      const val = window.localStorage.getItem(LOW_DATA_STORAGE_KEY);
      return val === 'true';
    } catch {
      return false;
    }
  }

  /**
   * Sets Low Data Preference in browser storage.
   */
  public static setLowDataPreference(enabled: boolean): void {
    if (!isStorageAvailable()) return;
    try {
      window.localStorage.setItem(LOW_DATA_STORAGE_KEY, enabled ? 'true' : 'false');
    } catch (err) {
      console.warn('SessionPreferencesService: Failed to save low data preference', err);
    }
  }

  /**
   * Resolves chosen chamber view mode ('chamber' | 'text') for a given session.
   * Persistence priority:
   * 1. Session-specific chosen mode (e.g. jansahbhag_session_view_mode_debate)
   * 2. Global demo chosen mode (jansahbhag_session_view_mode)
   * 3. If Low Data mode is active -> defaults to 'text'
   * 4. Default -> 'chamber'
   */
  public static getSessionViewMode(sessionKey?: string): 'chamber' | 'text' {
    if (!isStorageAvailable()) {
      return this.getLowDataPreference() ? 'text' : 'chamber';
    }
    try {
      if (sessionKey) {
        const specific = window.localStorage.getItem(`${SESSION_VIEW_MODE_KEY}_${sessionKey}`);
        if (specific === 'chamber' || specific === 'text') {
          return specific;
        }
      }
      const globalMode = window.localStorage.getItem(SESSION_VIEW_MODE_KEY);
      if (globalMode === 'chamber' || globalMode === 'text') {
        return globalMode;
      }
    } catch (err) {
      console.warn('SessionPreferencesService: Failed to read session view mode', err);
    }

    return this.getLowDataPreference() ? 'text' : 'chamber';
  }

  /**
   * Saves the chosen chamber view mode to browser demo state.
   */
  public static setSessionViewMode(mode: 'chamber' | 'text', sessionKey?: string): void {
    if (!isStorageAvailable()) return;
    try {
      window.localStorage.setItem(SESSION_VIEW_MODE_KEY, mode);
      if (sessionKey) {
        window.localStorage.setItem(`${SESSION_VIEW_MODE_KEY}_${sessionKey}`, mode);
      }
    } catch (err) {
      console.warn('SessionPreferencesService: Failed to persist session view mode', err);
    }
  }

  /**
   * Retrieves saved selected seat ID for the session to support reload/return restoration.
   */
  public static getSavedSeatId(sessionKey: string): string | null {
    if (!isStorageAvailable() || !sessionKey) return null;
    try {
      return window.localStorage.getItem(`${SESSION_SEAT_PREFIX}${sessionKey}`);
    } catch {
      return null;
    }
  }

  /**
   * Persists selected seat ID for the session.
   */
  public static saveSeatId(sessionKey: string, seatId: string | null): void {
    if (!isStorageAvailable() || !sessionKey) return;
    try {
      if (seatId) {
        window.localStorage.setItem(`${SESSION_SEAT_PREFIX}${sessionKey}`, seatId);
      } else {
        window.localStorage.removeItem(`${SESSION_SEAT_PREFIX}${sessionKey}`);
      }
    } catch (err) {
      console.warn('SessionPreferencesService: Failed to save seat selection', err);
    }
  }

  /**
   * Checks if user has a recorded previous visit to this session in this browser.
   */
  public static hasPreviousVisit(sessionKey: string): boolean {
    if (!isStorageAvailable() || !sessionKey) return false;
    try {
      return window.localStorage.getItem(`${SESSION_VISIT_PREFIX}${sessionKey}`) !== null;
    } catch {
      return false;
    }
  }

  /**
   * Records a session visit timestamp and marks current turn IDs as seen.
   */
  public static recordSessionVisit(sessionKey: string, currentTurnIds: string[] = []): void {
    if (!isStorageAvailable() || !sessionKey) return;
    try {
      window.localStorage.setItem(`${SESSION_VISIT_PREFIX}${sessionKey}`, String(Date.now()));
      if (currentTurnIds.length > 0) {
        const existing = this.getSeenTurnIds(sessionKey);
        const merged = Array.from(new Set([...existing, ...currentTurnIds]));
        window.localStorage.setItem(`${SESSION_SEEN_TURNS_PREFIX}${sessionKey}`, JSON.stringify(merged));
      }
    } catch (err) {
      console.warn('SessionPreferencesService: Failed to record visit', err);
    }
  }

  /**
   * Retrieves list of seen turn IDs for session.
   */
  public static getSeenTurnIds(sessionKey: string): string[] {
    if (!isStorageAvailable() || !sessionKey) return [];
    try {
      const raw = window.localStorage.getItem(`${SESSION_SEEN_TURNS_PREFIX}${sessionKey}`);
      if (!raw) return [];
      return JSON.parse(raw);
    } catch {
      return [];
    }
  }

  /**
   * Retrieves or computes missed sample turns from browser state upon reload/return.
   */
  public static getMissedTurns(sessionKey: string, currentTurns: SessionTextTurn[] = []): SessionTextTurn[] {
    if (!isStorageAvailable() || !sessionKey) return [];
    try {
      // 1. Check for explicitly saved missed turns
      const rawStored = window.localStorage.getItem(`${SESSION_MISSED_TURNS_PREFIX}${sessionKey}`);
      if (rawStored) {
        const parsed = JSON.parse(rawStored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }

      // 2. If user had visited previously, identify turns not present in previously seen IDs
      const hasVisited = this.hasPreviousVisit(sessionKey);
      if (hasVisited) {
        const seenIds = new Set(this.getSeenTurnIds(sessionKey));
        if (seenIds.size > 0) {
          const missed = currentTurns.filter((t) => !seenIds.has(t.id));
          if (missed.length > 0) {
            return missed;
          }
        }
      }
    } catch (err) {
      console.warn('SessionPreferencesService: Failed to compute missed turns', err);
    }

    return [];
  }

  /**
   * Simulates or registers missed turns into browser state (useful for testing or demo walkthrough).
   */
  public static setStoredMissedTurns(sessionKey: string, turns: SessionTextTurn[]): void {
    if (!isStorageAvailable() || !sessionKey) return;
    try {
      window.localStorage.setItem(`${SESSION_MISSED_TURNS_PREFIX}${sessionKey}`, JSON.stringify(turns));
    } catch (err) {
      console.warn('SessionPreferencesService: Failed to store missed turns', err);
    }
  }

  /**
   * Clears stored missed turns once acknowledged or on reset.
   */
  public static clearMissedTurns(sessionKey: string): void {
    if (!isStorageAvailable() || !sessionKey) return;
    try {
      window.localStorage.removeItem(`${SESSION_MISSED_TURNS_PREFIX}${sessionKey}`);
    } catch {
      // noop
    }
  }
}
