// Enhanced LocalStorage management for Sync Multi-Chat Sessions (Codex / Gemini Style)

const SESSIONS_KEY = 'sync_chat_sessions_v2';
const THEME_KEY = 'sync_theme_preference_v1';
const ACTIVE_SESSION_KEY = 'sync_active_session_id_v1';

export function getStoredTheme() {
  return localStorage.getItem(THEME_KEY) || 'dark';
}

export function setStoredTheme(theme) {
  localStorage.setItem(THEME_KEY, theme);
}

export function getStoredActiveSessionId() {
  return localStorage.getItem(ACTIVE_SESSION_KEY) || null;
}

export function setStoredActiveSessionId(id) {
  if (id) {
    localStorage.setItem(ACTIVE_SESSION_KEY, id);
  } else {
    localStorage.removeItem(ACTIVE_SESSION_KEY);
  }
}

/**
 * Retrieves all saved chat sessions from LocalStorage.
 * Migrates v1 sessions if present.
 */
export function getAllSessions() {
  try {
    const data = localStorage.getItem(SESSIONS_KEY);
    if (data) {
      return JSON.parse(data);
    }

    // Check v1 data migration
    const v1Data = localStorage.getItem('sync_chat_sessions_v1');
    if (v1Data) {
      const parsedV1 = JSON.parse(v1Data);
      const migrated = parsedV1.map((s) => ({
        id: s.id || 'sess_' + Date.now() + Math.random().toString(36).substring(2, 6),
        title: s.title || '이전 대화 분석',
        createdAt: s.createdAt || new Date().toISOString(),
        updatedAt: s.updatedAt || new Date().toISOString(),
        pinned: false,
        messages: [
          {
            id: 'msg_user_' + Date.now(),
            role: 'user',
            text: s.rawText || '',
            timestamp: s.createdAt || new Date().toISOString()
          },
          {
            id: 'msg_assistant_' + Date.now(),
            role: 'assistant',
            text: '분석이 완료되었습니다.',
            resultData: {
              title: s.title,
              insights: s.insights,
              replies: s.replies,
              parsedMessages: s.parsedMessages
            },
            timestamp: s.updatedAt || new Date().toISOString()
          }
        ]
      }));
      localStorage.setItem(SESSIONS_KEY, JSON.stringify(migrated));
      localStorage.removeItem('sync_chat_sessions_v1');
      return migrated;
    }

    return [];
  } catch {
    console.error('Failed to load sessions from LocalStorage');
    return [];
  }
}

/**
 * Creates a brand new empty session object and prepends it to the sessions list.
 */
export function createNewSession(initialTitle = '새 대화') {
  const newSession = {
    id: 'sess_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
    title: initialTitle,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    pinned: false,
    messages: []
  };

  const sessions = getAllSessions();
  const updated = [newSession, ...sessions];
  try {
    localStorage.setItem(SESSIONS_KEY, JSON.stringify(updated));
    setStoredActiveSessionId(newSession.id);
  } catch {
    console.error('Failed to create new session');
  }
  return newSession;
}

/**
 * Saves or updates an entire session in LocalStorage.
 */
export function saveSession(session) {
  try {
    const sessions = getAllSessions();
    const existingIndex = sessions.findIndex((s) => s.id === session.id);

    let updated;
    const nowIso = new Date().toISOString();

    if (existingIndex >= 0) {
      updated = [...sessions];
      updated[existingIndex] = {
        ...updated[existingIndex],
        ...session,
        updatedAt: nowIso
      };
      // Move updated session to top
      const current = updated.splice(existingIndex, 1)[0];
      updated.unshift(current);
    } else {
      const completeSession = {
        id: session.id || 'sess_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
        title: session.title || '새 대화',
        createdAt: session.createdAt || nowIso,
        updatedAt: nowIso,
        pinned: session.pinned || false,
        messages: session.messages || []
      };
      updated = [completeSession, ...sessions];
    }

    localStorage.setItem(SESSIONS_KEY, JSON.stringify(updated));
    return updated;
  } catch {
    console.error('Failed to save session');
    return getAllSessions();
  }
}

/**
 * Appends a message to a session and updates its updatedAt timestamp.
 */
export function addMessageToSession(sessionId, message, autoTitle = null) {
  try {
    const sessions = getAllSessions();
    const target = sessions.find((s) => s.id === sessionId);

    const nowIso = new Date().toISOString();
    const formattedMessage = {
      id: message.id || 'msg_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
      role: message.role || 'user',
      text: message.text || '',
      resultData: message.resultData || null,
      timestamp: nowIso
    };

    if (target) {
      target.messages = [...(target.messages || []), formattedMessage];
      target.updatedAt = nowIso;
      if (autoTitle && (target.title === '새 대화' || !target.title)) {
        target.title = autoTitle;
      }
      return saveSession(target);
    } else {
      // Create session on the fly if not found
      const newSess = {
        id: sessionId || 'sess_' + Date.now(),
        title: autoTitle || '새 대화',
        createdAt: nowIso,
        updatedAt: nowIso,
        pinned: false,
        messages: [formattedMessage]
      };
      return saveSession(newSess);
    }
  } catch {
    console.error('Failed to add message to session');
    return getAllSessions();
  }
}

/**
 * Updates a session's title.
 */
export function updateSessionTitle(sessionId, newTitle) {
  const sessions = getAllSessions();
  const target = sessions.find((s) => s.id === sessionId);
  if (target) {
    target.title = newTitle.trim() || '이름 없는 대화';
    target.updatedAt = new Date().toISOString();
    return saveSession(target);
  }
  return sessions;
}

/**
 * Toggles the pinned status of a session.
 */
export function togglePinSession(sessionId) {
  const sessions = getAllSessions();
  const target = sessions.find((s) => s.id === sessionId);
  if (target) {
    target.pinned = !target.pinned;
    return saveSession(target);
  }
  return sessions;
}

/**
 * Retrieves a single session by ID.
 */
export function getSessionById(id) {
  const sessions = getAllSessions();
  return sessions.find((s) => s.id === id) || null;
}

/**
 * Deletes a session by ID.
 */
export function deleteSession(id) {
  const sessions = getAllSessions();
  const filtered = sessions.filter((s) => s.id !== id);
  localStorage.setItem(SESSIONS_KEY, JSON.stringify(filtered));
  if (getStoredActiveSessionId() === id) {
    setStoredActiveSessionId(filtered.length > 0 ? filtered[0].id : null);
  }
  return filtered;
}

/**
 * Clears all sessions from LocalStorage.
 */
export function clearAllSessions() {
  localStorage.removeItem(SESSIONS_KEY);
  localStorage.removeItem('sync_chat_sessions_v1');
  setStoredActiveSessionId(null);
}

/**
 * Groups sessions by relative date (오늘, 어제, 지난 7일, 지난 30일, 이전).
 */
export function groupSessionsByDate(sessions) {
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const yesterdayStart = todayStart - 24 * 60 * 60 * 1000;
  const sevenDaysAgo = todayStart - 7 * 24 * 60 * 60 * 1000;
  const thirtyDaysAgo = todayStart - 30 * 24 * 60 * 60 * 1000;

  const groups = {
    pinned: [],
    today: [],
    yesterday: [],
    last7Days: [],
    last30Days: [],
    older: []
  };

  sessions.forEach((s) => {
    if (s.pinned) {
      groups.pinned.push(s);
      return;
    }

    const itemTime = new Date(s.updatedAt || s.createdAt || Date.now()).getTime();

    if (itemTime >= todayStart) {
      groups.today.push(s);
    } else if (itemTime >= yesterdayStart) {
      groups.yesterday.push(s);
    } else if (itemTime >= sevenDaysAgo) {
      groups.last7Days.push(s);
    } else if (itemTime >= thirtyDaysAgo) {
      groups.last30Days.push(s);
    } else {
      groups.older.push(s);
    }
  });

  return groups;
}
