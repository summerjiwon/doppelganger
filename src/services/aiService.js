// Enhanced AI Conversation Analysis & Context Engine for Sync

/**
 * Checks if a line is a date divider, timestamp header, or system message in KakaoTalk/Messengers.
 */
function isSystemOrDateLine(line) {
  const trimmed = line.trim();
  if (!trimmed) return true;

  // Date dividers: "--------------- 2026년 8월 14일 금요일 ---------------"
  if (/^-+\s*\d{4}년\s*\d{1,2}월\s*\d{1,2}일.*-+$/.test(trimmed)) return true;
  if (/^\d{4}년\s*\d{1,2}월\s*\d{1,2}일\s*(?:월|화|수|목|금|토|일)요일?$/.test(trimmed)) return true;
  if (/^\d{4}[./-]\d{1,2}[./-]\d{1,2}(?:\s*(?:오전|오후)?\s*\d{1,2}:\d{1,2})?$/.test(trimmed)) return true;

  // System events in KakaoTalk / Messengers
  if (/^.*님이\s*(?:들어왔습니다|나갔습니다|초대되었습니다|퇴장했습니다|입장했습니다)\.?$/.test(trimmed)) return true;
  if (/^.*채팅방을 나갔습니다\.?$/.test(trimmed)) return true;
  if (/^삭제된 메시지입니다\.?$/.test(trimmed)) return true;
  if (/^송금(을 완료했습니다|이 완료되었습니다|을 받으세요)\.?$/.test(trimmed)) return true;
  if (/^(?:사진|동영상|음성메시지|파일|보이스톡|페이스톡|이모티콘|샵검색)$/.test(trimmed)) return true;

  return false;
}

/**
 * Clean & Parses raw text into structured chat messages, ignoring system/date noise.
 */
export function parseChatMessages(rawText) {
  if (!rawText || !rawText.trim()) return [];

  const rawLines = rawText.split('\n');
  const messages = [];
  const detectedSenders = new Set();

  // Pattern 1: Kakao standard export format: "[이름] [시간] 메시지"
  const kakaoRegex = /^\[([^\]]+)\]\s*(?:\[[^\]]+\])?\s*(.+)$/;
  // Pattern 2: Simple colon format: "이름: 메시지"
  const colonRegex = /^([^:\n]{1,20})[:：]\s*(.+)$/;

  for (const line of rawLines) {
    const trimmed = line.trim();
    if (!trimmed || isSystemOrDateLine(trimmed)) {
      continue;
    }

    const kakaoMatch = trimmed.match(kakaoRegex);
    const colonMatch = trimmed.match(colonRegex);

    if (kakaoMatch) {
      const sender = kakaoMatch[1].trim();
      const content = kakaoMatch[2].trim();
      if (!isSystemOrDateLine(content)) {
        detectedSenders.add(sender);
        messages.push({ sender, text: content });
      }
    } else if (colonMatch) {
      const sender = colonMatch[1].trim();
      const content = colonMatch[2].trim();
      if (!isSystemOrDateLine(content)) {
        detectedSenders.add(sender);
        messages.push({ sender, text: content });
      }
    } else {
      messages.push({
        sender: messages.length % 2 === 0 ? '상대방' : '나',
        text: trimmed
      });
    }
  }

  const senderList = Array.from(detectedSenders);
  const userSender = senderList.find(s => s === '나' || s === 'me' || s === 'Me') || (senderList.length > 1 ? senderList[1] : '나');

  return messages.map(m => ({
    ...m,
    isMe: m.sender === userSender || m.sender === '나'
  }));
}

/**
 * Generates an appropriate, concise chat session title from user prompt or parsed log.
 */
export function generateSessionTitle(text, parsedMessages) {
  if (parsedMessages && parsedMessages.length > 0) {
    const lastMsg = parsedMessages[parsedMessages.length - 1];
    const snippet = lastMsg.text.replace(/[\r\n]+/g, ' ').slice(0, 20);
    return `${snippet}... 대화 분석`;
  }
  const clean = text.replace(/[\r\n]+/g, ' ').trim().slice(0, 22);
  return clean ? `${clean}...` : '새 대화 분석';
}

/**
 * Analyzes conversation history with deep contextual deduction across Parents, Important, Friends, Dating, Conflict, etc.
 */
export async function analyzeConversation(inputText, messageHistory = []) {
  // Simulate AI model inference latency
  await new Promise(resolve => setTimeout(resolve, 700));

  const parsedCurrent = parseChatMessages(inputText);
  
  const previousLogs = messageHistory
    .map(m => (m.role === 'user' ? m.text : ''))
    .filter(Boolean)
    .join('\n');

  const fullText = previousLogs ? `${previousLogs}\n${inputText}` : inputText;
  const allParsed = parseChatMessages(fullText);

  const hasHonorific = /요|습니다|십니까|셨어요|드려요|감사합니다|죄송합니다|부탁드립니다|보내게/.test(fullText);
  const hasEmoji = /ㅋㅋ|ㅎㅎ|ㅠㅠ|ㅜㅜ|!!|~\^|:\)|❤️|👍|😊|🙏|🔥|🍺/.test(fullText);

  // 1. 부모님 & 가족 감지
  const isFamily = /엄마|아빠|어머니|아버지|할머니|할아버지|이모|삼촌|아들|딸|용돈|통장|밥 먹었니|밥은|반찬|김치|집에|귀가|따뜻하게|조심히 다녀|추운데/.test(fullText);

  // 2. 중요 상황 & 공적/비즈니스 감지
  const isImportantWork = /팀장님|부장님|과장님|대표님|이사님|사장님|교수님|거래처|고객|클라이언트|계약|결재|기획안|수정본|보고|마감|납기|면접|공문|외주|일정|컨펌|리포트/.test(fullText) && !isFamily;

  // 3. 정중한 거절 & 곤란한 요청 감지
  const isRejection = /거절|빌려|50만원|동기 모임|시간 돼|일식당 같이|안 될|어려울|죄송한데|사양|부담/.test(fullText) && !isFamily;

  // 4. 연인 & 애정/갈등 감지
  const isRomanceConflict = /서운|술 마시느라|생각할 시간|다툰|화해|기념일|1년이야|사랑해|자기야|여보|삐졌/.test(fullText) && !isFamily;

  // 5. 친구 & 일상 감지
  const isFriend = /야 너|칼퇴|치맥|급번개|멘탈|털렸다|킹받|도착했는데|설마|놀자|개웃기|존잼|썰|동네/.test(fullText) && !hasHonorific && !isImportantWork && !isFamily;

  let relationship = '호감 형성 / 썸 & 소개팅 단계';
  let atmosphere = '설레고 조심스러운 긍정적 기류';
  let opponentIntent = '나에 대한 호감과 다음 만남 또는 대화의 긍정적 신호를 기대하고 있습니다.';
  let coachingAdvice = '상대방의 말에 따뜻하게 공감하면서도, 가벼운 질문을 얹어 자연스럽게 다음 대화를 유도하세요.';
  let replies = [];

  if (isFamily) {
    relationship = '👨‍👩‍👧 부모님 & 가족 관계';
    atmosphere = '자식에 대한 애정과 안부를 챙기는 따뜻하고 든든한 가족 분위기';
    opponentIntent = '자식의 건강과 식사, 일상을 걱정하며 다정한 안부를 확인하고 챙겨주고 싶어 합니다.';
    coachingAdvice = '단답으로 무뚝뚝하게 답하지 말고, 식사 여부와 감사함을 표현한 뒤 부모님의 건강과 안부도 다정하게 되물어보세요.';

    replies = [
      {
        id: 1,
        tone: '💖 애정 듬뿍 & 다정한 효도형',
        tag: '#효도톡',
        text: '엄마(아빠) 걱정해 주셔서 감사해요! 저 오늘 든든하게 잘 챙겨 먹었어요 ㅎㅎ 날씨 많이 추운데 엄마(아빠)도 따뜻하게 입고 감기 조심하세요! 사랑해요 ❤️',
        strategy: '부모님을 안심시키고 감사와 사랑을 전해 부모님의 마음을 흐뭇하게 만듭니다.',
        bestFor: '부모님의 안부 톡에 따뜻하게 답장할 때'
      },
      {
        id: 2,
        tone: '🎁 진심 어린 감사 & 식사 대접 약속',
        tag: '#감동답장',
        text: '보내주신 마음 너무 감사해요 ㅠㅠ 덕분에 큰 힘이 돼요! 이번 주말에 제가 맛있는 거 사드릴 테니 같이 식사해요, 항상 감사하고 존경합니다!',
        strategy: '용돈이나 반찬 선물에 대한 진심 어린 감사와 함께 식사 대접으로 보답하는 효도 멘트입니다.',
        bestFor: '용돈이나 반찬을 챙겨주셨을 때'
      },
      {
        id: 3,
        tone: '🌙 늦은 귀가 안심시키기',
        tag: '#안심톡',
        text: '오늘 업무가 조금 늦게 끝났어요! 지금 지하철 타고 집 가는 중이라 30분 뒤면 도착해요. 늦어서 죄송해요, 먼저 편히 주무세요!',
        strategy: '현재 위치와 예상 도착 시간을 명확히 알려 부모님이 잠 못 이루지 않도록 안심시킵니다.',
        bestFor: '야근이나 회식으로 귀가가 늦어질 때'
      },
      {
        id: 4,
        tone: '⚡ 담백 & 밝은 확인형',
        tag: '#밝은답장',
        text: '네! 잘 챙겨 먹고 조심히 들어갈게요 ㅎㅎ 오늘 하루도 고생 많으셨어요!',
        strategy: '부담 없이 깔끔하면서도 밝은 에너지를 전달합니다.',
        bestFor: '가벼운 안부나 당부 말씀에 답할 때'
      }
    ];
  } else if (isImportantWork) {
    relationship = '👔 직장 상사 / 중요 거래처 및 비즈니스 공적 관계 (🚨 중요 상황)';
    atmosphere = '신속한 사실 확인과 명확한 일정(타임라인)을 요구하는 비즈니스 소통';
    opponentIntent = '진행 상황에 대한 확실한 피드백과 책임감 있는 완수 일정을 기대하고 있습니다.';
    coachingAdvice = '결론과 타임라인을 두괄식으로 밝히고, 상사의 확인 리소스를 최소화하는 신뢰감 있는 어조를 유지하세요.';

    replies = [
      {
        id: 1,
        tone: '✨ 프로페셔널 & 신속 확인',
        tag: '#신뢰도UP',
        text: '네, 말씀해주신 수정 사항 확인했습니다. 요청하신 방향대로 정리하여 금일 오후 3시 전까지 초안 보고드리겠습니다. 감사합니다!',
        strategy: '요청 사항 수신 확인과 명확한 완료 시간을 약속하여 상사의 불안감을 완벽히 해소합니다.',
        bestFor: '중요 업무 지시나 컨펌 요청이 들어왔을 때'
      },
      {
        id: 2,
        tone: '⏳ 일정 조율 & 정중한 양해',
        tag: '#리스크예방',
        text: '현재 진행 중인 주요 이슈 검토로 인해 완성도를 높이고자 금일 오후 5시까지 공유드려도 괜찮으실까요? 차질 없이 꼼꼼히 챙기겠습니다.',
        strategy: '완성도 향상을 이유로 들며 현실적인 제출 시간을 정중하게 재조율합니다.',
        bestFor: '마감 기한 연장이나 일정 협의가 필요할 때'
      },
      {
        id: 3,
        tone: '💡 주도적 대안 제시',
        tag: '#기획력어필',
        text: '좋은 방향인 것 같습니다! 이에 더해 리스크를 줄일 수 있는 보완 방안도 함께 정리 중인데, 미팅 때 A/B안 비교해서 말씀드리겠습니다.',
        strategy: '단순 수동 수행을 넘어 주도적으로 고민하는 프로페셔널함을 보여줍니다.',
        bestFor: '전문성을 어필하고 긍정적인 인상을 남길 때'
      },
      {
        id: 4,
        tone: '🌙 휴일/퇴근 후 매너 회신',
        tag: '#워라밸매너',
        text: '과장님, 해당 파일은 [프로젝트 > 3분기] 폴더 내 저장되어 있습니다! 확인 부탁드리며, 추가 검토 사항은 내일 출근 후 신속히 챙기겠습니다. 편안한 저녁 되세요!',
        strategy: '간단한 확인 정보는 주되, 추가 업무 진행은 출근 시간으로 자연스럽게 유도합니다.',
        bestFor: '퇴근 후나 주말에 온 업무 톡에 대처할 때'
      }
    ];
  } else if (isRejection) {
    relationship = '🛑 정중한 경계 설정 & 곤란한 요청 거절 상황';
    atmosphere = '상대방의 기분을 상하게 하지 않으면서 명확하게 선을 그어야 하는 민감한 분위기';
    opponentIntent = '나의 의사를 확인하고자 하며, 거절당할 것에 대한 일말의 불안감이나 기대를 품고 있습니다.';
    coachingAdvice = '감사 인사와 호의를 먼저 인정한 뒤, 거절 사유를 군더더기 없이 담백하게 전달하고 단호하게 여지를 차단하세요.';

    replies = [
      {
        id: 1,
        tone: '🌿 상처 없는 완곡한 거절',
        tag: '#매너거절',
        text: hasHonorific
          ? '말씀해주셔서 감사해요! 아쉽게도 이번 주는 미리 잡힌 개인 일정이 있어서 함께하기 어려울 것 같아요. 모임 재밌게 잘 다녀오세요! 😊'
          : '제안해줘서 고마워! 아쉽지만 이번 주말엔 미리 잡힌 가족 일정이 있어서 못 갈 것 같아 ㅠㅠ 다들 재밌게 놀구 다음에 보자!',
        strategy: '제안에 대한 감사와 불가피한 일정을 이유로 들어 상대방의 자존감을 보호합니다.',
        bestFor: '모임이나 식사 제안을 완곡하게 사양할 때'
      },
      {
        id: 2,
        tone: '🎯 여지 없는 깔끔한 선 긋기',
        tag: '#단호깔끔',
        text: '지난번 시간 내주셔서 정말 감사했습니다. 다만 서로 좋은 인연을 찾아가는 게 맞을 것 같아 조심스럽게 말씀드려요. 항상 좋은 일 가득하시길 응원하겠습니다!',
        strategy: '애매한 여지를 남기지 않고 명확하게 상대방과 나의 관계를 정리합니다.',
        bestFor: '소개팅 애프터나 고백을 확실하게 거절할 때'
      },
      {
        id: 3,
        tone: '🛡️ 원칙 중심의 금전/부탁 거절',
        tag: '#원칙방어',
        text: '오랜만에 연락 줘서 반가운데, 개인적으로 금전 거래는 가까운 사이일수록 하지 않는다는 원칙이 있어서 도움을 주기 어려울 것 같아. 미안하고 일 잘 해결되길 바랄게.',
        strategy: '개인적인 감정이 아닌 확고한 생활 원칙을 이유로 들어 관계 훼손을 최소화합니다.',
        bestFor: '돈 빌려달라는 부탁이나 곤란한 청탁을 거절할 때'
      },
      {
        id: 4,
        tone: '⚡ 쿨한 스케줄 패스',
        tag: '#부담제로',
        text: '초대 고마워요! 제가 요즘 컨디션 조절이 필요해서 이번엔 푹 쉬어가려고 합니다. 다음 기회에 또 봬요!',
        strategy: '구구절절한 변명 없이 담백한 상태를 전달하여 빠른 마무리를 짓습니다.',
        bestFor: '가벼운 회식이나 번개 모임 패스할 때'
      }
    ];
  } else if (isRomanceConflict) {
    relationship = '❤️ 연인 / 깊은 애정 관계 (갈등 또는 애정 표현)';
    atmosphere = '솔직한 감정 공유와 관계 회복의 전환점이 필요한 분위기';
    opponentIntent = '나의 반응을 살피며 미안함, 섭섭함, 혹은 사랑을 확인받고 싶어 합니다.';
    coachingAdvice = '상대방을 비난하기보다 나의 서운했던 감정(I-Message)을 다정하게 표현하고 따뜻한 화해의 제스처로 마무리하세요.';

    replies = [
      {
        id: 1,
        tone: '💖 다정한 속마음 털어놓기 (I-Message)',
        tag: '#갈등완화',
        text: '연락 기다리면서 조금 걱정되고 서운했어 ㅠㅠ 바쁜 건 알지만 짧게라도 미리 톡 하나 남겨주면 마음이 훨씬 편할 것 같아. 푹 쉬구 내일 통화하자 ❤️',
        strategy: '공격적이지 않게 내 감정을 솔직히 말하고 대안을 부드럽게 제시합니다.',
        bestFor: '연락 문제로 서운한 점을 말할 때'
      },
      {
        id: 2,
        tone: '🕊️ 자존심 내려놓은 화해의 손길',
        tag: '#화해치트키',
        text: '어제 내가 감정적으로 굴었던 것 같아서 마음이 계속 안 좋았어. 자기랑 싸우고 싶지 않은데 속상하게 해서 미안해. 오늘 맛있는 거 먹으면서 얼굴 보고 얘기할까?',
        strategy: '시시비비를 따지기 전에 관계의 소중함을 우선시하며 자연스럽게 만남으로 풉니다.',
        bestFor: '싸운 뒤 냉전 상태를 풀고 화해할 때'
      },
      {
        id: 3,
        tone: '✨ 감동 100배 진심 어린 장문',
        tag: '#감동메시지',
        text: '벌써 시간이 이렇게 흘렀네! 항상 내 곁에서 든든하게 힘이 되어주고 아껴줘서 고마워. 앞으로도 지금처럼 서로 아껴주며 행복하자, 내가 더 많이 사랑해 ❤️',
        strategy: '평소 전하지 못했던 깊은 감사와 애정을 듬뿍 담아 특별한 날의 감동을 만듭니다.',
        bestFor: '기념일이나 생일 축하 메시지'
      },
      {
        id: 4,
        tone: '🍯 귀여운 애교로 분위기 반전',
        tag: '#애교만점',
        text: '흥 아직 삐져있지만 목소리 들으면 풀릴지도 몰라! 이따 전화해 줄 거지? 보고 싶어 🥺',
        strategy: '무거운 분위기를 유쾌하고 사랑스러운 텐션으로 전환시킵니다.',
        bestFor: '가벼운 투정이나 삐짐을 귀엽게 표현할 때'
      }
    ];
  } else if (isFriend) {
    relationship = '🍻 편안한 친구 / 절친 지인 관계';
    atmosphere = '격식 없이 유쾌하고 솔직한 일상 분위기';
    opponentIntent = '편하게 일상을 공유하거나 즉흥 만남을 통해 스트레스를 해소하고 싶어 합니다.';
    coachingAdvice = '너무 재지 말고 유쾌한 맞장구나 찐친만의 위트 있는 드립으로 텐션을 끌어올리세요.';

    replies = [
      {
        id: 1,
        tone: '⚡ 찰진 티키타카 & 칼퇴 번개',
        tag: '#웃음보장',
        text: hasEmoji
          ? 'ㅋㅋㅋ 아 진짜 어이없네 칼퇴하고 딱 기다려라 썰 보따리 푼다 🍺'
          : '그럴 줄 알았다 ㅋㅋㅋ 오늘 시간 되지? 맛있는 거 먹으러 가자 내가 쏜다!',
        strategy: '친구의 제안을 유쾌하게 받아치며 빠른 약속으로 이어갑니다.',
        bestFor: '번개 약속이나 맛있는 거 먹으러 갈 때'
      },
      {
        id: 2,
        tone: '🥺 감동 200% 찐친 위로',
        tag: '#폭풍공감',
        text: '아 진짜 고생 많았다 ㅠㅠ 듣기만 해도 킹받네... 너 잘못 하나도 없으니까 자책하지 마! 이번 주말에 맛있는 거 먹고 힐링하자 푹 쉬어 ❤️',
        strategy: '무조건적인 내 편이 되어주어 상대방의 마음의 짐을 덜어줍니다.',
        bestFor: '친구가 회사/일상으로 힘들어할 때'
      },
      {
        id: 3,
        tone: '🏃 밉지 않은 지각 사과',
        tag: '#유머사과',
        text: '죽을죄를 지었습니다 형님 ㅠㅠ 차가 너무 막혀서 10분만 살려주십쇼 도착하자마자 커피 바치겠습니다 ☕️🏃',
        strategy: '빠른 인정과 커피 공약으로 친구의 분노를 유쾌하게 누그러뜨립니다.',
        bestFor: '약속 시간에 늦었을 때'
      },
      {
        id: 4,
        tone: '🧊 쿨한 일시정지',
        tag: '#칼답마무리',
        text: '오키 확인! 나 지금 잠깐 이동 중이라 이따 저녁에 집 가서 다시 톡할게~',
        strategy: '읽씹 없이 자연스럽고 쿨하게 대화를 잠시 멈춥니다.',
        bestFor: '바빠서 지금 즉시 길게 답하기 어려울 때'
      }
    ];
  } else {
    // 썸 / 소개팅 / 일반 호감
    replies = [
      {
        id: 1,
        tone: '✨ 설렘 유발 & 센스 애프터',
        tag: '#호감UP',
        text: hasHonorific
          ? '앗 그렇게 말씀해주시니까 기분 너무 좋네요 ㅎㅎ 지은씨랑 얘기하니까 시간 가는 줄 몰랐어요! 다음엔 제가 취향 저격하는 디저트 카페로 모실게요 😊'
          : '오 진짜? 그렇게 말해주니까 기분 너무 좋네 ㅋㅋㅋ 오늘 덕분에 진짜 재밌었어! 담엔 내가 완전 맛있는 거 사줄게!',
        strategy: '상대방의 호의에 매력적으로 화답하며 다음 만남의 약속으로 자연스럽게 유도합니다.',
        bestFor: '상대의 호감 신호에 센스 있게 화답하고 싶을 때'
      },
      {
        id: 2,
        tone: '💬 세심한 공감 & 다정함',
        tag: '#다정다감',
        text: hasHonorific
          ? '오늘 하루 많이 바쁘셨을 텐데 챙겨주셔서 감사해요 :) 맛있는 저녁 드시고 오늘 밤은 편안하게 푹 쉬세요!'
          : '오늘 진짜 고생 많았어 ㅠㅠ 피곤할 텐데 푹 쉬구 이따가 집 가서 편하게 연락해 :)',
        strategy: '상대의 컨디션을 배려하여 따뜻하고 신뢰감 있는 인상을 심어줍니다.',
        bestFor: '하루를 마무리하거나 상대방의 바쁜 일상을 위로할 때'
      },
      {
        id: 3,
        tone: '🎯 대화 살리기 & 관심 질문',
        tag: '#대화이끌기',
        text: hasHonorific
          ? '어 저도 그거 완전 좋아하는데! 혹시 제일 인상 깊었던 곳(또는 메뉴)이 어디였어요? 궁금해요 ㅎㅎ'
          : '헐 나도 그거 완전 좋아해! 제일 좋아하는 게 어떤 거야? ㅋㅋㅋ',
        strategy: '공통 관심사를 부각시키고 구체적인 질문으로 대화의 몰입도를 높입니다.',
        bestFor: '대화의 텐션을 높이고 서로를 더 알아가고 싶을 때'
      },
      {
        id: 4,
        tone: '⚡ 담백 & 쿨한 밸런스',
        tag: '#부담제로',
        text: hasHonorific
          ? '네 맞아요 ㅎㅎ 공감해주셔서 감사해요. 좋은 저녁 시간 보내세요!'
          : '맞아 맞아 ㅋㅋㅋ 덕분에 재밌었어! 푹 쉬고 내일 또 보자~',
        strategy: '부담 없는 길이와 톤으로 깔끔하게 대화를 이어가거나 마무리합니다.',
        bestFor: '과하지 않게 쿨한 밸런스를 유지하고 싶을 때'
      }
    ];
  }

  const sessionTitle = generateSessionTitle(inputText, parsedCurrent);

  return {
    title: sessionTitle,
    rawText: inputText,
    parsedMessages: allParsed.length > 0 ? allParsed : parsedCurrent,
    insights: {
      relationship,
      atmosphere,
      opponentIntent,
      coachingAdvice,
      messageCount: allParsed.length || parsedCurrent.length,
      toneSummary: hasHonorific ? '정중한 존댓말 기반' : '친근하고 편안한 어조'
    },
    replies
  };
}
