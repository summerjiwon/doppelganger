import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Sparkles, ShieldCheck, Clipboard, X, ArrowRight, MessageCircle, History } from 'lucide-react';

const SAMPLES = [
  {
    title: '💌 소개팅 썸 대화',
    text: `--------------- 2026년 8월 14일 금요일 ---------------
[상대방] [오후 7:15] 오늘 파스타 집 진짜 맛있었어요! 분위기도 너무 좋았구요 ㅎㅎ
[나] [오후 7:20] 저도 오늘 시간 가는 줄 몰랐어요! 조심히 들어가셨나요?
[상대방] [오후 7:23] 넵 방금 도착했어요! 다음엔 제가 더 맛있는 디저트 카페 찾아볼게요 😊`
  },
  {
    title: '💼 직장 상사 카톡',
    text: `--------------- 2026년 8월 14일 금요일 ---------------
[팀장님] [오전 10:10] 민준씨, 지난주 요청했던 3분기 기획안 수정본 오늘 중으로 확인 가능할까요?
[팀장님] [오전 10:11] 디자인 파트랑도 일정 조율 한번 필요할 것 같습니다.`
  },
  {
    title: '🍻 친구와의 대화',
    text: `--------------- 2026년 8월 14일 금요일 ---------------
[친구] [오후 5:30] 야 너 오늘 칼퇴하냐??
[친구] [오후 5:31] 오늘 치맥 땡기는데 동네에서 급번개 고??`
  }
];

export default function InputPage() {
  const [text, setText] = useState('');
  const [showPrivacy, setShowPrivacy] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMsg, setToastMsg] = useState('');
  const navigate = useNavigate();
  const location = useLocation();

  // If user navigated here to continue an existing session
  const continuingSession = location.state?.continuingSession || null;

  const handleTextChange = (e) => {
    if (e.target.value.length <= 2500) {
      setText(e.target.value);
    }
  };

  const handlePaste = async () => {
    try {
      const clipText = await navigator.clipboard.readText();
      if (clipText) {
        setText(clipText.slice(0, 2500));
        triggerToast('클립보드 내용이 붙여넣어졌습니다.');
      }
    } catch {
      triggerToast('클립보드 읽기 권한을 확인해주세요.');
    }
  };

  const handleSampleClick = (sampleText) => {
    setText(sampleText);
    triggerToast('날짜 구분선이 포함된 예시 대화가 입력되었습니다.');
  };

  const triggerToast = (msg) => {
    setToastMsg(msg);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 2500);
  };

  const handleSubmit = () => {
    if (text.trim().length === 0) {
      triggerToast('대화 내용을 먼저 입력해주세요.');
      return;
    }
    navigate('/processing', {
      state: {
        text,
        continuingSession
      }
    });
  };

  return (
    <div className="animate-fade-in" style={{ padding: '24px 20px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Continuing Session Indicator */}
      {continuingSession && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '10px 14px',
          background: 'rgba(66, 133, 244, 0.08)',
          border: '1px solid rgba(66, 133, 244, 0.3)',
          borderRadius: 'var(--radius-md)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <History size={16} color="#4285f4" />
            <span style={{ fontSize: '0.86rem', fontWeight: 600, color: 'var(--color-text-main)' }}>
              기존 대화 맥락 이어받기: <span style={{ color: '#4285f4' }}>{continuingSession.title}</span>
            </span>
          </div>
          <button
            onClick={() => navigate('/', { state: { continuingSession: null }, replace: true })}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-dim)', fontSize: '0.78rem' }}
          >
            새로 시작
          </button>
        </div>
      )}

      {/* Gemini Header */}
      <div style={{ textAlign: 'center', marginTop: continuingSession ? '0' : '10px' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '6px 14px', borderRadius: 'var(--radius-pill)', background: 'var(--gemini-gradient-subtle)', marginBottom: '12px', border: '1px solid rgba(66, 133, 244, 0.2)' }}>
          <Sparkles size={16} color="#4285f4" className="gemini-sparkle-anim" />
          <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#4285f4' }}>Sync with Gemini Intelligence</span>
        </div>
        <h1 style={{ fontSize: '1.9rem', fontWeight: 800, letterSpacing: '-0.03em', marginBottom: '8px' }}>
          대화는 통하고, <span className="gemini-text-gradient">센스는 살리고</span>
        </h1>
        <p className="text-muted" style={{ fontSize: '0.94rem', maxWidth: '440px', margin: '0 auto', lineHeight: '1.5' }}>
          카톡 대화를 복사해 넣으시면 날짜와 시스템 알림은 자동 정제하고, 맥락에 딱 맞는 4가지 대사를 추천합니다.
        </p>
      </div>

      {/* Preset Quick Chips */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
          <MessageCircle size={14} color="var(--color-text-dim)" />
          <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-text-dim)' }}>예시 대화로 빠르게 체험하기</span>
        </div>
        <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '4px' }}>
          {SAMPLES.map((sample, idx) => (
            <button
              key={idx}
              className="gemini-chip"
              onClick={() => handleSampleClick(sample.text)}
              style={{ whiteSpace: 'nowrap' }}
            >
              {sample.title}
            </button>
          ))}
        </div>
      </div>

      {/* Main Input Box (up to 2,500 chars) */}
      <div className="gemini-input-container">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
          <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-text-muted)' }}>
            카카오톡 대화 내용 (최대 2,500자)
          </span>
          <div style={{ display: 'flex', gap: '8px' }}>
            {text && (
              <button
                onClick={() => setText('')}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-dim)', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '2px' }}
              >
                <X size={14} /> 지우기
              </button>
            )}
            <button
              onClick={handlePaste}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#4285f4', fontSize: '0.82rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}
            >
              <Clipboard size={14} /> 붙여넣기
            </button>
          </div>
        </div>

        <textarea
          className="gemini-textarea"
          placeholder="여기에 카카오톡 대화방 내용을 복사해서 붙여넣으세요...&#10;&#10;💡 날짜 구분선(--- 2026년 ... ---)이나 '사진', '입장했습니다' 등은 AI가 자동 필터링합니다."
          rows={10}
          value={text}
          onChange={handleTextChange}
        />

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '12px', paddingTop: '10px', borderTop: '1px solid var(--color-border)' }}>
          <div
            onClick={() => setShowPrivacy(true)}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontSize: '0.82rem', color: 'var(--color-text-muted)' }}
          >
            <ShieldCheck size={16} color="#10b981" />
            <span style={{ textDecoration: 'underline' }}>로컬 보관 & 보안 정책</span>
          </div>

          <div style={{ fontSize: '0.82rem', color: text.length > 2200 ? '#ef4444' : 'var(--color-text-dim)', fontWeight: 500 }}>
            {text.length} / 2,500자
          </div>
        </div>
      </div>

      {/* Main Submit Button */}
      <button className="gemini-btn-primary" onClick={handleSubmit} style={{ width: '100%', padding: '16px 24px' }}>
        <Sparkles size={18} />
        {continuingSession ? '맥락 이어받아 새로운 대사 추천받기' : 'Gemini AI로 대화 분석 & 대사 추천받기'}
        <ArrowRight size={18} />
      </button>

      {/* Privacy Modal */}
      {showPrivacy && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.6)',
          backdropFilter: 'blur(6px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: '20px', zIndex: 1000
        }}>
          <div className="gemini-card animate-fade-in" style={{ padding: '28px', maxWidth: '440px', width: '100%', position: 'relative' }}>
            <button
              onClick={() => setShowPrivacy(false)}
              style={{ position: 'absolute', top: '20px', right: '20px', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-main)' }}
            >
              <X size={20} />
            </button>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
              <ShieldCheck size={24} color="#10b981" />
              <h2 style={{ fontSize: '1.25rem', fontWeight: 700 }}>로컬 저장 및 개인정보 보호</h2>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '0.92rem', color: 'var(--color-text-muted)', lineHeight: '1.6' }}>
              <p>🔒 <strong>내 기기(로컬) 안전 보관:</strong> 분석된 대화 내역은 외부 서버가 아닌 사용자 브라우저(LocalStorage)에만 안전하게 보관되며, 원할 때 언제든 사이드바에서 개별 삭제할 수 있습니다.</p>
              <p>🧹 <strong>스마트 노이즈 필터링:</strong> 카카오톡 날짜 구분선, 송금 내역, 입장/퇴장 시스템 메시지는 분석 시 자동으로 제외됩니다.</p>
              <p>✨ <strong>AI 학습 미사용:</strong> 사용자의 개인 대화 데이터는 AI 모델 학습에 사용되지 않습니다.</p>
            </div>
            <button
              className="gemini-btn-secondary"
              onClick={() => setShowPrivacy(false)}
              style={{ width: '100%', marginTop: '20px', justifyContent: 'center' }}
            >
              확인했습니다
            </button>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {showToast && (
        <div className="toast-container">
          <div className="toast">
            <Sparkles size={16} color="#4285f4" />
            {toastMsg}
          </div>
        </div>
      )}
    </div>
  );
}
