import React, { useState, useEffect, useCallback } from 'react';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import ChatWorkspace from './components/ChatWorkspace';
import LiveSimulatorModal from './components/LiveSimulatorModal';
import {
  getStoredTheme,
  setStoredTheme,
  getAllSessions,
  createNewSession,
  getStoredActiveSessionId,
  setStoredActiveSessionId
} from './services/storageService';

function App() {
  const [theme, setTheme] = useState(getStoredTheme());
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [sessions, setSessions] = useState([]);
  const [activeSessionId, setActiveSessionId] = useState(null);
  const [prefilledPrompt, setPrefilledPrompt] = useState(null);
  const [showLiveSimulator, setShowLiveSimulator] = useState(false);

  // Initialize theme
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    setStoredTheme(theme);
  }, [theme]);

  // Load all sessions from LocalStorage on mount
  const refreshSessions = useCallback(() => {
    const loaded = getAllSessions();
    setSessions(loaded);

    const storedActiveId = getStoredActiveSessionId();
    if (storedActiveId && loaded.some((s) => s.id === storedActiveId)) {
      setActiveSessionId(storedActiveId);
    } else if (loaded.length > 0) {
      setActiveSessionId(loaded[0].id);
      setStoredActiveSessionId(loaded[0].id);
    } else {
      // Auto create the very first session
      const newSess = createNewSession('새 대화');
      setSessions([newSess]);
      setActiveSessionId(newSess.id);
    }
  }, []);

  useEffect(() => {
    refreshSessions();
  }, [refreshSessions]);

  const handleToggleTheme = (newTheme) => {
    setTheme(newTheme);
  };

  const handleSelectSession = (session) => {
    setActiveSessionId(session.id);
    setStoredActiveSessionId(session.id);
  };

  const handleNewChat = () => {
    const currentSession = sessions.find((s) => s.id === activeSessionId);
    if (currentSession && currentSession.messages?.length === 0) {
      return; // Already on an empty new chat
    }

    const newSess = createNewSession('새 대화');
    setSessions((prev) => [newSess, ...prev]);
    setActiveSessionId(newSess.id);
  };

  const handleSelectSituation = (situationText) => {
    // If current session is not empty, create a new session
    const currentSession = sessions.find((s) => s.id === activeSessionId);
    if (currentSession && currentSession.messages?.length > 0) {
      const newSess = createNewSession('새 대화');
      setSessions((prev) => [newSess, ...prev]);
      setActiveSessionId(newSess.id);
    }
    setPrefilledPrompt(situationText);
  };

  const activeSession = sessions.find((s) => s.id === activeSessionId) || sessions[0] || null;

  return (
    <div className="app-container">
      {/* Sync Sidebar Panel */}
      <Sidebar
        isOpen={sidebarOpen}
        onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
        sessions={sessions}
        activeSessionId={activeSessionId}
        onSelectSession={handleSelectSession}
        onNewChat={handleNewChat}
        onSelectSituation={handleSelectSituation}
        onOpenLiveSimulator={() => setShowLiveSimulator(true)}
        theme={theme}
        onToggleTheme={handleToggleTheme}
        onRefreshSessions={refreshSessions}
      />

      {/* Main Workspace (Header + Chat Workspace) */}
      <div className="workspace-main">
        <Header
          sidebarOpen={sidebarOpen}
          onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
          activeSession={activeSession}
          onNewChat={handleNewChat}
          onOpenLiveSimulator={() => setShowLiveSimulator(true)}
          theme={theme}
          onToggleTheme={handleToggleTheme}
          onRefreshSessions={refreshSessions}
        />

        {activeSession && (
          <ChatWorkspace
            key={activeSession.id}
            activeSession={activeSession}
            onRefreshSessions={refreshSessions}
            prefilledPrompt={prefilledPrompt}
            onClearPrefilledPrompt={() => setPrefilledPrompt(null)}
            onOpenLiveSimulator={() => setShowLiveSimulator(true)}
          />
        )}
      </div>

      {/* Global Live Kakao Simulator Modal */}
      <LiveSimulatorModal
        isOpen={showLiveSimulator}
        onClose={() => setShowLiveSimulator(false)}
      />
    </div>
  );
}

export default App;
