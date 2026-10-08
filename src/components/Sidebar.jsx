import React, { useState } from 'react';
import {
  Sparkles,
  Edit3,
  Search,
  BookOpen,
  Layers,
  Diamond,
  Plus,
  Trash2,
  Moon,
  Sun,
  X,
  MessageSquare,
  PanelLeftClose,
  Pin,
  Check,
  Edit2,
  ArrowRight,
  Radio
} from 'lucide-react';
import {
  deleteSession,
  updateSessionTitle,
  togglePinSession,
  groupSessionsByDate
} from '../services/storageService';
import { SITUATIONS, SITUATION_CATEGORIES } from '../data/situationsData';

export default function Sidebar({
  isOpen,
  onToggleSidebar,
  sessions,
  activeSessionId,
  onSelectSession,
  onNewChat,
  onSelectSituation,
  onOpenLiveSimulator,
  theme,
  onToggleTheme,
  onRefreshSessions
}) {
  const [activeTab, setActiveTab] = useState('chat'); // 'chat' | 'coach'
  const [searchQuery, setSearchQuery] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editTitleInput, setEditTitleInput] = useState('');
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [showTemplatesModal, setShowTemplatesModal] = useState(false);
  const [selectedTemplateCat, setSelectedTemplateCat] = useState('all');
  const [infoModalContent, setInfoModalContent] = useState(null);

  const grouped = groupSessionsByDate(sessions);

  const filteredSessions = sessions.filter((s) => {
    const titleMatch = (s.title || '').toLowerCase().includes(searchQuery.toLowerCase());
    const messageMatch = (s.messages || []).some(m => (m.text || '').toLowerCase().includes(searchQuery.toLowerCase()));
    return titleMatch || messageMatch;
  });

  const handleDelete = (e, id) => {
    e.stopPropagation();
    deleteSession(id);
    onRefreshSessions();
    if (activeSessionId === id) {
      onNewChat();
    }
  };

  const handleStartRename = (e, sess) => {
    e.stopPropagation();
    setEditingId(sess.id);
    setEditTitleInput(sess.title || '새 대화');
  };

  const handleSaveRename = (e, id) => {
    e?.stopPropagation();
    if (editTitleInput.trim()) {
      updateSessionTitle(id, editTitleInput.trim());
      onRefreshSessions();
    }
    setEditingId(null);
  };

  const handleTogglePin = (e, id) => {
    e.stopPropagation();
    togglePinSession(id);
    onRefreshSessions();
  };

  const handleMenuClick = (menuName, description) => {
    setInfoModalContent({ title: menuName, description });
  };

  const renderSessionItem = (sess) => {
    const isActive = activeSessionId === sess.id;
    const isEditing = editingId === sess.id;

    return (
      <div
        key={sess.id}
        onClick={() => {
          if (!isEditing) {
            onSelectSession(sess);
          }
        }}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '8px 12px',
          borderRadius: 'var(--radius-md)',
          background: isActive ? 'var(--color-surface-active)' : 'transparent',
          border: isActive ? '1px solid var(--color-border)' : '1px solid transparent',
          cursor: 'pointer',
          transition: 'all 0.15s ease',
          position: 'relative'
        }}
        onMouseOver={(e) => {
          if (!isActive) e.currentTarget.style.background = 'var(--color-surface-hover)';
        }}
        onMouseOut={(e) => {
          if (!isActive) e.currentTarget.style.background = 'transparent';
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflow: 'hidden', flex: 1 }}>
          <MessageSquare
            size={15}
            color={isActive ? '#4285f4' : 'var(--color-text-dim)'}
            style={{ flexShrink: 0 }}
          />

          {isEditing ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flex: 1 }} onClick={(e) => e.stopPropagation()}>
              <input
                type="text"
                value={editTitleInput}
                onChange={(e) => setEditTitleInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSaveRename(e, sess.id);
                  if (e.key === 'Escape') setEditingId(null);
                }}
                autoFocus
                style={{
                  width: '100%',
                  background: 'var(--color-surface)',
                  border: '1px solid #4285f4',
                  borderRadius: '4px',
                  padding: '2px 6px',
                  fontSize: '0.84rem',
                  color: 'var(--color-text-main)',
                  outline: 'none'
                }}
              />
              <button
                onClick={(e) => handleSaveRename(e, sess.id)}
                style={{ background: 'none', border: 'none', color: '#10b981', cursor: 'pointer', padding: '2px' }}
              >
                <Check size={14} />
              </button>
            </div>
          ) : (
            <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: '0.86rem', fontWeight: isActive ? 600 : 400, color: isActive ? 'var(--color-text-main)' : 'var(--color-text-muted)' }}>
              {sess.pinned && <span style={{ color: '#4285f4', marginRight: '4px' }}>📌</span>}
              {sess.title || '대화 분석'}
            </div>
          )}
        </div>

        {!isEditing && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '2px', opacity: isActive ? 1 : 0.7 }}>
            <button
              onClick={(e) => handleStartRename(e, sess)}
              style={{ background: 'none', border: 'none', color: 'var(--color-text-dim)', cursor: 'pointer', padding: '3px', borderRadius: '4px' }}
              title="이름 변경"
            >
              <Edit2 size={13} />
            </button>
            <button
              onClick={(e) => handleTogglePin(e, sess.id)}
              style={{ background: 'none', border: 'none', color: sess.pinned ? '#4285f4' : 'var(--color-text-dim)', cursor: 'pointer', padding: '3px', borderRadius: '4px' }}
              title={sess.pinned ? '고정 해제' : '상단 고정'}
            >
              <Pin size={13} />
            </button>
            <button
              onClick={(e) => handleDelete(e, sess.id)}
              style={{ background: 'none', border: 'none', color: 'var(--color-text-dim)', cursor: 'pointer', padding: '3px', borderRadius: '4px' }}
              title="삭제"
            >
              <Trash2 size={13} />
            </button>
          </div>
        )}
      </div>
    );
  };

  const filteredTemplates = selectedTemplateCat === 'all'
    ? SITUATIONS
    : SITUATIONS.filter(s => s.category === selectedTemplateCat);

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          onClick={onToggleSidebar}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.5)',
            backdropFilter: 'blur(4px)',
            zIndex: 49
          }}
          className="mobile-backdrop"
        />
      )}

      {/* Sidebar Panel */}
      <aside className={`gemini-sidebar ${isOpen ? 'mobile-open' : 'collapsed'}`}>
        {/* Top Header: Sync Logo + Collapse Icon */}
        <div style={{ padding: '16px 16px 12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{
              width: '30px',
              height: '30px',
              borderRadius: '8px',
              background: 'var(--gemini-gradient)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: 'var(--gemini-glow)'
            }}>
              <Sparkles size={16} color="#ffffff" />
            </div>
            <div>
              <span style={{ fontSize: '1.25rem', fontWeight: 800, letterSpacing: '-0.03em', color: 'var(--color-text-main)' }}>
                Sync
              </span>
              <span style={{ fontSize: '0.68rem', marginLeft: '6px', color: '#4285f4', fontWeight: 700, background: 'rgba(66,133,244,0.12)', padding: '1px 5px', borderRadius: '4px' }}>
                AI 코치
              </span>
            </div>
          </div>

          <button
            onClick={onToggleSidebar}
            className="gemini-btn-icon"
            title="사이드바 접기"
            style={{ padding: '6px' }}
          >
            <PanelLeftClose size={20} />
          </button>
        </div>

        {/* Tab Switcher: 대화 분석 | 상황별 코칭 */}
        <div style={{ padding: '0 14px 10px' }}>
          <div style={{
            background: 'var(--color-surface)',
            borderRadius: 'var(--radius-pill)',
            padding: '3px',
            display: 'flex',
            border: '1px solid var(--color-border)'
          }}>
            <button
              onClick={() => setActiveTab('chat')}
              style={{
                flex: 1,
                padding: '7px 0',
                borderRadius: 'var(--radius-pill)',
                border: 'none',
                background: activeTab === 'chat' ? 'var(--color-surface-hover)' : 'transparent',
                color: activeTab === 'chat' ? 'var(--color-text-main)' : 'var(--color-text-dim)',
                fontSize: '0.84rem',
                fontWeight: activeTab === 'chat' ? 700 : 500,
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
            >
              대화 분석
            </button>
            <button
              onClick={() => {
                setActiveTab('coach');
                setShowTemplatesModal(true);
              }}
              style={{
                flex: 1,
                padding: '7px 0',
                borderRadius: 'var(--radius-pill)',
                border: 'none',
                background: activeTab === 'coach' ? 'var(--color-surface-hover)' : 'transparent',
                color: activeTab === 'coach' ? 'var(--color-text-main)' : 'var(--color-text-dim)',
                fontSize: '0.84rem',
                fontWeight: activeTab === 'coach' ? 700 : 500,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '4px',
                transition: 'all 0.15s ease'
              }}
            >
              상황별 코칭 <span style={{ fontSize: '0.68rem', padding: '1px 4px', background: 'rgba(66,133,244,0.15)', color: '#4285f4', borderRadius: '4px', fontWeight: 700 }}>18+</span>
            </button>
          </div>
        </div>

        {/* Main Action Menu */}
        <div style={{ padding: '0 10px 10px', display: 'flex', flexDirection: 'column', gap: '2px' }}>
          {/* 새 대화 분석 Button */}
          <button
            onClick={onNewChat}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '10px 14px',
              borderRadius: 'var(--radius-md)',
              border: 'none',
              background: 'transparent',
              color: 'var(--color-text-main)',
              fontWeight: 600,
              fontSize: '0.92rem',
              cursor: 'pointer',
              textAlign: 'left',
              transition: 'background 0.15s ease'
            }}
            onMouseOver={(e) => e.currentTarget.style.background = 'var(--color-surface-hover)'}
            onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}
          >
            <Edit3 size={18} color="#4285f4" />
            새 대화 분석
          </button>

          {/* 실시간 모의 카톡 Button */}
          <button
            onClick={onOpenLiveSimulator}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '9px 14px',
              borderRadius: 'var(--radius-md)',
              border: 'none',
              background: 'rgba(239, 68, 68, 0.08)',
              color: '#ef4444',
              fontWeight: 700,
              fontSize: '0.88rem',
              cursor: 'pointer',
              textAlign: 'left',
              transition: 'all 0.15s ease',
              marginBottom: '2px'
            }}
            onMouseOver={(e) => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.16)'}
            onMouseOut={(e) => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.08)'}
          >
            <Radio size={17} className="gemini-sparkle-anim" />
            실시간 모의 카톡
          </button>

          {/* 대화 검색 */}
          <button
            onClick={() => setShowSearchModal(true)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '9px 14px',
              borderRadius: 'var(--radius-md)',
              border: 'none',
              background: 'transparent',
              color: 'var(--color-text-muted)',
              fontSize: '0.88rem',
              cursor: 'pointer',
              textAlign: 'left'
            }}
            onMouseOver={(e) => e.currentTarget.style.background = 'var(--color-surface-hover)'}
            onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}
          >
            <Search size={18} />
            대화 검색
          </button>

          {/* 상황별 템플릿 모음 (18+ 시나리오) */}
          <button
            onClick={() => setShowTemplatesModal(true)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '9px 14px',
              borderRadius: 'var(--radius-md)',
              border: 'none',
              background: 'transparent',
              color: 'var(--color-text-muted)',
              fontSize: '0.88rem',
              cursor: 'pointer',
              textAlign: 'left'
            }}
            onMouseOver={(e) => e.currentTarget.style.background = 'var(--color-surface-hover)'}
            onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}
          >
            <BookOpen size={18} color="#ec4899" />
            상황별 템플릿 (18종)
          </button>

          {/* Sync 페르소나 (Gems) */}
          <button
            onClick={() => handleMenuClick('Sync 맞춤 페르소나 (Gems)', '💖 다정·공감형, 💼 프로·비즈니스형, ⚡ 위트·센스형, 🧊 칼답·쿨톤형 등 원하는 소통 톤앤매너로 답변을 생성할 수 있습니다.')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '9px 14px',
              borderRadius: 'var(--radius-md)',
              border: 'none',
              background: 'transparent',
              color: 'var(--color-text-muted)',
              fontSize: '0.88rem',
              cursor: 'pointer',
              textAlign: 'left'
            }}
            onMouseOver={(e) => e.currentTarget.style.background = 'var(--color-surface-hover)'}
            onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}
          >
            <Diamond size={18} color="#eab308" />
            Sync 페르소나
          </button>

          {/* 저장된 대사 보관함 (라이브러리) */}
          <button
            onClick={() => handleMenuClick('저장된 대사 보관함', '분석 중 마음에 들었던 멘트와 전략을 스크랩하여 언제든 빠르게 찾아볼 수 있습니다.')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '9px 14px',
              borderRadius: 'var(--radius-md)',
              border: 'none',
              background: 'transparent',
              color: 'var(--color-text-muted)',
              fontSize: '0.88rem',
              cursor: 'pointer',
              textAlign: 'left'
            }}
            onMouseOver={(e) => e.currentTarget.style.background = 'var(--color-surface-hover)'}
            onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}
          >
            <Layers size={18} color="#10b981" />
            대사 보관함
          </button>
        </div>

        {/* Notebook Group (소통 리포트) */}
        <div style={{ padding: '8px 14px 4px', borderTop: '1px solid var(--color-border-subtle)' }}>
          <div style={{ fontSize: '0.76rem', fontWeight: 700, color: 'var(--color-text-dim)', marginBottom: '4px' }}>
            소통 리포트 & 메모
          </div>
          <button
            onClick={() => handleMenuClick('새 소통 메모', '대화 분석 결과와 관계 피드백 노트를 기록할 수 있는 작업 공간입니다.')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: '8px 10px',
              borderRadius: 'var(--radius-md)',
              border: 'none',
              background: 'transparent',
              color: 'var(--color-text-muted)',
              fontSize: '0.86rem',
              cursor: 'pointer',
              width: '100%',
              textAlign: 'left'
            }}
            onMouseOver={(e) => e.currentTarget.style.background = 'var(--color-surface-hover)'}
            onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}
          >
            <Plus size={16} />
            새 메모 작성
          </button>
        </div>

        {/* Recent Conversations Section (최근) */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '10px 10px 16px', borderTop: '1px solid var(--color-border-subtle)' }}>
          <div style={{ fontSize: '0.76rem', fontWeight: 700, color: 'var(--color-text-dim)', padding: '0 8px 8px' }}>
            최근 분석 ({sessions.length})
          </div>

          {sessions.length === 0 ? (
            <div style={{ padding: '20px 10px', textAlign: 'center', color: 'var(--color-text-dim)', fontSize: '0.82rem', lineHeight: '1.5' }}>
              보관된 대화가 없습니다.<br />대화를 분석하면 자동 저장됩니다.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
              {/* Pinned Items */}
              {grouped.pinned.length > 0 && (
                <div style={{ marginBottom: '8px' }}>
                  <div style={{ fontSize: '0.72rem', color: '#4285f4', padding: '2px 8px 4px', fontWeight: 700 }}>고정된 대화</div>
                  {grouped.pinned.map(renderSessionItem)}
                </div>
              )}

              {/* Today Items */}
              {grouped.today.length > 0 && (
                <div style={{ marginBottom: '6px' }}>
                  <div style={{ fontSize: '0.72rem', color: 'var(--color-text-dim)', padding: '2px 8px 4px', fontWeight: 600 }}>오늘</div>
                  {grouped.today.map(renderSessionItem)}
                </div>
              )}

              {/* Yesterday Items */}
              {grouped.yesterday.length > 0 && (
                <div style={{ marginBottom: '6px' }}>
                  <div style={{ fontSize: '0.72rem', color: 'var(--color-text-dim)', padding: '2px 8px 4px', fontWeight: 600 }}>어제</div>
                  {grouped.yesterday.map(renderSessionItem)}
                </div>
              )}

              {/* Last 7 Days */}
              {grouped.last7Days.length > 0 && (
                <div style={{ marginBottom: '6px' }}>
                  <div style={{ fontSize: '0.72rem', color: 'var(--color-text-dim)', padding: '2px 8px 4px', fontWeight: 600 }}>지난 7일</div>
                  {grouped.last7Days.map(renderSessionItem)}
                </div>
              )}

              {/* Older */}
              {(grouped.last30Days.length > 0 || grouped.older.length > 0) && (
                <div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--color-text-dim)', padding: '2px 8px 4px', fontWeight: 600 }}>이전 대화</div>
                  {[...grouped.last30Days, ...grouped.older].map(renderSessionItem)}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Bottom Theme Switcher (블랙 / 화이트) */}
        <div style={{
          padding: '12px 14px',
          borderTop: '1px solid var(--color-border)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'var(--color-surface)'
        }}>
          <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-text-dim)' }}>
            테마 모드
          </span>

          <div style={{
            display: 'flex',
            background: 'var(--color-bg-sidebar)',
            borderRadius: 'var(--radius-pill)',
            padding: '2px',
            border: '1px solid var(--color-border)'
          }}>
            <button
              onClick={() => onToggleTheme('light')}
              style={{
                padding: '5px 8px',
                borderRadius: 'var(--radius-pill)',
                border: 'none',
                background: theme === 'light' ? '#ffffff' : 'transparent',
                color: theme === 'light' ? '#0f172a' : 'var(--color-text-dim)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                fontSize: '0.76rem',
                fontWeight: theme === 'light' ? 700 : 500,
                boxShadow: theme === 'light' ? '0 1px 4px rgba(0,0,0,0.1)' : 'none'
              }}
            >
              <Sun size={13} /> 화이트
            </button>
            <button
              onClick={() => onToggleTheme('dark')}
              style={{
                padding: '5px 8px',
                borderRadius: 'var(--radius-pill)',
                border: 'none',
                background: theme === 'dark' ? '#1e1f20' : 'transparent',
                color: theme === 'dark' ? '#f1f3f4' : 'var(--color-text-dim)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                fontSize: '0.76rem',
                fontWeight: theme === 'dark' ? 700 : 500,
                boxShadow: theme === 'dark' ? '0 1px 4px rgba(0,0,0,0.3)' : 'none'
              }}
            >
              <Moon size={13} /> 블랙
            </button>
          </div>
        </div>
      </aside>

      {/* 상황별 템플릿 모음 (18종 모달) */}
      {showTemplatesModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.65)',
          backdropFilter: 'blur(6px)',
          zIndex: 1000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '24px 20px'
        }}>
          <div className="gemini-card animate-fade-in" style={{ maxWidth: '780px', width: '100%', maxHeight: '85vh', display: 'flex', flexDirection: 'column', padding: '24px', position: 'relative' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <BookOpen size={22} color="#ec4899" />
                <div>
                  <h3 style={{ fontSize: '1.2rem', fontWeight: 800 }}>Sync 상황별 대화 템플릿 모음</h3>
                  <span style={{ fontSize: '0.8rem', color: 'var(--color-text-dim)' }}>원하는 상황을 클릭하면 대화창에 바로 입력되어 분석을 시작합니다.</span>
                </div>
              </div>
              <button
                onClick={() => setShowTemplatesModal(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-dim)' }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Category Filter Chips (Clean No-Glitch Pills) */}
            <div className="category-pill-container" style={{ marginBottom: '14px' }}>
              {SITUATION_CATEGORIES.map((cat) => {
                const isActive = selectedTemplateCat === cat.id;
                return (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedTemplateCat(cat.id)}
                    className={`category-pill-btn ${isActive ? 'active' : ''}`}
                  >
                    {cat.label}
                  </button>
                );
              })}
            </div>

            {/* Scenarios Grid */}
            <div style={{ flex: 1, overflowY: 'auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '12px', paddingRight: '4px' }}>
              {filteredTemplates.map((item) => (
                <div
                  key={item.id}
                  onClick={() => {
                    if (onSelectSituation) {
                      onSelectSituation(item.text);
                    }
                    setShowTemplatesModal(false);
                  }}
                  style={{
                    padding: '14px 16px',
                    borderRadius: 'var(--radius-md)',
                    background: 'var(--color-surface-hover)',
                    border: '1px solid var(--color-border)',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    gap: '8px',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.borderColor = '#4285f4';
                    e.currentTarget.style.transform = 'translateY(-2px)';
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.borderColor = 'var(--color-border)';
                    e.currentTarget.style.transform = 'translateY(0)';
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                      <span style={{ fontSize: '0.74rem', color: '#4285f4', fontWeight: 700 }}>
                        {item.categoryName}
                      </span>
                      <span style={{ fontSize: '0.72rem', color: 'var(--color-text-dim)' }}>
                        {item.badge}
                      </span>
                    </div>
                    <h4 style={{ fontSize: '0.94rem', fontWeight: 700, color: 'var(--color-text-main)', marginBottom: '4px' }}>
                      {item.title}
                    </h4>
                    <p style={{ fontSize: '0.82rem', color: 'var(--color-text-muted)', lineHeight: '1.4' }}>
                      {item.description}
                    </p>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.78rem', color: '#4285f4', fontWeight: 600, marginTop: '4px' }}>
                    <span>이 상황으로 분석하기</span>
                    <ArrowRight size={14} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Interactive Search Modal */}
      {showSearchModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.65)',
          backdropFilter: 'blur(6px)',
          zIndex: 1000,
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'center',
          padding: '60px 20px 20px'
        }}>
          <div className="gemini-card animate-fade-in" style={{ maxWidth: '520px', width: '100%', padding: '20px', position: 'relative' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Search size={18} color="#4285f4" />
                <h3 style={{ fontSize: '1.05rem', fontWeight: 700 }}>보관된 대화 검색</h3>
              </div>
              <button
                onClick={() => setShowSearchModal(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-dim)' }}
              >
                <X size={18} />
              </button>
            </div>

            <input
              type="text"
              placeholder="대화 제목이나 대사 내용을 입력하세요..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              autoFocus
              style={{
                width: '100%',
                padding: '12px 14px',
                borderRadius: 'var(--radius-md)',
                background: 'var(--color-bg-base)',
                border: '1px solid var(--color-border)',
                color: 'var(--color-text-main)',
                fontSize: '0.94rem',
                outline: 'none',
                marginBottom: '16px'
              }}
            />

            <div style={{ maxHeight: '300px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {filteredSessions.length === 0 ? (
                <div style={{ textAlign: 'center', color: 'var(--color-text-dim)', padding: '20px' }}>
                  일치하는 대화가 없습니다.
                </div>
              ) : (
                filteredSessions.map((sess) => (
                  <div
                    key={sess.id}
                    onClick={() => {
                      onSelectSession(sess);
                      setShowSearchModal(false);
                    }}
                    style={{
                      padding: '10px 12px',
                      borderRadius: 'var(--radius-sm)',
                      background: 'var(--color-surface-hover)',
                      cursor: 'pointer',
                      border: '1px solid var(--color-border)'
                    }}
                  >
                    <div style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--color-text-main)' }}>
                      {sess.title}
                    </div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--color-text-dim)', marginTop: '2px' }}>
                      {new Date(sess.updatedAt || sess.createdAt).toLocaleString()} · {sess.messages?.length || 0}개 메시지
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Info / Placeholder Modal */}
      {infoModalContent && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.6)',
          backdropFilter: 'blur(4px)',
          zIndex: 1000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px'
        }}>
          <div className="gemini-card animate-fade-in" style={{ maxWidth: '420px', width: '100%', padding: '24px' }}>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '8px' }}>{infoModalContent.title}</h3>
            <p style={{ fontSize: '0.92rem', color: 'var(--color-text-muted)', lineHeight: '1.55', marginBottom: '20px' }}>
              {infoModalContent.description}
            </p>
            <button
              className="gemini-btn-primary"
              onClick={() => setInfoModalContent(null)}
              style={{ width: '100%' }}
            >
              확인
            </button>
          </div>
        </div>
      )}
    </>
  );
}
