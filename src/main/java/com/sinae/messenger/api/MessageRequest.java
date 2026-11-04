package com.sinae.messenger.api;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

/** 한 줄 메시지 작성 요청값. */
public record MessageRequest(
        @NotBlank(message = "메시지를 입력해 주세요.")
        @Size(max = 280, message = "메시지는 280자 이하여야 합니다.")
        @Pattern(regexp = "[^\\r\\n]+", message = "메시지는 한 줄로 입력해 주세요.")
        String content) {
}
