import React, { useState, useEffect, useRef } from 'react';
import {
  Sparkles,
  X,
  Send,
  Copy,
  Check,
  Zap,
  Lightbulb,
  Radio
} from 'lucide-react';
import { copyTextToClipboard } from '../services/clipboardService';

const SIMULATOR_PARTNERS = [
  {
    id: 'mom',
    name: '엄마',
    role: '부모님 & 가족',
    avatar: '👩',
    bgBadge: '#ef4444',
    initialMessage: '아들~ 오늘 일 끝나고 저녁은 챙겨 먹었니? 날 추운데 따뜻하게 입고 다녀',
    repliesTree: {
      default: {
        partnerReply: '그래 든든하게 먹었다니 다행이다! 주말에 집에 반찬 가지러 들를 수 있니?',
        analysis: '자식이 끼니를 챙겼다는 말에 안도하며, 주말에 얼굴을 보고 싶어 하는 따뜻한 모성애입니다.',
        coaching: '주말 일정을 확인하고 반찬에 대한 감사와 함께 방문 약속을 드리면 큰 기쁨이 됩니다.',
        suggestions: [
          { text: '네 엄마! 이번 주 토요일 점심때 갈게요 ㅎㅎ 엄마가 해준 반찬 너무 먹고 싶었어요 ❤️', tone: '💖 애정 듬뿍 효도형' },
          { text: '토요일에 시간 돼요! 제가 맛있는 과일 사서 갈게요 엄마 ㅎㅎ', tone: '🎁 선물 & 효도형' },
          { text: '이번 주말엔 일이 좀 있어서 일요일 저녁에 잠깐 들를 수 있을 것 같아요!', tone: '⏳ 일정 조율형' },
          { text: '네 주말에 갈게요! 엄마 아빠 필요한 거 있으시면 미리 말씀해주세요~', tone: '✨ 듬직한 자식형' }
        ]
      }
    }
  },
  {
    id: 'boss',
    name: '김팀장님',
    role: '직장 상사 (중요 업무)',
    avatar: '👔',
    bgBadge: '#4285f4',
    initialMessage: '민준씨, 지난주 요청했던 3분기 기획안 수정본 오늘 오후 3시까지 확인 가능할까요?',
    repliesTree: {
      default: {
        partnerReply: '네, 좋습니다. 디자인 파트 검토 의견도 1장 요약해서 함께 첨부 부탁드립니다.',
        analysis: '기한 내 제출 약속에 만족하며, 디자인 부서와의 협업 완성도를 추가로 점검하려는 의도입니다.',
        coaching: '추가 요청 사항을 확실히 접수했음을 밝히고, 깔끔한 1장 요약 첨부 일정을 재확인하세요.',
        suggestions: [
          { text: '네 팀장님, 디자인 파트 피드백도 1장으로 깔끔히 정리해 3시 전 함께 공유드리겠습니다. 감사합니다!', tone: '✨ 프로페셔널 완벽형' },
          { text: '확인했습니다! 디자인 부서 최종 코멘트 취합하여 첨부하겠습니다.', tone: '⚡ 신속 간결형' },
          { text: '네, 핵심 쟁점 위주로 요약표 추가하여 보고서 완성도를 높이겠습니다.', tone: '💡 기획력 어필형' },
          { text: '네 알겠습니다. 차질 없이 준비하여 바로 회신드리겠습니다!', tone: '🤝 군더더기 제로형' }
        ]
      }
    }
  },
  {
    id: 'crush',
    name: '지은 (소개팅)',
    role: '소개팅 & 썸',
    avatar: '💘',
    bgBadge: '#ec4899',
    initialMessage: '민준씨 오늘 정말 즐거웠어요! 맛있는 파스타도 사주시고 조심히 들어가세요 ㅎㅎ',
    repliesTree: {
      default: {
        partnerReply: '와 진짜요? 저 디저트 완전 좋아하는데!! 다음 주 주말에 시간 어떠세요? 😊',
        analysis: '나에 대한 호감이 매우 높으며, 다음 만남(애프터) 제안을 적극적으로 반기고 있습니다.',
        coaching: '구체적인 요일(토요일 or 일요일)과 분위기 좋은 장소 후보를 제시해 약속을 확정 지으세요.',
        suggestions: [
          { text: '저 다음 주 토요일 오후에 완전 좋아요! 지은씨 좋아하실 만한 분위기 예쁜 카페 찾아둘게요 ㅎㅎ', tone: '✨ 적극 애프터 확정형' },
          { text: '좋아요! 토요일, 일요일 둘 다 괜찮은데 지은씨 편한 날로 맞춰볼까요? 😊', tone: '💬 배려 넘치는 다정형' },
          { text: '오 대박 ㅎㅎ 제가 디저트 맛집 리스트 3개 뽑아서 보내드릴게요! 기대하셔도 좋아요 ㅋㅋㅋ', tone: '⚡ 유쾌한 티키타카형' },
          { text: '네 좋아요! 이번 주는 푹 쉬시구 주말에 맛있는 거 먹으러 가요 :)', tone: '🌿 부담 없는 쿨톤형' }
        ]
      }
    }
  },
  {
    id: 'friend',
    name: '민호 (절친)',
    role: '친구 & 일상',
    avatar: '🍻',
    bgBadge: '#10b981',
    initialMessage: '야 너 오늘 칼퇴하냐?? 오늘 치맥 땡기는데 동네에서 급번개 고?? 🍺',
    repliesTree: {
      default: {
        partnerReply: '오케이 ㅋㅋㅋ 7시 반에 동네 깐부치킨 앞 어때? 내가 먼저 자리 잡고 있을게',
        analysis: '친구의 빠른 수락에 신나하며 약속 장소와 시간을 주도적으로 잡으려는 유쾌한 텐션입니다.',
        coaching: '약속 시간 확인과 함께 늦지 않겠다는 맞장구로 텐션을 맞추세요.',
        suggestions: [
          { text: '오키 7시 반 딱 대라 ㅋㅋㅋ 칼퇴하고 바로 쏜다 생맥 먼저 시켜놔', tone: '⚡ 찰진 찐친형' },
          { text: '굿굿! 나 지하철 내리자마자 바로 뛰어갈게 이따 봐 ㅋㅋㅋ', tone: '🏃 신속 합류형' },
          { text: '콜! 오늘 회사 썰 보따리 풀 테니까 각오해라 ㅋㅋㅋ', tone: '🔥 썰 보따리형' },
          { text: '오키 확인~ 7시 반에 거기서 보자!', tone: '🧊 깔끔 확인형' }
        ]
      }
    }
  }
];

export default function LiveSimulatorModal({ isOpen, onClose }) {
  const [activePartnerId, setActivePartnerId] = useState('mom');
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [currentAnalysis, setCurrentAnalysis] = useState(null);
  const [copiedIndex, setCopiedIndex] = useState(null);
  const [toastMsg, setToastMsg] = useState(null);

  const activePartner = SIMULATOR_PARTNERS.find(p => p.id === activePartnerId) || SIMULATOR_PARTNERS[0];
  const chatScrollRef = useRef(null);

  // Initialize partner chat
  useEffect(() => {
    if (!isOpen) return;

    setMessages([
      {
        id: 1,
        sender: 'partner',
        text: activePartner.initialMessage,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
    ]);

    // Initial Live Analysis
    setCurrentAnalysis({
      opponentIntent: `${activePartner.name}님이 대화를 먼저 건네며 호의적이고 다정한 소통을 기대하고 있습니다.`,
      coachingAdvice: '상대방의 톤에 맞춰 감정적 교감을 나누거나 핵심 의도를 명확하게 짚어주는 대사를 선택하세요.',
      suggestions: [
        { text: '네! 말씀해주셔서 감사해요 ㅎㅎ 걱정 안 하셔도 돼요!', tone: '✨ 다정한 호응형' },
        { text: '확인했습니다! 바로 준비해서 말씀드릴게요 :)', tone: '⚡ 신속 깔끔형' },
        { text: '오늘 하루도 정말 고생 많으셨어요! 편안한 저녁 되세요 ❤️', tone: '💖 따뜻한 배려형' },
        { text: '네 ㅎㅎ 덕분에 기분 좋게 하루 마무리하네요!', tone: '🌿 자연스러운 쿨톤형' }
      ]
    });
  }, [activePartner, isOpen]);

  useEffect(() => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  const showToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 2500);
  };

  const handleCopy = async (idx, text) => {
    const success = await copyTextToClipboard(text);
    if (success) {
      setCopiedIndex(idx);
      showToast('클립보드에 복사되었습니다!');
      setTimeout(() => setCopiedIndex(null), 2500);
    }
  };

  const handleSendMessage = (textToSend) => {
    if (!textToSend.trim() || isTyping) return;

    const userMsg = {
      id: Date.now(),
      sender: 'me',
      text: textToSend,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    setInputText('');
    setIsTyping(true);

    // Simulate partner real-time response & Sync live coaching
    setTimeout(() => {
      setIsTyping(false);
      const tree = activePartner.repliesTree.default;

      const partnerMsg = {
        id: Date.now() + 1,
        sender: 'partner',
        text: tree.partnerReply,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setMessages(prev => [...prev, partnerMsg]);

      // Update Live AI Coaching
      setCurrentAnalysis({
        opponentIntent: tree.analysis,
        coachingAdvice: tree.coaching,
        suggestions: tree.suggestions
      });
    }, 1200);
  };

  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(0,0,0,0.75)',
      backdropFilter: 'blur(8px)',
      zIndex: 1000,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px'
    }}>
      <div className="gemini-card animate-fade-in" style={{
        maxWidth: '900px',
        width: '100%',
        height: '88vh',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        boxShadow: 'var(--shadow-lg)',
        border: '1px solid rgba(66, 133, 244, 0.3)'
      }}>
        {/* Modal Top Bar */}
        <div style={{
          padding: '14px 20px',
          borderBottom: '1px solid var(--color-border)',
          background: 'var(--color-surface)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '4px 10px',
              borderRadius: 'var(--radius-pill)',
              background: 'rgba(239, 68, 68, 0.12)',
              color: '#ef4444',
              fontSize: '0.8rem',
              fontWeight: 700
            }}>
              <Radio size={14} className="gemini-sparkle-anim" />
              <span>실시간 카톡 라이브 코칭 모드</span>
            </div>
            <span style={{ fontSize: '0.86rem', color: 'var(--color-text-dim)' }}>
              상대방과 실시간으로 톡을 주고받으며 Sync AI의 즉각적인 추천 대사를 받아보세요!
            </span>
          </div>

          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', color: 'var(--color-text-dim)', cursor: 'pointer', padding: '4px' }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Modal Body: Left Partner Selector & Live Chat + Right Live AI Coaching Panel */}
        <div style={{ flex: 1, display: 'flex', minHeight: 0, overflow: 'hidden' }}>
          {/* Left Column: Kakao Simulator Room */}
          <div style={{ flex: '1 1 55%', display: 'flex', flexDirection: 'column', borderRight: '1px solid var(--color-border)', background: 'var(--color-bg-base)' }}>
            {/* Partner Switcher */}
            <div style={{ padding: '10px 14px', background: 'var(--color-surface)', borderBottom: '1px solid var(--color-border)', display: 'flex', gap: '6px', overflowX: 'auto' }}>
              {SIMULATOR_PARTNERS.map(p => {
                const isSelected = p.id === activePartnerId;
                return (
                  <button
                    key={p.id}
                    onClick={() => setActivePartnerId(p.id)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '6px 12px',
                      borderRadius: 'var(--radius-pill)',
                      border: isSelected ? '1px solid #4285f4' : '1px solid var(--color-border)',
                      background: isSelected ? 'rgba(66, 133, 244, 0.15)' : 'transparent',
                      color: isSelected ? '#4285f4' : 'var(--color-text-muted)',
                      fontSize: '0.82rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    <span>{p.avatar}</span>
                    <span>{p.name}</span>
                  </button>
                );
              })}
            </div>

            {/* Kakao Styled Chat Scroll Area */}
            <div ref={chatScrollRef} style={{ flex: 1, overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px', background: 'rgba(0,0,0,0.03)' }}>
              {messages.map(msg => (
                <div
                  key={msg.id}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: msg.sender === 'me' ? 'flex-end' : 'flex-start'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '3px' }}>
                    {msg.sender === 'partner' && (
                      <span style={{ fontSize: '0.74rem', fontWeight: 700, color: 'var(--color-text-main)' }}>
                        {activePartner.name}
                      </span>
                    )}
                    <span style={{ fontSize: '0.68rem', color: 'var(--color-text-dim)' }}>
                      {msg.time}
                    </span>
                  </div>

                  <div className={`chat-bubble ${msg.sender === 'me' ? 'me' : 'other'}`} style={{ maxWidth: '85%' }}>
                    {msg.text}
                  </div>
                </div>
              ))}

              {isTyping && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 12px', background: 'var(--color-surface)', borderRadius: 'var(--radius-pill)', width: 'fit-content', border: '1px solid var(--color-border)' }}>
                  <Zap size={14} color="#4285f4" className="gemini-sparkle-anim" />
                  <span style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)' }}>
                    {activePartner.name}님이 입력 중입니다...
                  </span>
                </div>
              )}
            </div>

            {/* Bottom Input Area */}
            <div style={{ padding: '12px 14px', background: 'var(--color-surface)', borderTop: '1px solid var(--color-border)', display: 'flex', gap: '8px' }}>
              <input
                type="text"
                placeholder={`${activePartner.name}님에게 보낼 메시지 입력...`}
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSendMessage(inputText);
                }}
                disabled={isTyping}
                style={{
                  flex: 1,
                  padding: '10px 14px',
                  borderRadius: 'var(--radius-pill)',
                  border: '1px solid var(--color-border)',
                  background: 'var(--color-bg-base)',
                  color: 'var(--color-text-main)',
                  fontSize: '0.88rem',
                  outline: 'none'
                }}
              />
              <button
                onClick={() => handleSendMessage(inputText)}
                disabled={!inputText.trim() || isTyping}
                className="gemini-btn-primary"
                style={{ padding: '8px 16px' }}
              >
                <Send size={15} />
              </button>
            </div>
          </div>

          {/* Right Column: Real-time Live Sync AI Coaching & 4 Suggestions */}
          <div style={{ flex: '1 1 45%', display: 'flex', flexDirection: 'column', background: 'var(--color-surface)', overflowY: 'auto', padding: '18px 20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
              <Sparkles size={18} color="#4285f4" className="gemini-sparkle-anim" />
              <h4 style={{ fontSize: '1rem', fontWeight: 800 }}>Sync 실시간 라이브 코칭</h4>
            </div>

            {currentAnalysis && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {/* Real-time Psychology Intent */}
                <div style={{ padding: '12px', borderRadius: 'var(--radius-md)', background: 'rgba(66, 133, 244, 0.08)', borderLeft: '3px solid #4285f4' }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#4285f4', display: 'block', marginBottom: '3px' }}>
                    🎯 상대방의 실시간 심리 분석
                  </span>
                  <p style={{ fontSize: '0.84rem', color: 'var(--color-text-main)', lineHeight: '1.45', margin: 0 }}>
                    {currentAnalysis.opponentIntent}
                  </p>
                </div>

                {/* Real-time Coaching */}
                <div style={{ padding: '10px 12px', borderRadius: 'var(--radius-md)', background: 'rgba(234, 179, 8, 0.1)', display: 'flex', gap: '8px' }}>
                  <Lightbulb size={16} color="#eab308" style={{ flexShrink: 0, marginTop: '2px' }} />
                  <p style={{ fontSize: '0.8rem', color: 'var(--color-text-main)', margin: 0, lineHeight: '1.4' }}>
                    <strong>소통 팁:</strong> {currentAnalysis.coachingAdvice}
                  </p>
                </div>

                {/* 4 Real-time Click-to-Send Suggestions */}
                <div>
                  <span style={{ fontSize: '0.84rem', fontWeight: 700, color: 'var(--color-text-dim)', display: 'block', marginBottom: '8px' }}>
                    ⚡ 클릭 시 실시간 전송되는 추천 대사 4종
                  </span>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {currentAnalysis.suggestions.map((sug, idx) => (
                      <div
                        key={idx}
                        style={{
                          padding: '12px',
                          borderRadius: 'var(--radius-md)',
                          background: 'var(--color-bg-base)',
                          border: '1px solid var(--color-border)',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '6px',
                          transition: 'all 0.15s ease'
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontSize: '0.74rem', color: '#4285f4', fontWeight: 700 }}>
                            {sug.tone}
                          </span>
                          <button
                            onClick={() => handleCopy(idx, sug.text)}
                            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-dim)', padding: '2px' }}
                            title="복사"
                          >
                            {copiedIndex === idx ? <Check size={13} color="#10b981" /> : <Copy size={13} />}
                          </button>
                        </div>

                        <p style={{ fontSize: '0.86rem', color: 'var(--color-text-main)', margin: 0, lineHeight: '1.45' }}>
                          "{sug.text}"
                        </p>

                        <button
                          onClick={() => handleSendMessage(sug.text)}
                          disabled={isTyping}
                          className="gemini-btn-primary"
                          style={{ padding: '5px 10px', fontSize: '0.76rem', alignSelf: 'flex-end', gap: '4px' }}
                        >
                          <Send size={12} />
                          <span>이 대사로 실시간 답장</span>
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Toast */}
      {toastMsg && (
        <div className="toast-container">
          <div className="toast">
            <Check size={15} color="#10b981" />
            <span>{toastMsg}</span>
          </div>
        </div>
      )}
    </div>
  );
}
