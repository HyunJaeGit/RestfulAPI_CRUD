package com.sinae.messenger.channel;

import com.sinae.messenger.api.ChannelResponse;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

/** 채널 조회 규칙을 처리한다. */
@Service
public class ChannelService {

    private final ChannelRepository channelRepository;

    public ChannelService(ChannelRepository channelRepository) {
        this.channelRepository = channelRepository;
    }

    @Transactional(readOnly = true)
    public List<ChannelResponse> listChannels() {
        return channelRepository.findAllByOrderByIdAsc().stream()
                .map(channel -> new ChannelResponse(channel.getId(), channel.getName(), channel.getDescription()))
                .toList();
    }

    @Transactional(readOnly = true)
    public ChannelEntity getChannel(Long channelId) {
        return channelRepository.findById(channelId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "채널을 찾을 수 없습니다."));
    }
}
