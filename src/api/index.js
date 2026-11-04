/** 실제 Spring API 또는 DB 없는 로컬 데모 API를 선택한다. */
import * as realApi from './realApi.js';
import mockApi from './mockApi.js';

const useMockApi = import.meta.env.VITE_USE_MOCK_API === 'true';
const api = useMockApi ? mockApi : realApi;

export const isMockMode = useMockApi;
export const {
  getCsrf,
  signup,
  login,
  currentUser,
  logout,
  changeNickname,
  listChannels,
  listMessages,
  createMessage,
} = api;
