import assert from 'node:assert/strict';
import test from 'node:test';
import { createMockApi, MockApiError } from './mockApi.js';

test('DB 없이 회원가입부터 메시지 조회와 polling까지 확인한다', async () => {
  const api = createMockApi();
  const username = `test-${Date.now()}`;

  const signup = await api.signup({ username, password: 'password-123' });
  assert.equal(signup.authenticated, false);
  await assert.rejects(
    api.signup({ username, password: 'password-123' }),
    (error) => error instanceof MockApiError && error.status === 409,
  );

  const login = await api.login({ username, password: 'password-123' });
  assert.equal(login.authenticated, true);

  const [channel] = await api.listChannels();
  await api.changeNickname('first-name');
  const earlierMessage = await api.createMessage(channel.id, 'earlier message');
  await api.changeNickname('tester');
  const history = await api.listMessages(channel.id);
  assert.equal(history.find((message) => message.id === earlierMessage.id).authorNickname, 'tester');

  const sent = await api.createMessage(channel.id, 'hello channel');
  const newMessages = await api.listMessages(channel.id, { afterId: sent.id - 1 });
  assert.equal(newMessages.at(-1).content, 'hello channel');
  assert.equal(newMessages.at(-1).authorNickname, 'tester');

  await api.logout();
  await assert.rejects(api.listChannels(), (error) => error.status === 401);
});
