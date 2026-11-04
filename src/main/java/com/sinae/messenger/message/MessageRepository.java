package com.sinae.messenger.message;

import java.util.List;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

/** 메시지 영속성 조회 인터페이스. */
public interface MessageRepository extends JpaRepository<MessageEntity, Long> {
    List<MessageEntity> findByChannelIdAndIdGreaterThanOrderByIdAsc(
            Long channelId, Long afterId, Pageable pageable);

    List<MessageEntity> findByChannelIdOrderByIdDesc(Long channelId, Pageable pageable);
}
