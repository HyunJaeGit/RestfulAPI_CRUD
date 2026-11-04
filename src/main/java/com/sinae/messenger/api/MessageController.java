package com.sinae.messenger.api;

import com.sinae.messenger.message.MessageService;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/** 채널 메시지 조회와 작성 API를 제공한다. */
@RestController
@RequestMapping("/api/channels/{channelId}/messages")
public class MessageController {

    private final MessageService messageService;

    public MessageController(MessageService messageService) {
        this.messageService = messageService;
    }

    @GetMapping
    public List<MessageResponse> listMessages(
            @PathVariable Long channelId,
            @RequestParam(required = false) Long afterId,
            @RequestParam(required = false) Integer limit) {
        return messageService.listMessages(channelId, afterId, limit);
    }

    @PostMapping
    public MessageResponse createMessage(
            @PathVariable Long channelId,
            Authentication authentication,
            @Valid @RequestBody MessageRequest request) {
        return messageService.createMessage(channelId, authentication.getName(), request.content());
    }
}
