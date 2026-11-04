package com.sinae.messenger.api;

/** 공개 채널 정보를 반환한다. */
public record ChannelResponse(Long id, String name, String description) {
}
