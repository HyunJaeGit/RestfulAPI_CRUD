package com.sinae.messenger.api;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/** 세션 로그인 요청값. */
public record LoginRequest(
        @NotBlank @Size(max = 32) String username,
        @NotBlank @Size(max = 72) String password) {
}
