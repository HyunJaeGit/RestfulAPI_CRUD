package com.sinae.messenger.api;

/** 상태 변경 요청에 사용할 CSRF 토큰을 반환한다. */
public record CsrfResponse(String token) {
}
