# Doppelganger Android Capture MVP

이 모듈은 Doppelganger의 첫 번째 기능인 **사용자 동의 기반 메시지 수집**의 기반입니다.

- 기본 수집 대상: 카카오톡(`com.kakao.talk`)
- 수집 조건: Android 알림 접근 권한과 Sync 내부 수집 스위치가 모두 켜져야 함
- 보관: Android Keystore 키로 AES-GCM 암호화한 기기 내부 임시 보관함
- 보존: 최대 200개, 최대 24시간
- 제외: 화면 OCR, 접근성 서비스, 서버 전송, 분석 호출, 자동 답장

## 왜 알림 이벤트인가

알림이 새로 등록될 때만 Android가 `NotificationCaptureService`를 호출합니다. 앱이 화면을 지속적으로 감시하거나 반복적으로 깨어날 필요가 없어 배터리와 메모리 사용량을 낮춥니다.

## 로컬 빌드 준비

Android Studio 설치 후 아래 환경으로 엽니다.

- JDK 17
- Android SDK Platform 35
- Android SDK Build-Tools

Android Studio에서 `android/` 폴더를 열고 Gradle Sync를 실행하세요.

## 다음 구현 순서

1. 외국어 감지와 온디바이스 번역
2. 사용자 저장 문장 기반 로컬 말투 프로필
3. 사용자 탭으로만 열리는 추천 답장 패널
4. 오버레이와 앱별 허용 목록 UI
