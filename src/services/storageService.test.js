import { beforeEach, test } from 'node:test';
import assert from 'node:assert/strict';
import { clearAllSessions, getAllSessions } from './storageService.js';

const values = new Map();
globalThis.localStorage = {
  getItem: (key) => values.get(key) ?? null,
  setItem: (key, value) => values.set(key, String(value)),
  removeItem: (key) => values.delete(key),
};
beforeEach(() => values.clear());

test('전체 삭제 후 이전 버전 대화가 다시 생성되지 않는다', () => {
  localStorage.setItem('sync_chat_sessions_v1', JSON.stringify([{ rawText: 'synthetic-old-message' }]));
  localStorage.setItem('sync_chat_sessions_v2', JSON.stringify([{ id: 'new' }]));
  clearAllSessions();
  assert.deepEqual(getAllSessions(), []);
  assert.equal(localStorage.getItem('sync_chat_sessions_v1'), null);
});

test('성공적인 이전 후 중복 원본을 제거한다', () => {
  localStorage.setItem('sync_chat_sessions_v1', JSON.stringify([{ rawText: 'synthetic-message' }]));
  assert.equal(getAllSessions()[0].messages[0].text, 'synthetic-message');
  assert.equal(localStorage.getItem('sync_chat_sessions_v1'), null);
  assert.equal(getAllSessions().length, 1);
});

test('손상된 저장 데이터의 내용이 오류 로그에 남지 않는다', () => {
  localStorage.setItem('sync_chat_sessions_v2', 'synthetic-private-value-invalid-json');
  const original = console.error;
  const logged = [];
  console.error = (...args) => logged.push(args.join(' '));
  try {
    assert.deepEqual(getAllSessions(), []);
    assert.ok(logged.length > 0);
    assert.ok(logged.every((line) => !line.includes('synthetic-private-value')));
  } finally { console.error = original; }
});
