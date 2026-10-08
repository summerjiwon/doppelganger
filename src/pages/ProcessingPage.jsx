import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Sparkles } from 'lucide-react';
import { analyzeConversation } from '../services/aiService';
import { saveSession } from '../services/storageService';

const STATUS_STEPS = [
  '날짜 구분선 및 시스템 메시지 정제 중...',
  '대화 참여자 및 맥락을 구조화하는 중...',
  '상대방의 숨은 심리와 핵심 의도를 분석하는 중...',
  '사용자님의 평소 말투와 어미 특징을 파악하는 중...',
  '상황에 가장 완벽한 4가지 맞춤 대사를 생성하는 중...'
];

export default function ProcessingPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const text = location.state?.text;
  const continuingSession = location.state?.continuingSession || null;
  const [stepIndex, setStepIndex] = useState(0);

  useEffect(() => {
    if (!text) {
      navigate('/', { replace: true });
      return;
    }

    const interval = setInterval(() => {
      setStepIndex((prev) => (prev < STATUS_STEPS.length - 1 ? prev + 1 : prev));
    }, 400);

    const processAI = async () => {
      try {
        const result = await analyzeConversation(text, continuingSession);
        
        // Save to LocalStorage
        const sessionPayload = {
          id: continuingSession?.id || 'sess_' + Date.now(),
          title: continuingSession ? continuingSession.title : result.title,
          rawText: continuingSession ? `${continuingSession.rawText}\n\n[추가 대화]\n${text}` : text,
          parsedMessages: result.parsedMessages,
          insights: result.insights,
          replies: result.replies,
          updatedAt: new Date().toISOString()
        };
        saveSession(sessionPayload);

        setTimeout(() => {
          clearInterval(interval);
          navigate('/result', {
            state: {
              result,
              session: sessionPayload
            },
            replace: true
          });
        }, 1600);
      } catch (error) {
        console.error('AI Analysis failed:', error);
        clearInterval(interval);
        navigate('/', { state: { error: '분석에 실패했습니다. 다시 시도해주세요.' }, replace: true });
      }
    };

    processAI();

    return () => clearInterval(interval);
  }, [text, continuingSession, navigate]);

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '80vh', padding: '32px 20px', textAlign: 'center' }}>
      <div style={{
        position: 'relative',
        width: '90px',
        height: '90px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: '28px'
      }}>
        {/* Glowing Background Pulse */}
        <div style={{
          position: 'absolute',
          inset: 0,
          borderRadius: '50%',
          background: 'var(--gemini-gradient)',
          opacity: 0.25,
          filter: 'blur(16px)',
          animation: 'geminiPulse 2s infinite'
        }}></div>

        <div style={{
          width: '76px',
          height: '76px',
          borderRadius: '50%',
          background: 'var(--color-surface)',
          border: '2px solid rgba(66, 133, 244, 0.4)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: 'var(--shadow-md)'
        }}>
          <Sparkles size={36} color="#4285f4" className="gemini-sparkle-anim" />
        </div>
      </div>

      <h2 style={{ fontSize: '1.4rem', fontWeight: 700, marginBottom: '10px' }}>
        {continuingSession ? '이전 대화 맥락을 반영하여 분석 중...' : 'Gemini가 대화를 분석하고 있습니다'}
      </h2>

      <p style={{
        fontSize: '0.96rem',
        color: '#4285f4',
        fontWeight: 600,
        minHeight: '28px',
        transition: 'all 0.3s ease'
      }}>
        {STATUS_STEPS[stepIndex]}
      </p>

      <div style={{ width: '200px', height: '4px', background: 'var(--color-border)', borderRadius: '100px', overflow: 'hidden', marginTop: '20px' }}>
        <div style={{
          width: `${((stepIndex + 1) / STATUS_STEPS.length) * 100}%`,
          height: '100%',
          background: 'var(--gemini-gradient)',
          transition: 'width 0.4s ease'
        }}></div>
      </div>
    </div>
  );
}
