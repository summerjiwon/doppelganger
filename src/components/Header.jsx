import React, { useState } from 'react';
import { PanelLeft, Sparkles, Sun, Moon, Plus, Edit2, Check, X, Radio } from 'lucide-react';
import { updateSessionTitle } from '../services/storageService';

export default function Header({
  sidebarOpen,
  onToggleSidebar,
  activeSession,
  onNewChat,
  onOpenLiveSimulator,
  theme,
  onToggleTheme,
  onRefreshSessions
}) {
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [titleInput, setTitleInput] = useState('');

  const handleStartEdit = () => {
    setTitleInput(activeSession?.title || '새 대화');
    setIsEditingTitle(true);
  };

  const handleSaveTitle = () => {
    if (activeSession && titleInput.trim()) {
      updateSessionTitle(activeSession.id, titleInput.trim());
      onRefreshSessions();
    }
    setIsEditingTitle(false);
  };

  return (
    <header style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '12px 18px',
      borderBottom: '1px solid var(--color-border)',
      background: 'var(--color-surface)',
      position: 'sticky',
      top: 0,
      zIndex: 20,
      backdropFilter: 'blur(12px)'
    }}>
      {/* Left side: Sidebar Toggle & Session Info */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
        <button
          onClick={onToggleSidebar}
          className="gemini-btn-icon"
          title={sidebarOpen ? '사이드바 접기' : '사이드바 열기'}
          style={{ padding: '6px' }}
        >
          <PanelLeft size={20} />
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflow: 'hidden' }}>
          <div style={{
            width: '26px',
            height: '26px',
            borderRadius: '6px',
            background: 'var(--gemini-gradient)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0
          }}>
            <Sparkles size={14} color="#ffffff" />
          </div>

          <span style={{ fontSize: '1.05rem', fontWeight: 800, letterSpacing: '-0.02em', flexShrink: 0 }}>
            Sync
          </span>

          {activeSession && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', overflow: 'hidden' }}>
              <span style={{ color: 'var(--color-text-dim)', fontSize: '0.8rem' }}>/</span>
              {isEditingTitle ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <input
                    type="text"
                    value={titleInput}
                    onChange={(e) => setTitleInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleSaveTitle();
                      if (e.key === 'Escape') setIsEditingTitle(false);
                    }}
                    autoFocus
                    style={{
                      background: 'var(--color-bg-base)',
                      border: '1px solid #4285f4',
                      borderRadius: '4px',
                      padding: '2px 8px',
                      fontSize: '0.84rem',
                      color: 'var(--color-text-main)',
                      outline: 'none'
                    }}
                  />
                  <button onClick={handleSaveTitle} style={{ background: 'none', border: 'none', color: '#10b981', cursor: 'pointer' }}>
                    <Check size={14} />
                  </button>
                  <button onClick={() => setIsEditingTitle(false)} style={{ background: 'none', border: 'none', color: 'var(--color-text-dim)', cursor: 'pointer' }}>
                    <X size={14} />
                  </button>
                </div>
              ) : (
                <div
                  onClick={handleStartEdit}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    fontSize: '0.84rem',
                    padding: '3px 8px',
                    borderRadius: 'var(--radius-pill)',
                    background: 'var(--color-surface-hover)',
                    color: 'var(--color-text-muted)',
                    cursor: 'pointer',
                    maxWidth: '220px',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap'
                  }}
                  title="제목 클릭하여 변경"
                >
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {activeSession.title || '새 대화'}
                  </span>
                  <Edit2 size={12} color="var(--color-text-dim)" style={{ flexShrink: 0 }} />
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Right side: Live Simulator, Quick New Chat & Theme Switcher */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <button
          onClick={onOpenLiveSimulator}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '5px',
            padding: '6px 12px',
            borderRadius: 'var(--radius-pill)',
            background: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid rgba(239, 68, 68, 0.25)',
            fontSize: '0.8rem',
            fontWeight: 700,
            color: '#ef4444',
            cursor: 'pointer',
            transition: 'all 0.15s ease'
          }}
          title="상대방과 실시간으로 톡을 주고받으며 라이브 코칭 받기"
        >
          <Radio size={13} className="gemini-sparkle-anim" />
          <span>실시간 모의 카톡</span>
        </button>

        <button
          onClick={onNewChat}
          className="gemini-btn-secondary"
          style={{ padding: '6px 12px', fontSize: '0.82rem', gap: '4px' }}
          title="새 대화 분석 시작"
        >
          <Plus size={15} color="#4285f4" />
          <span>새 대화 분석</span>
        </button>

        <button
          onClick={() => onToggleTheme(theme === 'dark' ? 'light' : 'dark')}
          className="gemini-btn-icon"
          title={theme === 'dark' ? '화이트 모드로 전환' : '블랙 모드로 전환'}
          style={{ padding: '7px' }}
        >
          {theme === 'dark' ? <Sun size={18} color="#fbbc05" /> : <Moon size={18} color="#4285f4" />}
        </button>
      </div>
    </header>
  );
}
