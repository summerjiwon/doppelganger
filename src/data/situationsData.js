// Comprehensive Real-life Korean Messenger & KakaoTalk Scenarios

export const SITUATION_CATEGORIES = [
  { id: 'all', label: '🌟 전체 상황', icon: 'Sparkles' },
  { id: 'family', label: '👨‍👩‍👧 부모님 & 가족', icon: 'Home' },
  { id: 'important', label: '👔 중요 상황 & 업무', icon: 'Briefcase' },
  { id: 'friend', label: '🍻 친구 & 일상', icon: 'Coffee' },
  { id: 'dating', label: '💘 소개팅 & 썸', icon: 'Heart' },
  { id: 'rejection', label: '🛑 정중한 거절', icon: 'ShieldAlert' },
  { id: 'romance', label: '❤️ 연인 & 화해', icon: 'Flame' }
];

export const SITUATIONS = [
  // 1. 부모님 & 가족
  {
    id: 'family_mom_care',
    category: 'family',
    categoryName: '부모님 & 가족',
    title: '❤️ 엄마의 밥 챙겨먹으라는 안부 톡',
    description: '혼자 사는 자식 걱정에 밥은 먹었는지 묻는 엄마에게 안심과 애정을 전하는 답장',
    badge: '#효도톡 #걱정안심',
    text: `[엄마] [오후 7:30] 아들~ 오늘 일 끝나고 저녁은 챙겨 먹었니? 날 추운데 따뜻하게 입고 다녀`
  },
  {
    id: 'family_allowance_thanks',
    category: 'family',
    categoryName: '부모님 & 가족',
    title: '🎁 부모님의 용돈/반찬 선물에 감동 감사',
    description: '용돈이나 반찬을 보내주신 부모님께 무뚝뚝하지 않게 진심 어린 감사 표현하기',
    badge: '#감동답장 #진심감사',
    text: `[아빠] [오전 11:00] 통장으로 조금 보냈다. 맛있는 거 사 먹고 힘내거라.`
  },
  {
    id: 'family_late_home',
    category: 'family',
    categoryName: '부모님 & 가족',
    title: '🌙 늦은 귀가 시 부모님 안심시키기',
    description: '야근이나 회식으로 귀가가 늦어질 때 부모님이 잠 못 이루지 않도록 센스 있게 알리기',
    badge: '#안심톡 #가족소통',
    text: `[엄마] [오후 10:45] 민준아 아직 밖이니? 언제쯤 들어오니 걱정된다.`
  },

  // 2. 중요 상황 & 비즈니스/공적 관계
  {
    id: 'work_urgent',
    category: 'important',
    categoryName: '중요 상황 & 업무',
    title: '💼 상사의 긴급 추가 업무 지시',
    description: '갑작스러운 업무 요청에 신뢰감을 주면서 일정과 범위를 명확히 정리하고 싶을 때',
    badge: '#프로페셔널 #신뢰도UP',
    text: `--------------- 2026년 8월 14일 금요일 ---------------
[팀장님] [오전 11:20] 민준씨, 지난주 요청했던 3분기 기획안 수정본 오늘 오후 3시까지 확인 가능할까요?
[팀장님] [오전 11:21] 디자인 파트랑도 일정 조율 한번 필요할 것 같습니다.`
  },
  {
    id: 'work_delay',
    category: 'important',
    categoryName: '중요 상황 & 업무',
    title: '⏳ 마감 기한 연기 정중한 양해',
    description: '예상치 못한 변수로 마감 기한 연장이 필요할 때, 핑계 없이 신뢰를 지키는 법',
    badge: '#일정조율 #리스크관리',
    text: `[부장님] [오후 2:00] 김대리, 데이터 분석 리포트 오늘 퇴근 전까지 올라오나?`
  },
  {
    id: 'work_followup',
    category: 'important',
    categoryName: '중요 상황 & 업무',
    title: '🤝 중요 거래처 일정 정중한 독촉',
    description: '기한이 다가오는데 회신이 없는 거래처에 기분 나쁘지 않게 진행 상황 확인하기',
    badge: '#정중한독촉 #비즈니스',
    text: `[외주업체 대표] [3일 전] 네 과장님 확인했습니다. 제작 진행 후 일정 다시 공유드리겠습니다.`
  },
  {
    id: 'social_mentor_greeting',
    category: 'important',
    categoryName: '중요 상황 & 업무',
    title: '🙇 교수님/은사님께 명절 & 감사 인사',
    description: '복붙 느낌 없이 진정성과 감사한 마음이 느껴지는 정중한 안부 인사',
    badge: '#명절인사 #예의만점',
    text: `[교수님] [명절 전날] 민준 학생, 이번 학기 과제 잘 확인했네. 즐거운 명절 보내게.`
  },

  // 3. 친구 & 일상
  {
    id: 'friend_lightning',
    category: 'friend',
    categoryName: '친구 & 일상',
    title: '🍻 칼퇴 후 급번개 치맥 제안',
    description: '친구의 즉흥 약속 제안에 텐션을 올리며 유쾌하게 약속을 확정 지을 때',
    badge: '#찐친텐션 #번개약속',
    text: `--------------- 2026년 8월 14일 금요일 ---------------
[친구] [오후 5:30] 야 너 오늘 칼퇴하냐??
[친구] [오후 5:31] 오늘 치맥 땡기는데 동네에서 급번개 고?? 🍺`
  },
  {
    id: 'friend_comfort',
    category: 'friend',
    categoryName: '친구 & 일상',
    title: '🥺 친구의 힘든 일 & 폭풍 공감',
    description: '친구가 회사나 인간관계로 지쳐 하소연할 때, 진심 어린 위로와 편이 되어주기',
    badge: '#감동위로 #내편',
    text: `[친구] [오후 10:15] 하 오늘 진짜 회사에서 멘탈 탈탈 털렸다...
[친구] [오후 10:16] 나만 맨날 바보 되는 것 같고 진짜 그만두고 싶네 ㅠㅠ`
  },
  {
    id: 'friend_late',
    category: 'friend',
    categoryName: '친구 & 일상',
    title: '🏃 약속에 늦었을 때 센스 있는 사과',
    description: '차가 막히거나 늦잠으로 늦었을 때 친구의 화를 누그러뜨리는 센스 만점 사과',
    badge: '#밉지않은사과 #유머센스',
    text: `[친구] [오후 1:50] 야 나 도착했는데 어디냐? 설마 아직 출발 안 함? ㅡㅡ`
  },

  // 4. 소개팅 & 썸
  {
    id: 'dating_after',
    category: 'dating',
    categoryName: '소개팅 & 썸',
    title: '💌 첫 만남 후 애프터 신청',
    description: '소개팅이 끝난 후 집 가는 길, 자연스럽게 호감을 표현하고 다음 약속을 잡고 싶을 때',
    badge: '#설렘가득 #애프터',
    text: `--------------- 2026년 8월 14일 금요일 ---------------
[상대방] [오후 9:45] 민준씨 오늘 정말 즐거웠어요! 맛있는 파스타도 사주시고 조심히 들어가세요 ㅎㅎ
[나] [오후 9:48] 저도 오늘 시간 가는 줄 몰랐어요! 지은씨도 조심히 들어가셨나요?
[상대방] [오후 9:52] 넵 방금 집에 막 도착했어요! 오늘 말씀해주셨던 디저트 카페 이야기 너무 재밌었어요 😊`
  },
  {
    id: 'dating_revive',
    category: 'dating',
    categoryName: '소개팅 & 썸',
    title: '💬 톡이 끊길 때 자연스러운 질문',
    description: '상대방이 단답이나 리액션만 남겨서 대화가 끊어지려 할 때 부드럽게 티키타카 살리기',
    badge: '#대화연장 #호감질문',
    text: `[상대방] [오후 8:10] 아 네네 ㅋㅋㅋ 맞아요
[상대방] [오후 8:11] 오늘 날씨 진짜 덥더라구요`
  },
  {
    id: 'dating_flirt',
    category: 'dating',
    categoryName: '소개팅 & 썸',
    title: '✨ 은근한 칭찬 & 플러팅 멘트',
    description: '너무 노골적이지 않으면서도 상대방의 심장을 간지럽히는 센스 있는 칭찬',
    badge: '#심쿵유발 #밀당',
    text: `[상대방] [오후 6:30] 저 오늘 새로운 옷 입고 나왔는데 어때요? 좀 어색한 것 같기도 하고...
[상대방] [오후 6:31] [사진]`
  },

  // 5. 정중한 거절
  {
    id: 'rejection_after',
    category: 'rejection',
    categoryName: '정중한 거절',
    title: '🚫 호감 없는 상대의 애프터 거절',
    description: '상대방의 자존감을 지켜주면서도 여지를 남기지 않는 깔끔하고 정중한 거절',
    badge: '#상처없는거절 #여지차단',
    text: `[소개팅 상대] [오전 11:00] 지은씨 주말 잘 보내셨나요? 혹시 이번 주 수요일이나 목요일 저녁에 지난번 말씀드린 일식당 같이 가실래요?`
  },
  {
    id: 'rejection_money',
    category: 'rejection',
    categoryName: '정중한 거절',
    title: '💸 지인의 돈/부탁 완곡한 거절',
    description: '관계는 해치지 않으면서 금전 대여나 곤란한 부탁을 단호하게 거절하는 방법',
    badge: '#관계보호 #단호한거절',
    text: `[지인] [오후 3:20] 오랜만이다 잘 지내지? 다름이 아니라 내가 이번 달에 급하게 쓸 곳이 있어서 그런데 50만원만 다음 달까지 빌려줄 수 있을까? ㅠㅠ`
  },
  {
    id: 'rejection_gathering',
    category: 'rejection',
    categoryName: '정중한 거절',
    title: '🙅 가기 싫은 모임/회식 정중히 사양',
    description: '주말 약속이나 부담스러운 모임 초대에 핑계 없이 깔끔하게 사양하기',
    badge: '#부담제로 #깔끔사양',
    text: `[선배] [오후 2:00] 이번 주말에 동기 모임 있는데 시간 돼? 다들 너 온다고 기대 중인데!`
  },

  // 6. 연인 & 화해
  {
    id: 'romance_upset',
    category: 'romance',
    categoryName: '연인 & 화해',
    title: '💔 서운한 점 싸우지 않고 털어놓기',
    description: '비난조가 아닌 ‘나 전달법(I-message)’으로 연인에게 속마음을 부드럽게 전달하기',
    badge: '#싸움방지 #다정한소통',
    text: `[연인] [오후 11:30] 오늘 친구들이랑 술 마시느라 연락 늦었어 ㅠㅠ 자?`
  },
  {
    id: 'romance_apology',
    category: 'romance',
    categoryName: '연인 & 화해',
    title: '🕊️ 다툰 후 먼저 자존심 안 상하게 화해',
    description: '어색한 냉전 상태를 깨고 상대방 마음을 풀어주는 따뜻한 화해의 손길',
    badge: '#화해의기술 #애정회복',
    text: `[연인] [어제 오후 10:00] 그냥 오늘은 각자 생각할 시간 갖자. (이후 대화 없음)`
  },
  {
    id: 'romance_anniversary',
    category: 'romance',
    categoryName: '연인 & 화해',
    title: '🎁 기념일 감동 장문 카톡',
    description: '형식적인 축하가 아닌 평소의 고마움과 애정이 듬뿍 담긴 감동 메시지',
    badge: '#감동100배 #기념일',
    text: `[연인] [오전 0:01] 여보 우리 벌써 1년이야!! 시간 진짜 빠르다 사랑해 ❤️`
  }
];
