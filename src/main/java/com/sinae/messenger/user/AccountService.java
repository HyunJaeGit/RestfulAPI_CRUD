package com.sinae.messenger.user;

import com.sinae.messenger.api.AuthResponse;
import java.nio.charset.StandardCharsets;
import java.util.Locale;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

/** 계정 생성과 현재 사용자 닉네임 변경을 처리한다. */
@Service
public class AccountService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public AccountService(UserRepository userRepository, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Transactional
    public AuthResponse signup(String rawUsername, String rawPassword) {
        String username = rawUsername.trim().toLowerCase(Locale.ROOT);
        if (rawPassword.getBytes(StandardCharsets.UTF_8).length > 72) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "비밀번호의 UTF-8 길이는 72바이트 이하여야 합니다.");
        }
        if (userRepository.existsByUsername(username)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "이미 사용 중인 아이디입니다.");
        }
        UserAccount user = userRepository.save(new UserAccount(username, passwordEncoder.encode(rawPassword)));
        return new AuthResponse(false, user.getUsername(), user.getNickname());
    }

    @Transactional(readOnly = true)
    public UserAccount getByUsername(String username) {
        return userRepository.findByUsername(username)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "사용자를 찾을 수 없습니다."));
    }

    @Transactional
    public AuthResponse changeNickname(String username, String rawNickname) {
        String nickname = rawNickname.trim();
        UserAccount user = getByUsername(username);
        user.changeNickname(nickname);
        return toResponse(user);
    }

    public AuthResponse toResponse(UserAccount user) {
        return new AuthResponse(true, user.getUsername(), user.getNickname());
    }
}
