package com.sinae.messenger.api;

/** 클라이언트에 반환하는 공통 오류 응답. */
public record ApiError(int status, String message) {
}
