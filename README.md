# 사내메신저

공개 채널 메시지 커뮤니티입니다. 백엔드는 개발·테스트에 SQLite를 사용하며 Docker는 사용하지 않습니다. 프런트엔드는 DB 없이 mock 모드로 화면 흐름을 확인할 수 있습니다.

## 준비 사항

- Java 21 JDK
- Gradle 8.14.x

## 실행

Gradle 8.14.x를 설치한 뒤 루트 디렉터리에서 아래 명령을 실행합니다.

```bash
gradle bootRun
```

기본 SQLite 파일은 `data/sinae-messenger.db`에 생성됩니다. 다른 파일을 사용하려면 `DB_URL` 환경 변수에 `jdbc:sqlite:경로` 형식으로 지정합니다. 실행 시 `general`, `random` 공개 채널이 없으면 생성됩니다.

Swagger UI: `http://localhost:8080/swagger-ui.html`

## React 프런트엔드

프로젝트 루트에서 의존성을 설치하고 개발 서버를 실행합니다.

```bash
npm install
npm run dev:mock
```

`http://localhost:5173`에서 DB 없이 회원가입, 로그인, 닉네임 변경, 채널 이동, 메시지 작성과 polling 화면을 둘러볼 수 있습니다. mock 데이터는 브라우저 메모리에만 존재하며 새로고침하면 초기화됩니다.

자동 mock API 테스트와 프런트엔드 빌드는 다음 명령으로 실행합니다.

```bash
npm run test:mock
npm run build
```

실제 Spring Boot API와 연결할 때는 백엔드를 실행하고 `npm run dev`를 사용합니다. Vite가 `/api` 요청을 `http://localhost:8080`으로 전달합니다. 실제 API 연결에는 백엔드와 SQLite가 필요하므로 DB 작업은 보류하고 mock 모드에서 화면을 먼저 확인합니다.

## 테스트

```bash
gradle test
```

테스트 DB는 `data/sinae-messenger-test.db`이며 개발 DB와 분리되어 있습니다.

## API 계약

모든 API는 세션 쿠키 인증을 사용합니다. 변경 요청에는 먼저 `GET /api/auth/csrf` 응답의 `token`을 `X-XSRF-TOKEN` 헤더로 전달해야 합니다. 비밀번호는 BCrypt로 저장합니다.

| 메서드 | 경로 | 요청 / 동작 |
| --- | --- | --- |
| GET | `/api/auth/csrf` | CSRF 토큰 발급 |
| POST | `/api/auth/signup` | `{ "username": "user01", "password": "password123" }` |
| POST | `/api/auth/login` | 같은 계정 정보로 로그인 및 세션 생성 |
| GET | `/api/auth/me` | 현재 로그인 사용자 조회 |
| POST | `/api/auth/logout` | 로그아웃 |
| PATCH | `/api/users/me/nickname` | `{ "nickname": "새 닉네임" }` |
| GET | `/api/channels` | 공개 채널 목록 |
| GET | `/api/channels/{channelId}/messages` | 메시지 조회; `afterId`, `limit` 선택 |
| POST | `/api/channels/{channelId}/messages` | `{ "content": "한 줄 메시지" }` |

메시지는 280자 이하 한 줄 텍스트입니다. 조회는 기본 50개, 최대 100개이며 `afterId`를 이용해 새 메시지를 주기적으로 확인할 수 있습니다. 닉네임을 설정하기 전에는 메시지를 작성할 수 없습니다.

## Phase 1 한계

명령행 Gradle은 PATH에서 확인되지 않아 JUnit 테스트 결과를 확인해야 합니다. 프런트 mock 테스트와 Vite 빌드는 별도로 실행할 수 있습니다. 배포 환경의 데이터베이스와 SQLite 파일 보존 방식은 별도 결정 항목입니다.
# RestfulAPI_CRUD
