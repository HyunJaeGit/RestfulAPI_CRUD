package com.sinae.messenger.api;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

/** 회원가입 요청값. */
public record SignupRequest(
        @NotBlank
        @Pattern(regexp = "[A-Za-z0-9._-]{3,32}", message = "아이디는 영문, 숫자, '.', '_', '-'로 3~32자여야 합니다.")
        String username,
        @NotBlank
        @Size(min = 8, max = 72, message = "비밀번호는 8~72자여야 합니다.")
        String password) {
}
