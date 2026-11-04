/** DB 없이 화면 흐름을 확인하기 위한 메모리 전용 가짜 API다. */
export class MockApiError extends Error {
  constructor(message, status) {
    super(message);
    this.name = 'MockApiError';
    this.status = status;
  }
}

const initialChannels = [
  { id: 1, name: 'general', description: '모두가 참여하는 공개 채널' },
  { id: 2, name: 'random', description: '자유롭게 이야기하는 공개 채널' },
];

export function createMockApi() {
  const users = new Map();
  const messagesByChannel = new Map([
    [1, [{ id: 1, content: '접속을 환영합니다. 이 화면은 DB 없이 둘러보는 데모입니다.', authorNickname: 'SYSTEM', createdAt: new Date().toISOString() }]],
    [2, []],
  ]);
  let activeUsername = null;
  let nextMessageId = 2;

  function requireUser() {
    const user = users.get(activeUsername);
    if (!user) throw new MockApiError('로그인이 필요합니다.', 401);
    return user;
  }

  function getChannel(channelId) {
    const channel = initialChannels.find((item) => item.id === Number(channelId));
    if (!channel) throw new MockApiError('채널을 찾을 수 없습니다.', 404);
    return channel;
  }

  function toMessageResponse(message) {
    const { authorUsername, ...publicMessage } = message;
    return {
      ...publicMessage,
      authorNickname: authorUsername
        ? users.get(authorUsername)?.nickname ?? message.authorNickname
        : message.authorNickname,
    };
  }

  return {
    async getCsrf() {
      return 'mock-csrf-token';
    },
    async signup({ username, password }) {
      const normalized = username.trim().toLowerCase();
      if (!/^[a-z0-9._-]{3,32}$/.test(normalized) || password.length < 8) {
        throw new MockApiError('아이디 또는 비밀번호 형식이 올바르지 않습니다.', 400);
      }
      if (users.has(normalized)) throw new MockApiError('이미 사용 중인 아이디입니다.', 409);
      users.set(normalized, { username: normalized, password, nickname: null });
      return { authenticated: false, username: normalized, nickname: null };
    },
    async login({ username, password }) {
      const user = users.get(username.trim().toLowerCase());
      if (!user || user.password !== password) {
        throw new MockApiError('아이디 또는 비밀번호를 확인해 주세요.', 401);
      }
      activeUsername = user.username;
      return { authenticated: true, username: user.username, nickname: user.nickname };
    },
    async currentUser() {
      const user = requireUser();
      return { authenticated: true, username: user.username, nickname: user.nickname };
    },
    async logout() {
      requireUser();
      activeUsername = null;
    },
    async changeNickname(nickname) {
      const user = requireUser();
      const trimmed = nickname.trim();
      if (!trimmed || trimmed.length > 24 || /[\r\n]/.test(trimmed)) {
        throw new MockApiError('닉네임은 줄바꿈 없이 1~24자로 입력해 주세요.', 400);
      }
      user.nickname = trimmed;
      return { authenticated: true, username: user.username, nickname: user.nickname };
    },
    async listChannels() {
      requireUser();
      return initialChannels.map((channel) => ({ ...channel }));
    },
    async listMessages(channelId, { afterId, limit = 50 } = {}) {
      requireUser();
      const channel = getChannel(channelId);
      if (limit < 1 || limit > 100 || (afterId != null && afterId < 0)) {
        throw new MockApiError('메시지 조회 범위가 올바르지 않습니다.', 400);
      }
      const messages = messagesByChannel.get(channel.id);
      const selected = afterId != null
        ? messages.filter((message) => message.id > afterId).slice(0, limit)
        : messages.slice(-limit);
      return selected.map(toMessageResponse);
    },
    async createMessage(channelId, content) {
      const user = requireUser();
      const channel = getChannel(channelId);
      const trimmed = content.trim();
      if (!user.nickname) throw new MockApiError('메시지를 작성하기 전에 닉네임을 설정해 주세요.', 409);
      if (!trimmed || trimmed.length > 280 || /[\r\n]/.test(trimmed)) {
        throw new MockApiError('메시지는 빈 내용이나 줄바꿈 없이 1~280자로 입력해 주세요.', 400);
      }
      const message = {
        id: nextMessageId++,
        content: trimmed,
        authorUsername: user.username,
        authorNickname: user.nickname,
        createdAt: new Date().toISOString(),
      };
      messagesByChannel.get(channel.id).push(message);
      return toMessageResponse(message);
    },
  };
}

const mockApi = createMockApi();
export default mockApi;
