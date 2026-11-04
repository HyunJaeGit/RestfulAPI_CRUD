import { useEffect, useMemo, useRef, useState } from 'react';
import {
  changeNickname,
  createMessage,
  currentUser,
  getCsrf,
  isMockMode,
  listChannels,
  listMessages,
  login,
  logout,
  signup,
} from '../api/index.js';

function errorText(error) {
  if (error?.status === 401) return '로그인 정보가 만료되었습니다. 다시 로그인해 주세요.';
  return error?.message ?? '요청 중 문제가 발생했습니다.';
}

function mergeMessages(current, incoming) {
  const byId = new Map(current.map((message) => [message.id, message]));
  for (const message of incoming) byId.set(message.id, message);
  return [...byId.values()].sort((left, right) => left.id - right.id);
}

function AuthPanel({ onAuthenticated }) {
  const [mode, setMode] = useState('login');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const isSignup = mode === 'signup';

  async function handleSubmit(event) {
    event.preventDefault();
    setBusy(true);
    setError('');
    setNotice('');
    try {
      if (isSignup) {
        await signup({ username, password });
        setMode('login');
        setPassword('');
        setNotice('가입되었습니다. 계정으로 로그인해 주세요.');
      } else {
        const user = await login({ username, password });
        onAuthenticated(user);
      }
    } catch (requestError) {
      setError(errorText(requestError));
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="auth-layout">
      <section className="terminal-window auth-panel" aria-labelledby="auth-title">
        <div className="screen-titlebar">계정 접속</div>
        <h1 id="auth-title" className="brand-title">사내메신저<span className="cursor">_</span></h1>
        <div className="divider" />
        <div className="mode-switch" aria-label="계정 메뉴">
          <button className={!isSignup ? 'text-button active' : 'text-button'} onClick={() => { setMode('login'); setError(''); }} type="button">[1] 로그인</button>
          <button className={isSignup ? 'text-button active' : 'text-button'} onClick={() => { setMode('signup'); setError(''); }} type="button">[2] 신규 가입</button>
        </div>
        <form className="terminal-form" onSubmit={handleSubmit}>
          <label htmlFor="username">LOGIN NAME:</label>
          <input
            id="username"
            autoComplete="username"
            minLength={3}
            maxLength={32}
            pattern="[A-Za-z0-9._-]{3,32}"
            required
            value={username}
            onChange={(event) => setUsername(event.target.value)}
            placeholder="아이디 입력"
          />
          <label htmlFor="password">PASSWORD:</label>
          <input
            id="password"
            type="password"
            autoComplete={isSignup ? 'new-password' : 'current-password'}
            minLength={8}
            maxLength={72}
            required
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="비밀번호 입력"
          />
          {notice && <p className="notice" role="status">{notice}</p>}
          {error && <p className="error-message" role="alert">{error}</p>}
          <button className="primary-button" disabled={busy} type="submit">
            {busy ? '[ 처리 중... ]' : isSignup ? '[ 계정 등록 ]' : '[ 접속 ]'}
          </button>
        </form>
        <div className="status-line">통신 대기 중 <span>ENTER</span></div>
      </section>
    </main>
  );
}

function NicknameGate({ user, onSaved, onLogout }) {
  const [nickname, setNickname] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setBusy(true);
    setError('');
    try {
      onSaved(await changeNickname(nickname));
    } catch (requestError) {
      setError(errorText(requestError));
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="center-layout">
      <section className="terminal-window nickname-gate">
        <div className="screen-titlebar">USER PROFILE / {user.username}</div>
        <h1 className="section-title">대화명을 입력하세요</h1>
        <p className="muted-copy">닉네임을 바꾸면 이전 메시지에도 새 이름이 표시됩니다.</p>
        <form className="terminal-form" onSubmit={handleSubmit}>
          <label htmlFor="new-nickname">HANDLE:</label>
          <input id="new-nickname" autoFocus maxLength={24} required value={nickname} onChange={(event) => setNickname(event.target.value)} />
          {error && <p className="error-message" role="alert">{error}</p>}
          <button className="primary-button" disabled={busy} type="submit">{busy ? '[ 저장 중... ]' : '[ 확인 ]'}</button>
        </form>
        <button className="text-button logout-link" onClick={onLogout} type="button">[ 접속 종료 ]</button>
      </section>
    </main>
  );
}

function ProfileControl({ user, onSaved, onLogout }) {
  const [editing, setEditing] = useState(false);
  const [nickname, setNickname] = useState(user.nickname ?? '');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setBusy(true);
    setError('');
    try {
      onSaved(await changeNickname(nickname));
      setEditing(false);
    } catch (requestError) {
      setError(errorText(requestError));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="profile-control">
      {editing ? (
        <form className="inline-profile-form" onSubmit={handleSubmit}>
          <label className="sr-only" htmlFor="profile-nickname">닉네임 변경</label>
          <input id="profile-nickname" maxLength={24} required value={nickname} onChange={(event) => setNickname(event.target.value)} />
          <button className="small-button" disabled={busy} type="submit">저장</button>
          <button className="small-button quiet" onClick={() => { setEditing(false); setError(''); }} type="button">취소</button>
          {error && <span className="profile-error" role="alert">{error}</span>}
        </form>
      ) : (
        <>
          <span className="profile-name">{user.nickname}</span>
          <button className="text-button profile-action" onClick={() => { setNickname(user.nickname ?? ''); setEditing(true); }} type="button">[ 이름 ]</button>
          <button className="text-button profile-action" onClick={onLogout} type="button">[ 종료 ]</button>
        </>
      )}
    </div>
  );
}

function ChannelSidebar({ channels, selectedId, onSelect }) {
  return (
    <aside className="channel-sidebar">
      <div className="sidebar-heading"><span>접속 채널</span><span>{channels.length}개</span></div>
      <nav aria-label="공개 채널">
        {channels.map((channel) => (
          <button
            className={channel.id === selectedId ? 'channel-item selected' : 'channel-item'}
            key={channel.id}
            onClick={() => onSelect(channel.id)}
            type="button"
          >
            <span className="channel-hash">{channel.id === selectedId ? '>' : ' '}</span>
            <span className="channel-copy"><strong>{channel.name}</strong><small>{channel.description}</small></span>
          </button>
        ))}
      </nav>
      <div className="sidebar-bottom">채널을 선택하세요</div>
    </aside>
  );
}

function ChatPanel({ channel, messages, loading, error, onSend }) {
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState('');
  const endOfMessages = useRef(null);

  useEffect(() => {
    endOfMessages.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [messages]);

  async function handleSubmit(event) {
    event.preventDefault();
    if (!draft.trim() || sending) return;
    setSending(true);
    setSendError('');
    try {
      await onSend(draft);
      setDraft('');
    } catch (requestError) {
      setSendError(errorText(requestError));
    } finally {
      setSending(false);
    }
  }

  return (
    <section className="chat-panel" aria-label={`${channel.name} 채널 대화`}>
      <header className="chat-heading">
        <div><span className="panel-kicker">현재 채널</span><h2>[ {channel.name} ]</h2><p>{channel.description}</p></div>
        <div className="channel-live">온라인</div>
      </header>
      <div className="message-scroll" aria-live="polite" aria-busy={loading}>
        {loading && <p className="empty-state">채널 데이터를 불러오는 중...</p>}
        {!loading && messages.length === 0 && <p className="empty-state">아직 메시지가 없습니다. 첫 메시지를 남겨 보세요.</p>}
        {messages.map((message) => (
          <article className="message-row" key={message.id}>
            <time className="message-time" dateTime={message.createdAt}>[{formatTime(message.createdAt)}]</time>
            <strong className="message-author">&lt;{message.authorNickname}&gt;</strong>
            <p className="message-content">{message.content}</p>
          </article>
        ))}
        <div ref={endOfMessages} />
      </div>
      {(error || sendError) && <p className="error-strip" role="alert">{error || sendError}</p>}
      <form className="composer" onSubmit={handleSubmit}>
        <label className="composer-prompt" htmlFor="message-draft">&gt;</label>
        <input
          id="message-draft"
          autoComplete="off"
          maxLength={280}
          value={draft}
          onChange={(event) => setDraft(event.target.value.replace(/[\r\n]/g, ''))}
          placeholder="메시지를 입력하세요 (최대 280자)"
        />
        <span className="character-count">{draft.length}/280</span>
        <button className="send-button" disabled={sending || !draft.trim()} type="submit">[ 전송 ]</button>
      </form>
    </section>
  );
}

function formatTime(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '--:--';
  return new Intl.DateTimeFormat('ko-KR', { hour: '2-digit', minute: '2-digit', hour12: false }).format(date);
}

export default function App() {
  const [user, setUser] = useState(null);
  const [channels, setChannels] = useState([]);
  const [selectedChannelId, setSelectedChannelId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingChannels, setLoadingChannels] = useState(false);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [error, setError] = useState('');
  const selectedChannel = useMemo(
    () => channels.find((channel) => channel.id === selectedChannelId) ?? null,
    [channels, selectedChannelId],
  );

  useEffect(() => {
    let active = true;
    async function restoreSession() {
      try {
        await getCsrf();
        const restoredUser = await currentUser();
        if (active) setUser(restoredUser);
      } catch (requestError) {
        if (active && requestError.status !== 401) setError(errorText(requestError));
      } finally {
        if (active) setLoading(false);
      }
    }
    restoreSession();
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (!user?.nickname) {
      setChannels([]);
      setSelectedChannelId(null);
      return undefined;
    }
    let active = true;
    setLoadingChannels(true);
    listChannels()
      .then((items) => {
        if (!active) return;
        setChannels(items);
        setSelectedChannelId((current) => items.some((channel) => channel.id === current) ? current : items[0]?.id ?? null);
      })
      .catch((requestError) => {
        if (active) setError(errorText(requestError));
      })
      .finally(() => { if (active) setLoadingChannels(false); });
    return () => { active = false; };
  }, [user?.nickname]);

  useEffect(() => {
    if (!selectedChannelId) return undefined;
    let active = true;
    let polling = false;
    let lastMessageId = 0;
    setMessages([]);
    setMessagesLoading(true);
    setError('');

    async function loadInitial() {
      try {
        const initialMessages = await listMessages(selectedChannelId);
        if (!active) return;
        setMessages(initialMessages);
        lastMessageId = initialMessages.reduce((maxId, message) => Math.max(maxId, message.id), 0);
      } catch (requestError) {
        if (active) setError(errorText(requestError));
      } finally {
        if (active) setMessagesLoading(false);
      }
    }

    loadInitial();
    const timer = window.setInterval(async () => {
      if (!active || polling) return;
      polling = true;
      try {
        const newMessages = await listMessages(selectedChannelId, { afterId: lastMessageId, limit: 100 });
        if (active && newMessages.length > 0) {
          setMessages((current) => mergeMessages(current, newMessages));
          lastMessageId = newMessages.reduce((maxId, message) => Math.max(maxId, message.id), lastMessageId);
        }
      } catch (requestError) {
        if (active && requestError.status !== 401) setError(errorText(requestError));
        if (active && requestError.status === 401) setUser(null);
      } finally {
        polling = false;
      }
    }, 5000);

    return () => {
      active = false;
      window.clearInterval(timer);
    };
  }, [selectedChannelId]);

  async function handleLogout() {
    try {
      await logout();
    } catch (requestError) {
      if (requestError.status !== 401) setError(errorText(requestError));
    } finally {
      setUser(null);
      setChannels([]);
      setMessages([]);
      setSelectedChannelId(null);
      setError('');
    }
  }

  async function handleSend(content) {
    if (!selectedChannel) return;
    const message = await createMessage(selectedChannel.id, content);
    setMessages((current) => mergeMessages(current, [message]));
  }

  if (loading) {
    return <main className="center-layout"><p className="boot-message">SYSTEM BOOT<span className="cursor">_</span></p></main>;
  }
  if (!user) return <AuthPanel onAuthenticated={setUser} />;
  if (!user.nickname) return <NicknameGate user={user} onSaved={setUser} onLogout={handleLogout} />;

  return (
    <main className="app-shell">
      <header className="topbar">
        <a className="wordmark" href="/" aria-label="사내메신저 홈">사내메신저</a>
        <ProfileControl user={user} onSaved={setUser} onLogout={handleLogout} />
      </header>
      {isMockMode && <div className="demo-banner">DEMO MODE · 메모리 데이터만 사용합니다. 새로고침하면 데모 계정과 메시지가 초기화됩니다.</div>}
      {error && <div className="global-error" role="alert">{error}</div>}
      <div className="workspace">
        {loadingChannels ? <div className="loading-sidebar">채널 목록 확인 중...</div> : (
          <ChannelSidebar channels={channels} selectedId={selectedChannelId} onSelect={setSelectedChannelId} />
        )}
        {selectedChannel ? (
          <ChatPanel channel={selectedChannel} messages={messages} loading={messagesLoading} error={error} onSend={handleSend} />
        ) : (
          <section className="chat-panel empty-chat"><p>접속 가능한 채널을 불러오는 중...</p></section>
        )}
      </div>
      <footer className="app-footer"><span>F1 도움말&nbsp; F10 접속 종료</span><span>새 메시지 확인: 5초 간격</span></footer>
    </main>
  );
}
