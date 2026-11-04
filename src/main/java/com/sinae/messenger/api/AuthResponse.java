package com.sinae.messenger.api;

/** 현재 인증 상태와 사용자 공개 정보를 전달한다. */
public record AuthResponse(boolean authenticated, String username, String nickname) {
}
