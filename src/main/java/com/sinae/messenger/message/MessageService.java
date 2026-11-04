package com.sinae.messenger.message;

import com.sinae.messenger.api.MessageResponse;
import com.sinae.messenger.channel.ChannelEntity;
import com.sinae.messenger.channel.ChannelService;
import com.sinae.messenger.user.AccountService;
import com.sinae.messenger.user.UserAccount;
import java.util.Collections;
import java.util.List;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

/** 메시지를 작성하고 주기 조회용 채널 메시지 목록을 제공한다. */
@Service
public class MessageService {

    private static final int DEFAULT_PAGE_SIZE = 50;
    private static final int MAX_PAGE_SIZE = 100;

    private final MessageRepository messageRepository;
    private final ChannelService channelService;
    private final AccountService accountService;

    public MessageService(
            MessageRepository messageRepository,
            ChannelService channelService,
            AccountService accountService) {
        this.messageRepository = messageRepository;
        this.channelService = channelService;
        this.accountService = accountService;
    }

    @Transactional(readOnly = true)
    public List<MessageResponse> listMessages(Long channelId, Long afterId, Integer requestedLimit) {
        ChannelEntity channel = channelService.getChannel(channelId);
        int limit = requestedLimit == null ? DEFAULT_PAGE_SIZE : requestedLimit;
        if (limit < 1 || limit > MAX_PAGE_SIZE || afterId != null && afterId < 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "메시지 조회 범위가 올바르지 않습니다.");
        }

        List<MessageEntity> messages;
        if (afterId != null) {
            messages = messageRepository.findByChannelIdAndIdGreaterThanOrderByIdAsc(
                    channel.getId(), afterId, PageRequest.of(0, limit));
        } else {
            messages = messageRepository.findByChannelIdOrderByIdDesc(
                    channel.getId(), PageRequest.of(0, limit));
            Collections.reverse(messages);
        }
        return messages.stream().map(this::toResponse).toList();
    }

    @Transactional
    public MessageResponse createMessage(Long channelId, String username, String rawContent) {
        ChannelEntity channel = channelService.getChannel(channelId);
        UserAccount author = accountService.getByUsername(username);
        if (author.getNickname() == null || author.getNickname().isBlank()) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "메시지를 작성하기 전에 닉네임을 설정해 주세요.");
        }
        MessageEntity message = messageRepository.save(new MessageEntity(channel, author, rawContent.trim()));
        return toResponse(message);
    }

    private MessageResponse toResponse(MessageEntity message) {
        return new MessageResponse(
                message.getId(), message.getContent(), message.getAuthor().getNickname(), message.getCreatedAt());
    }
}
