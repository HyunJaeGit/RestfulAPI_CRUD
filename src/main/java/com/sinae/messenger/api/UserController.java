package com.sinae.messenger.api;

import com.sinae.messenger.user.AccountService;
import jakarta.validation.Valid;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/** 현재 사용자 프로필 변경 API를 제공한다. */
@RestController
@RequestMapping("/api/users/me")
public class UserController {

    private final AccountService accountService;

    public UserController(AccountService accountService) {
        this.accountService = accountService;
    }

    @PatchMapping("/nickname")
    public AuthResponse changeNickname(
            Authentication authentication, @Valid @RequestBody NicknameRequest request) {
        return accountService.changeNickname(authentication.getName(), request.nickname());
    }
}
