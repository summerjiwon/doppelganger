import React, { useState, useRef, useEffect } from 'react';
import {
  Sparkles,
  Send,
  Clipboard,
  X,
  Copy,
  Check,
  Eye,
  ShieldCheck,
  MessageSquare,
  ChevronDown,
  ChevronUp,
  Lightbulb,
  RefreshCw,
  ArrowRight,
  BookOpen,
  Radio,
  FileText,
  UploadCloud
} from 'lucide-react';
import { analyzeConversation } from '../services/aiService';
import { addMessageToSession } from '../services/storageService';
import { copyTextToClipboard, readTextFromClipboard } from '../services/clipboardService';
import { SITUATIONS, SITUATION_CATEGORIES } from '../data/situationsData';
import LiveSimulatorModal from './LiveSimulatorModal';

export default function ChatWorkspace({
  activeSession,
  onRefreshSessions,
  prefilledPrompt,
  onClearPrefilledPrompt
}) {
  const [inputText, setInputText] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [isTemplatesOpen, setIsTemplatesOpen] = useState(true); // Collapsible templates toggle
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatingStep, setGeneratingStep] = useState('');
  const [copiedId, setCopiedId] = useState(null);
  const [previewId, setPreviewId] = useState(null);
  const [expandedFlows, setExpandedFlows] = useState({});
  const [toastMessage, setToastMessage] = useState(null);
  const [showPrivacy, setShowPrivacy] = useState(false);
  const [showLiveSimulator, setShowLiveSimulator] = useState(false);
  const [isDraggingFile, setIsDraggingFile] = useState(false);

  const scrollRef = useRef(null);
  const textareaRef = useRef(null);

  // Handle prefilled prompt passed from sidebar template click
  useEffect(() => {
    if (prefilledPrompt) {
      setInputText(prefilledPrompt);
      if (onClearPrefilledPrompt) onClearPrefilledPrompt();
      textareaRef.current?.focus();
    }
  }, [prefilledPrompt, onClearPrefilledPrompt]);

  // Auto-scroll to bottom on new messages or generation
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [activeSession?.messages, isGenerating, generatingStep]);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2500);
  };

  const handlePaste = async () => {
    const clip = await readTextFromClipboard();
    if (clip && clip.trim().length > 0) {
      setInputText(clip.slice(0, 2500));
      showToast('클립보드 내용이 붙여넣어졌습니다.');
      textareaRef.current?.focus();
    } else {
      textareaRef.current?.focus();
      showToast('Ctrl + V (또는 Cmd + V)를 눌러 바로 붙여넣으세요!');
    }
  };

  const handleCopy = async (id, text) => {
    const success = await copyTextToClipboard(text);
    if (success) {
      setCopiedId(id);
      showToast('클립보드에 복사되었습니다! 카톡에 바로 붙여넣으세요.');
      setTimeout(() => setCopiedId(null), 2500);
    } else {
      showToast('복사에 실패했습니다. 텍스트를 직접 선택해 복사해주세요.');
    }
  };

  const toggleChatFlow = (msgId) => {
    setExpandedFlows(prev => ({
      ...prev,
      [msgId]: !prev[msgId]
    }));
  };

  const handleSend = async (customPrompt = null) => {
    const textToSend = customPrompt || inputText;
    if (!textToSend.trim() || isGenerating) return;

    const userMessage = {
      id: 'msg_u_' + Date.now(),
      role: 'user',
      text: textToSend,
      timestamp: new Date().toISOString()
    };

    const currentMessages = activeSession?.messages || [];
    const isFirstMessage = currentMessages.length === 0;

    setInputText('');
    setIsGenerating(true);
    setGeneratingStep('대화 참여자 및 관계 맥락을 정밀 분석하는 중...');

    setTimeout(() => {
      setGeneratingStep('상황 중요도 및 상대방 핵심 심리를 파악하는 중...');
    }, 280);

    setTimeout(() => {
      setGeneratingStep('상황에 가장 완벽한 4가지 맞춤 대사를 생성하는 중...');
    }, 550);

    try {
      const result = await analyzeConversation(textToSend, currentMessages);
      const autoTitle = isFirstMessage ? result.title : null;

      const assistantMessage = {
        id: 'msg_a_' + Date.now(),
        role: 'assistant',
        text: 'Sync 맞춤 분석 및 추천 대사가 생성되었습니다.',
        resultData: result,
        timestamp: new Date().toISOString()
      };

      addMessageToSession(activeSession.id, userMessage, autoTitle);
      addMessageToSession(activeSession.id, assistantMessage, autoTitle);

      onRefreshSessions();
    } catch (error) {
      console.error('Failed to generate response:', error);
      showToast('대화 분석 중 오류가 발생했습니다.');
    } finally {
      setIsGenerating(false);
      setGeneratingStep('');
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Drag & drop .txt exported file from KakaoTalk
  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDraggingFile(true);
  };

  const handleDragLeave = () => {
    setIsDraggingFile(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDraggingFile(false);
    const file = e.dataTransfer.files?.[0];
    if (file && (file.type.includes('text') || file.name.endsWith('.txt'))) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const content = event.target?.result;
        if (typeof content === 'string') {
          setInputText(content.slice(0, 2500));
          showToast(`카카오톡 대화 파일 '${file.name}'을 성공적으로 불러왔습니다.`);
        }
      };
      reader.readAsText(file);
    } else {
      showToast('카카오톡 내보내기 텍스트(.txt) 파일을 드롭해주세요.');
    }
  };

  const filteredSituations = selectedCategory === 'all'
    ? SITUATIONS
    : SITUATIONS.filter(s => s.category === selectedCategory);

  const messages = activeSession?.messages || [];
  const isEmptySession = messages.length === 0;

  return (
    <div
      className="workspace-main"
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* Drag & Drop Overlay */}
      {isDraggingFile && (
        <div style={{
          position: 'absolute',
          inset: 0,
          background: 'rgba(66, 133, 244, 0.2)',
          backdropFilter: 'blur(4px)',
          border: '3px dashed #4285f4',
          zIndex: 100,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '12px'
        }}>
          <UploadCloud size={48} color="#4285f4" className="gemini-sparkle-anim" />
          <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#4285f4' }}>
            카카오톡 대화 내용 텍스트 파일(.txt)을 놓아주세요
          </h3>
        </div>
      )}

      {/* Scrollable Message History Area */}
      <div className="chat-scroll-area" ref={scrollRef}>
        {isEmptySession ? (
          /* Empty Session - Sync Hero & Collapsible Situations Explorer */
          <div className="chat-max-width animate-fade-in" style={{ textAlign: 'center', paddingTop: '20px', paddingBottom: '20px' }}>
            {/* Top Hero Badge & Action Bar */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', marginBottom: '14px' }}>
              <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '5px 12px',
                borderRadius: 'var(--radius-pill)',
                background: 'var(--gemini-gradient-subtle)',
                border: '1px solid rgba(66, 133, 244, 0.25)',
                fontSize: '0.82rem',
                fontWeight: 600,
                color: '#4285f4'
              }}>
                <Sparkles size={14} />
                <span>Sync AI 실시간 대화 분석</span>
              </div>

              {/* Real-time Simulator Action Pill */}
              <button
                onClick={() => setShowLiveSimulator(true)}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '5px 12px',
                  borderRadius: 'var(--radius-pill)',
                  background: 'rgba(239, 68, 68, 0.12)',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  fontSize: '0.82rem',
                  fontWeight: 700,
                  color: '#ef4444',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
                onMouseOver={(e) => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.2)'}
                onMouseOut={(e) => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.12)'}
              >
                <Radio size={14} className="gemini-sparkle-anim" />
                <span>🔴 실시간 카톡 라이브 코칭 모드</span>
              </button>
            </div>

            <h1 style={{ fontSize: '2rem', fontWeight: 800, letterSpacing: '-0.03em', marginBottom: '8px' }}>
              대화는 통하고, <span className="gemini-text-gradient">센스는 살리고</span>
            </h1>

            <p style={{ fontSize: '0.94rem', color: 'var(--color-text-muted)', maxWidth: '540px', margin: '0 auto 20px', lineHeight: '1.55' }}>
              카톡 대화를 복사해 넣으시면 부모님, 직장 상사, 친구, 연인 등 <strong>상대방과의 관계와 상황 중요도를 AI가 자동 분석</strong>하여 딱 맞는 4가지 대사를 추천합니다.
            </p>

            {/* Collapsible Situations Explorer Card (열고 닫기 가능) */}
            <div style={{
              textAlign: 'left',
              background: 'var(--color-surface)',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-lg)',
              padding: '18px 20px',
              boxShadow: 'var(--shadow-sm)',
              transition: 'all 0.25s ease'
            }}>
              {/* Header with Open/Close Toggle Button */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  cursor: 'pointer',
                  userSelect: 'none'
                }}
                onClick={() => setIsTemplatesOpen(!isTemplatesOpen)}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <BookOpen size={18} color="#4285f4" />
                  <span style={{ fontSize: '0.94rem', fontWeight: 800, color: 'var(--color-text-main)' }}>
                    실전 카톡 상황별 템플릿 ({SITUATIONS.length}종)
                  </span>
                  <span style={{ fontSize: '0.74rem', color: 'var(--color-text-dim)' }}>
                    {isTemplatesOpen ? '원하는 상황을 클릭하면 즉시 입력됩니다' : '클릭하여 펼쳐보기'}
                  </span>
                </div>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsTemplatesOpen(!isTemplatesOpen);
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    padding: '4px 10px',
                    borderRadius: 'var(--radius-pill)',
                    border: '1px solid var(--color-border)',
                    background: 'var(--color-bg-base)',
                    color: 'var(--color-text-muted)',
                    fontSize: '0.78rem',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  <span>{isTemplatesOpen ? '템플릿 접기' : '템플릿 열기'}</span>
                  {isTemplatesOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                </button>
              </div>

              {/* Collapsible Content */}
              {isTemplatesOpen && (
                <div style={{ marginTop: '14px' }} className="animate-fade-in">
                  {/* Category Filter Pills (No Scrollbar Glitch) */}
                  <div className="category-pill-container">
                    {SITUATION_CATEGORIES.map((cat) => {
                      const isActive = selectedCategory === cat.id;
                      return (
                        <button
                          key={cat.id}
                          onClick={() => setSelectedCategory(cat.id)}
                          className={`category-pill-btn ${isActive ? 'active' : ''}`}
                        >
                          {cat.label}
                        </button>
                      );
                    })}
                  </div>

                  {/* Situation Grid */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))', gap: '10px' }}>
                    {filteredSituations.map((item) => (
                      <div
                        key={item.id}
                        onClick={() => {
                          setInputText(item.text);
                          textareaRef.current?.focus();
                          showToast(`'${item.title}' 상황이 입력되었습니다.`);
                        }}
                        style={{
                          padding: '12px 14px',
                          borderRadius: 'var(--radius-md)',
                          background: 'var(--color-bg-base)',
                          border: '1px solid var(--color-border)',
                          cursor: 'pointer',
                          display: 'flex',
                          flexDirection: 'column',
                          justifyContent: 'space-between',
                          gap: '6px',
                          transition: 'all 0.15s ease'
                        }}
                        onMouseOver={(e) => {
                          e.currentTarget.style.borderColor = '#4285f4';
                          e.currentTarget.style.background = 'var(--color-surface-hover)';
                        }}
                        onMouseOut={(e) => {
                          e.currentTarget.style.borderColor = 'var(--color-border)';
                          e.currentTarget.style.background = 'var(--color-bg-base)';
                        }}
                      >
                        <div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2px' }}>
                            <span style={{ fontSize: '0.72rem', color: '#4285f4', fontWeight: 700 }}>
                              {item.categoryName}
                            </span>
                            <span style={{ fontSize: '0.7rem', color: 'var(--color-text-dim)' }}>
                              {item.badge.split(' ')[0]}
                            </span>
                          </div>
                          <h4 style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--color-text-main)', marginBottom: '2px' }}>
                            {item.title}
                          </h4>
                          <p style={{ fontSize: '0.78rem', color: 'var(--color-text-dim)', lineHeight: '1.35' }}>
                            {item.description}
                          </p>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.74rem', color: '#4285f4', fontWeight: 600, marginTop: '2px' }}>
                          <span>체험하기</span>
                          <ArrowRight size={12} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Security Badge */}
            <div style={{ marginTop: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', fontSize: '0.8rem', color: 'var(--color-text-dim)' }}>
              <ShieldCheck size={16} color="#10b981" />
              <span>모든 대화 내용은 외부 유출 없이 내 기기(LocalStorage)에만 안전하게 보관됩니다.</span>
            </div>
          </div>
        ) : (
          /* Multi-turn Chat Thread Stream */
          <div className="chat-max-width">
            {messages.map((msg, index) => {
              if (msg.role === 'user') {
                return (
                  <div key={msg.id || index} className="user-msg-container animate-fade-in">
                    <div className="user-msg-bubble">
                      {msg.text}
                    </div>
                  </div>
                );
              }

              // Assistant Message with Insights and Tailored Reply Cards
              const data = msg.resultData;
              const insights = data?.insights;
              const replies = data?.replies || [];
              const parsedMessages = data?.parsedMessages || [];
              const isFlowOpen = expandedFlows[msg.id] !== false;

              return (
                <div key={msg.id || index} className="assistant-msg-container animate-fade-in">
                  <div className="gemini-avatar">
                    <Sparkles size={17} color="#ffffff" />
                  </div>

                  <div className="assistant-content-wrapper">
                    {/* 1. Context Insights Card */}
                    {insights && (
                      <div className="gemini-card" style={{ padding: '18px 20px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                          <span style={{ fontSize: '0.78rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#4285f4' }}>
                            ✨ Sync AI 맥락 분석 리포트
                          </span>
                          <span style={{ fontSize: '0.76rem', color: 'var(--color-text-dim)' }}>
                            {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '14px' }}>
                          <div style={{ padding: '10px 12px', background: 'var(--color-surface-hover)', borderRadius: 'var(--radius-md)' }}>
                            <span style={{ fontSize: '0.74rem', color: 'var(--color-text-dim)', display: 'block', marginBottom: '2px' }}>대화 관계</span>
                            <strong style={{ fontSize: '0.9rem', color: 'var(--color-text-main)' }}>{insights.relationship}</strong>
                          </div>
                          <div style={{ padding: '10px 12px', background: 'var(--color-surface-hover)', borderRadius: 'var(--radius-md)' }}>
                            <span style={{ fontSize: '0.74rem', color: 'var(--color-text-dim)', display: 'block', marginBottom: '2px' }}>현재 분위기</span>
                            <strong style={{ fontSize: '0.9rem', color: '#10b981' }}>{insights.atmosphere}</strong>
                          </div>
                        </div>

                        {/* Opponent Intent */}
                        <div style={{ padding: '12px 14px', background: 'rgba(66, 133, 244, 0.06)', borderLeft: '3px solid #4285f4', borderRadius: '0 var(--radius-sm) var(--radius-sm) 0', marginBottom: '12px' }}>
                          <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#4285f4', display: 'block', marginBottom: '4px' }}>
                            🎯 상대방의 핵심 심리 & 의도
                          </span>
                          <p style={{ fontSize: '0.88rem', color: 'var(--color-text-main)', lineHeight: '1.5', margin: 0 }}>
                            {insights.opponentIntent}
                          </p>
                        </div>

                        {/* Coaching Tip */}
                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', padding: '10px 12px', background: 'rgba(234, 179, 8, 0.08)', borderRadius: 'var(--radius-md)' }}>
                          <Lightbulb size={16} color="#eab308" style={{ flexShrink: 0, marginTop: '2px' }} />
                          <p style={{ fontSize: '0.84rem', color: 'var(--color-text-main)', margin: 0, lineHeight: '1.45' }}>
                            <strong>Sync 코칭:</strong> {insights.coachingAdvice}
                          </p>
                        </div>
                      </div>
                    )}

                    {/* 2. Structured Chat History Viewer (Collapsible) */}
                    {parsedMessages && parsedMessages.length > 0 && (
                      <div className="gemini-card" style={{ padding: '14px 18px' }}>
                        <div
                          style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}
                          onClick={() => toggleChatFlow(msg.id)}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <MessageSquare size={16} color="var(--color-text-dim)" />
                            <span style={{ fontSize: '0.86rem', fontWeight: 600 }}>
                              정제된 대화 흐름 ({parsedMessages.length}개 메시지)
                            </span>
                          </div>
                          {isFlowOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                        </div>

                        {isFlowOpen && (
                          <div style={{
                            marginTop: '12px',
                            background: 'var(--color-bg-base)',
                            borderRadius: 'var(--radius-md)',
                            padding: '14px',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '10px',
                            border: '1px solid var(--color-border)'
                          }}>
                            {parsedMessages.map((pMsg, pIdx) => (
                              <div
                                key={pIdx}
                                style={{
                                  display: 'flex',
                                  flexDirection: 'column',
                                  alignItems: pMsg.isMe ? 'flex-end' : 'flex-start'
                                }}
                              >
                                <span style={{ fontSize: '0.72rem', color: 'var(--color-text-dim)', marginBottom: '3px' }}>
                                  {pMsg.sender}
                                </span>
                                <div className={`chat-bubble ${pMsg.isMe ? 'me' : 'other'}`}>
                                  {pMsg.text}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    {/* 3. Tailored Smart Reply Cards */}
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                        <h3 style={{ fontSize: '1.05rem', fontWeight: 700, margin: 0 }}>
                          상황 맞춤 추천 대사 <span style={{ color: '#4285f4', fontSize: '0.88rem' }}>({replies.length}종)</span>
                        </h3>
                        <span style={{ fontSize: '0.78rem', color: 'var(--color-text-dim)' }}>원클릭 복사 & 카톡 전송</span>
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                        {replies.map((reply) => {
                          const isCopied = copiedId === `${msg.id}_${reply.id}`;
                          const isPreviewOpen = previewId === `${msg.id}_${reply.id}`;

                          return (
                            <div key={reply.id} className="gemini-card" style={{ padding: '18px', position: 'relative' }}>
                              {/* Tone & Tag */}
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                                <span style={{
                                  padding: '4px 10px',
                                  borderRadius: 'var(--radius-pill)',
                                  fontSize: '0.8rem',
                                  fontWeight: 700,
                                  background: 'var(--gemini-gradient-subtle)',
                                  color: '#4285f4',
                                  border: '1px solid rgba(66, 133, 244, 0.2)'
                                }}>
                                  {reply.tone}
                                </span>
                                <span style={{ fontSize: '0.76rem', fontWeight: 600, color: 'var(--color-text-dim)' }}>
                                  {reply.tag}
                                </span>
                              </div>

                              {/* Message Text Quote */}
                              <div style={{
                                padding: '14px 16px',
                                background: 'var(--color-surface-hover)',
                                borderRadius: 'var(--radius-md)',
                                fontSize: '0.98rem',
                                lineHeight: '1.55',
                                color: 'var(--color-text-main)',
                                fontWeight: 500,
                                marginBottom: '12px',
                                border: '1px solid var(--color-border)'
                              }}>
                                "{reply.text}"
                              </div>

                              {/* Strategy */}
                              <div style={{ fontSize: '0.82rem', color: 'var(--color-text-muted)', lineHeight: '1.45', marginBottom: '14px' }}>
                                💡 <strong>소통 전략:</strong> {reply.strategy}
                                {reply.bestFor && (
                                  <span style={{ display: 'block', marginTop: '2px', color: 'var(--color-text-dim)', fontSize: '0.76rem' }}>
                                    (추천 상황: {reply.bestFor})
                                  </span>
                                )}
                              </div>

                              {/* Kakao Preview (Yellow Bubble) */}
                              {isPreviewOpen && (
                                <div style={{
                                  background: '#abc1d1',
                                  borderRadius: 'var(--radius-md)',
                                  padding: '12px 14px',
                                  marginBottom: '14px',
                                  display: 'flex',
                                  flexDirection: 'column',
                                  alignItems: 'flex-end'
                                }}>
                                  <span style={{ fontSize: '0.72rem', color: '#3b4e5b', marginBottom: '4px' }}>카카오톡 전송 시 말풍선 형태</span>
                                  <div style={{
                                    background: '#fee500',
                                    color: '#191919',
                                    padding: '10px 14px',
                                    borderRadius: '16px 4px 16px 16px',
                                    fontSize: '0.92rem',
                                    fontWeight: 500,
                                    maxWidth: '85%',
                                    wordBreak: 'break-word',
                                    boxShadow: '0 1px 2px rgba(0,0,0,0.1)'
                                  }}>
                                    {reply.text}
                                  </div>
                                </div>
                              )}

                              {/* Action Buttons */}
                              <div style={{ display: 'flex', gap: '8px' }}>
                                <button
                                  className="gemini-btn-secondary"
                                  onClick={() => setPreviewId(isPreviewOpen ? null : `${msg.id}_${reply.id}`)}
                                  style={{ padding: '8px 12px', fontSize: '0.82rem' }}
                                  title="카카오톡 말풍선으로 미리보기"
                                >
                                  <Eye size={15} />
                                  <span>{isPreviewOpen ? '닫기' : '미리보기'}</span>
                                </button>

                                <button
                                  className="gemini-btn-secondary"
                                  onClick={() => {
                                    handleSend(`상대방에게 "${reply.text}" 대사로 보냈을 때 상대방 예상 반응과 다음 추천 대사를 알려줘.`);
                                  }}
                                  style={{ padding: '8px 12px', fontSize: '0.82rem' }}
                                  title="이 대사로 맥락 이어가기"
                                >
                                  <MessageSquare size={15} />
                                  <span>이 대사로 이어가기</span>
                                </button>

                                <button
                                  className="gemini-btn-primary"
                                  onClick={() => handleCopy(`${msg.id}_${reply.id}`, reply.text)}
                                  style={{
                                    flex: 1,
                                    padding: '8px 16px',
                                    fontSize: '0.86rem',
                                    background: isCopied ? '#10b981' : 'var(--gemini-gradient)',
                                    boxShadow: isCopied ? '0 4px 14px rgba(16, 185, 129, 0.35)' : undefined
                                  }}
                                >
                                  {isCopied ? (
                                    <>
                                      <Check size={16} />
                                      <span>복사 완료!</span>
                                    </>
                                  ) : (
                                    <>
                                      <Copy size={16} />
                                      <span>복사하기</span>
                                    </>
                                  )}
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Follow-up Quick Chips */}
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '4px' }}>
                      <button
                        className="gemini-chip"
                        onClick={() => handleSend('더 정중하고 예의 바른 존댓말 버전 3개 더 추천해줘.')}
                      >
                        ✨ 더 정중한 톤으로
                      </button>
                      <button
                        className="gemini-chip"
                        onClick={() => handleSend('좀 더 위트 있고 재치 있는 유머러스한 대사 추천해줘.')}
                      >
                        ⚡ 더 위트 있게
                      </button>
                      <button
                        className="gemini-chip"
                        onClick={() => handleSend('자연스럽게 만남 약속을 잡는 방향의 대사 알려줘.')}
                      >
                        📅 약속 잡는 대사
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Loading / Generating State */}
            {isGenerating && (
              <div className="assistant-msg-container animate-fade-in">
                <div className="gemini-avatar">
                  <Sparkles size={17} color="#ffffff" className="gemini-sparkle-anim" />
                </div>
                <div className="assistant-content-wrapper">
                  <div className="gemini-card" style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <RefreshCw size={18} color="#4285f4" className="gemini-sparkle-anim" />
                    <div>
                      <span style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--color-text-main)' }}>
                        {generatingStep || 'Sync가 대화를 분석하고 있습니다...'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Bottom Floating Prompt Input Box */}
      <div style={{ padding: '0 20px 20px', width: '100%', display: 'flex', justifyContent: 'center' }}>
        <div style={{ width: '100%', maxWidth: '820px' }}>
          <div className="gemini-prompt-box">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.78rem', color: 'var(--color-text-dim)' }}>
                <Sparkles size={14} color="#4285f4" />
                <span>카카오톡 대화 내용 또는 후속 질문</span>
                <span style={{ color: 'var(--color-border)' }}>|</span>
                <label style={{ display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer', color: '#4285f4' }}>
                  <FileText size={13} />
                  <span>.txt 파일 열기</span>
                  <input
                    type="file"
                    accept=".txt"
                    style={{ display: 'none' }}
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        const reader = new FileReader();
                        reader.onload = (event) => {
                          if (typeof event.target?.result === 'string') {
                            setInputText(event.target.result.slice(0, 2500));
                            showToast(`'${file.name}'을 불러왔습니다.`);
                          }
                        };
                        reader.readAsText(file);
                      }
                    }}
                  />
                </label>
              </div>

              <div style={{ display: 'flex', gap: '6px' }}>
                {inputText && (
                  <button
                    onClick={() => setInputText('')}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-dim)', fontSize: '0.78rem', display: 'flex', alignItems: 'center', gap: '2px' }}
                  >
                    <X size={13} /> 지우기
                  </button>
                )}
                <button
                  onClick={handlePaste}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#4285f4', fontSize: '0.78rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}
                >
                  <Clipboard size={13} /> 붙여넣기
                </button>
              </div>
            </div>

            <textarea
              ref={textareaRef}
              className="gemini-textarea"
              placeholder="카톡 대화를 복사해 붙여넣거나, 파일(.txt)을 끌어다 놓으세요... (Enter로 전송)"
              rows={Math.min(6, Math.max(2, inputText.split('\n').length))}
              value={inputText}
              onChange={(e) => {
                if (e.target.value.length <= 2500) {
                  setInputText(e.target.value);
                }
              }}
              onKeyDown={handleKeyDown}
            />

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '10px', paddingTop: '8px', borderTop: '1px solid var(--color-border-subtle)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div
                  onClick={() => setShowPrivacy(true)}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', cursor: 'pointer', fontSize: '0.78rem', color: 'var(--color-text-dim)' }}
                >
                  <ShieldCheck size={15} color="#10b981" />
                  <span style={{ textDecoration: 'underline' }}>로컬 보안 정책</span>
                </div>

                <div
                  onClick={() => setShowLiveSimulator(true)}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', cursor: 'pointer', fontSize: '0.78rem', color: '#ef4444', fontWeight: 600 }}
                >
                  <Radio size={13} />
                  <span>실시간 모의 카톡</span>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ fontSize: '0.76rem', color: inputText.length > 2200 ? '#ef4444' : 'var(--color-text-dim)' }}>
                  {inputText.length} / 2,500
                </span>

                <button
                  onClick={() => handleSend()}
                  disabled={!inputText.trim() || isGenerating}
                  className="gemini-btn-primary"
                  style={{
                    padding: '8px 16px',
                    opacity: !inputText.trim() || isGenerating ? 0.4 : 1,
                    cursor: !inputText.trim() || isGenerating ? 'not-allowed' : 'pointer'
                  }}
                >
                  <Send size={15} />
                  <span>전송</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Real-time KakaoTalk Live Simulator Modal */}
      <LiveSimulatorModal
        isOpen={showLiveSimulator}
        onClose={() => setShowLiveSimulator(false)}
      />

      {/* Privacy Policy Modal */}
      {showPrivacy && (
        <div style={{
          position: 'fixed', inset: 0,
          backgroundColor: 'rgba(0,0,0,0.65)',
          backdropFilter: 'blur(6px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: '20px', zIndex: 1000
        }}>
          <div className="gemini-card animate-fade-in" style={{ padding: '24px', maxWidth: '440px', width: '100%', position: 'relative' }}>
            <button
              onClick={() => setShowPrivacy(false)}
              style={{ position: 'absolute', top: '18px', right: '18px', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-main)' }}
            >
              <X size={18} />
            </button>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
              <ShieldCheck size={22} color="#10b981" />
              <h3 style={{ fontSize: '1.15rem', fontWeight: 700 }}>로컬 저장 및 보안 정책</h3>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '0.88rem', color: 'var(--color-text-muted)', lineHeight: '1.55' }}>
              <p>🔒 <strong>내 브라우저(로컬) 보관:</strong> 모든 대화 내역은 외부 서버가 아닌 사용자의 브라우저(LocalStorage)에만 안전하게 보관됩니다.</p>
              <p>🧹 <strong>스마트 노이즈 필터링:</strong> 카카오톡 날짜 구분선(--- 2026년 ... ---), 시스템 메시지 등은 분석 시 자동으로 필터링됩니다.</p>
              <p>✨ <strong>완전한 통제권:</strong> 사이드바에서 언제든 원하는 대화를 이름 변경하거나 즉시 삭제할 수 있습니다.</p>
            </div>
            <button
              className="gemini-btn-secondary"
              onClick={() => setShowPrivacy(false)}
              style={{ width: '100%', marginTop: '18px', justifyContent: 'center' }}
            >
              확인했습니다
            </button>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {toastMessage && (
        <div className="toast-container">
          <div className="toast">
            <Check size={16} color="#10b981" />
            <span>{toastMessage}</span>
          </div>
        </div>
      )}
    </div>
  );
}
