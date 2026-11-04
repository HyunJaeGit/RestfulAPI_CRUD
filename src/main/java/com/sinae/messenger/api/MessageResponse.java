package com.sinae.messenger.api;

import java.time.LocalDateTime;

/** 메시지 내용과 작성자 표시 정보를 반환한다. */
public record MessageResponse(
        Long id, String content, String authorNickname, LocalDateTime createdAt) {
}
