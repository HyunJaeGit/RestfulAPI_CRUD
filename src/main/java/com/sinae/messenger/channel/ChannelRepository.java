package com.sinae.messenger.channel;

import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

/** 채널 영속성 조회 인터페이스. */
public interface ChannelRepository extends JpaRepository<ChannelEntity, Long> {
    List<ChannelEntity> findAllByOrderByIdAsc();
    boolean existsByName(String name);
}
