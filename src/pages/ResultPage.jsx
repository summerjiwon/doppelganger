import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Sparkles,
  Copy,
  Check,
  RotateCcw,
  MessageSquare,
  ChevronDown,
  ChevronUp,
  Lightbulb,
  Eye,
  PlusCircle,
  BookmarkCheck
} from 'lucide-react';

export default function ResultPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const result = location.state?.result;
  const session = location.state?.session || result;

  const [copiedId, setCopiedId] = useState(null);
  const [showChatFlow, setShowChatFlow] = useState(true);
  const [previewId, setPreviewId] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);

  if (!result && !session) {
    return (
      <div className="animate-fade-in" style={{ textAlign: 'center', padding: '60px 20px' }}>
        <p className="text-muted">분석 결과가 존재하지 않습니다.</p>
        <button className="gemini-btn-primary" style={{ marginTop: '20px' }} onClick={() => navigate('/')}>
          <RotateCcw size={16} /> 대화 입력하러 가기
        </button>
      </div>
    );
  }

  const activeData = result || session;
  const { insights, replies, parsedMessages } = activeData;

  const handleCopy = async (id, text) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      setToastMessage('클립보드에 복사되었습니다! 카카오톡에 바로 붙여넣으세요.');
      setTimeout(() => {
        setCopiedId(null);
        setToastMessage(null);
      }, 3000);
    } catch {
      setToastMessage('클립보드 복사 권한이 필요합니다.');
      setTimeout(() => setToastMessage(null), 3000);
    }
  };

  const handleContinueConversation = () => {
    navigate('/', {
      state: {
        continuingSession: session || activeData
      }
    });
  };

  return (
    <div className="animate-fade-in" style={{ padding: '24px 20px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Sparkles size={20} color="#4285f4" />
          <h1 style={{ fontSize: '1.35rem', fontWeight: 700, margin: 0 }}>Gemini 분석 리포트</h1>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '0.76rem', color: '#10b981', background: 'rgba(16, 185, 129, 0.1)', padding: '4px 8px', borderRadius: 'var(--radius-pill)', fontWeight: 600 }}>
            <BookmarkCheck size={13} /> 로컬 보관됨
          </span>
          <button
            className="gemini-btn-secondary"
            onClick={() => navigate('/')}
            style={{ padding: '6px 12px', fontSize: '0.82rem' }}
          >
            <RotateCcw size={14} /> 새 분석
          </button>
        </div>
      </div>

      {/* 1. Context Analysis Report Card */}
      <div className="gemini-card" style={{ padding: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
          <span style={{ fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#4285f4' }}>
            AI Context Insights
          </span>
          {activeData.title && (
            <span style={{ fontSize: '0.78rem', color: 'var(--color-text-dim)' }}>
              {activeData.title}
            </span>
          )}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '16px' }}>
          <div style={{ padding: '10px 12px', background: 'var(--color-surface-hover)', borderRadius: 'var(--radius-md)' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--color-text-dim)', display: 'block', marginBottom: '2px' }}>대화 관계</span>
            <strong style={{ fontSize: '0.92rem', color: 'var(--color-text-main)' }}>{insights.relationship}</strong>
          </div>
          <div style={{ padding: '10px 12px', background: 'var(--color-surface-hover)', borderRadius: 'var(--radius-md)' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--color-text-dim)', display: 'block', marginBottom: '2px' }}>현재 분위기</span>
            <strong style={{ fontSize: '0.92rem', color: '#10b981' }}>{insights.atmosphere}</strong>
          </div>
        </div>

        {/* Psychological Intent */}
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
            <strong>Gemini 코칭:</strong> {insights.coachingAdvice}
          </p>
        </div>
      </div>

      {/* 2. Structured Chat History Viewer (Collapsible) */}
      {parsedMessages && parsedMessages.length > 0 && (
        <div className="gemini-card" style={{ padding: '16px 20px' }}>
          <div
            style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}
            onClick={() => setShowChatFlow(!showChatFlow)}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <MessageSquare size={16} color="var(--color-text-dim)" />
              <span style={{ fontSize: '0.88rem', fontWeight: 600 }}>
                분석된 대화 흐름 ({parsedMessages.length}개 메시지)
              </span>
            </div>
            {showChatFlow ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
          </div>

          {showChatFlow && (
            <div className="chat-viewer" style={{ marginTop: '14px' }}>
              {parsedMessages.map((msg, index) => (
                <div
                  key={index}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: msg.isMe ? 'flex-end' : 'flex-start'
                  }}
                >
                  <span className="chat-sender-label">
                    {msg.sender}
                  </span>
                  <div className={`chat-bubble ${msg.isMe ? 'me' : 'other'}`}>
                    {msg.text}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 3. Gemini Tailored Replies */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
          <h2 style={{ fontSize: '1.15rem', fontWeight: 700, margin: 0 }}>
            Gemini 추천 대사 <span style={{ color: '#4285f4', fontSize: '0.9rem' }}>({replies.length}개)</span>
          </h2>
          <span style={{ fontSize: '0.8rem', color: 'var(--color-text-dim)' }}>말투와 상황에 맞춘 선택지</span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {replies.map((reply) => {
            const isCopied = copiedId === reply.id;
            const isPreviewOpen = previewId === reply.id;

            return (
              <div key={reply.id} className="gemini-card" style={{ padding: '20px', position: 'relative' }}>
                {/* Tone & Tags */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <span style={{
                    padding: '4px 10px',
                    borderRadius: 'var(--radius-pill)',
                    fontSize: '0.82rem',
                    fontWeight: 700,
                    background: 'var(--gemini-gradient-subtle)',
                    color: '#4285f4',
                    border: '1px solid rgba(66, 133, 244, 0.2)'
                  }}>
                    {reply.tone}
                  </span>
                  <span style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--color-text-dim)' }}>
                    {reply.tag}
                  </span>
                </div>

                {/* Reply Message Text */}
                <div style={{
                  padding: '14px 16px',
                  background: 'var(--color-surface-hover)',
                  borderRadius: 'var(--radius-md)',
                  fontSize: '1.02rem',
                  lineHeight: '1.6',
                  color: 'var(--color-text-main)',
                  fontWeight: 500,
                  marginBottom: '14px',
                  border: '1px solid var(--color-border)'
                }}>
                  "{reply.text}"
                </div>

                {/* Strategy Rationale */}
                <div style={{ fontSize: '0.84rem', color: 'var(--color-text-muted)', lineHeight: '1.5', marginBottom: '16px' }}>
                  💡 <strong>전략:</strong> {reply.strategy}
                  {reply.bestFor && (
                    <span style={{ display: 'block', marginTop: '2px', color: 'var(--color-text-dim)', fontSize: '0.78rem' }}>
                      (추천: {reply.bestFor})
                    </span>
                  )}
                </div>

                {/* Kakao Preview (Optional Toggle) */}
                {isPreviewOpen && (
                  <div style={{
                    background: '#abc1d1',
                    borderRadius: 'var(--radius-md)',
                    padding: '14px',
                    marginBottom: '14px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'flex-end'
                  }}>
                    <span style={{ fontSize: '0.75rem', color: '#3b4e5b', marginBottom: '4px' }}>카카오톡 전송 미리보기</span>
                    <div style={{
                      background: '#fee500',
                      color: '#191919',
                      padding: '10px 14px',
                      borderRadius: '16px 4px 16px 16px',
                      fontSize: '0.94rem',
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
                    onClick={() => setPreviewId(isPreviewOpen ? null : reply.id)}
                    style={{ flex: '0 0 auto', padding: '10px 14px' }}
                    title="카카오톡 말풍선으로 미리보기"
                  >
                    <Eye size={16} />
                    {isPreviewOpen ? '닫기' : '미리보기'}
                  </button>

                  <button
                    className="gemini-btn-primary"
                    onClick={() => handleCopy(reply.id, reply.text)}
                    style={{
                      flex: 1,
                      padding: '10px 18px',
                      background: isCopied ? '#10b981' : 'var(--gemini-gradient)',
                      boxShadow: isCopied ? '0 4px 14px rgba(16, 185, 129, 0.35)' : undefined
                    }}
                  >
                    {isCopied ? (
                      <>
                        <Check size={18} />
                        복사 완료!
                      </>
                    ) : (
                      <>
                        <Copy size={18} />
                        복사하기
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Continuation & Next Action Card */}
      <div className="gemini-card" style={{ padding: '18px 20px', background: 'var(--gemini-gradient-subtle)', border: '1px solid rgba(66, 133, 244, 0.25)', display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <PlusCircle size={18} color="#4285f4" />
          <strong style={{ fontSize: '0.96rem', color: 'var(--color-text-main)' }}>
            상대방에게 답장이 왔나요?
          </strong>
        </div>
        <p style={{ fontSize: '0.86rem', color: 'var(--color-text-muted)', margin: 0, lineHeight: '1.45' }}>
          현재 대화 맥락을 그대로 유지한 채, 새로운 카톡 메시지를 추가하여 연속 분석을 진행할 수 있습니다.
        </p>
        <button
          className="gemini-btn-primary"
          onClick={handleContinueConversation}
          style={{ width: '100%', marginTop: '6px', padding: '12px 18px' }}
        >
          <PlusCircle size={16} />
          이 대화에 새 메시지 추가하여 이어가기
        </button>
      </div>

      {/* Bottom Start Over Button */}
      <div style={{ textAlign: 'center', marginBottom: '24px' }}>
        <button
          className="gemini-btn-secondary"
          onClick={() => navigate('/')}
          style={{ width: '100%', padding: '14px', justifyContent: 'center', fontSize: '0.94rem' }}
        >
          <RotateCcw size={18} />
          새로운 대화 분석하기
        </button>
      </div>

      {/* Toast */}
      {toastMessage && (
        <div className="toast-container">
          <div className="toast">
            <Check size={18} color="#10b981" />
            {toastMessage}
          </div>
        </div>
      )}
    </div>
  );
}
