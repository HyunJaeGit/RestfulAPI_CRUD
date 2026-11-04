package com.sinae.messenger.channel;

import org.springframework.boot.ApplicationRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/** 첫 실행에도 사용자가 메시지를 주고받을 수 있도록 기본 공개 채널을 준비한다. */
@Configuration
public class ChannelInitializer {

    @Bean
    ApplicationRunner initializeChannels(ChannelRepository channels) {
        return arguments -> {
            if (!channels.existsByName("general")) {
                channels.save(new ChannelEntity("general", "모두가 참여하는 공개 채널"));
            }
            if (!channels.existsByName("random")) {
                channels.save(new ChannelEntity("random", "자유롭게 이야기하는 공개 채널"));
            }
        };
    }
}
