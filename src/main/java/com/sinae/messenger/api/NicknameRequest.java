package com.sinae.messenger.api;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

/** 현재 사용자 닉네임 변경 요청값. */
public record NicknameRequest(
        @NotBlank
        @Size(max = 24, message = "닉네임은 24자 이하여야 합니다.")
        @Pattern(regexp = "[^\\r\\n]+", message = "닉네임에는 줄바꿈을 넣을 수 없습니다.")
        String nickname) {
}
