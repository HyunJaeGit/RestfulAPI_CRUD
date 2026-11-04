package com.sinae.messenger.user;

import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

/** 사용자 계정 영속성 조회 인터페이스. */
public interface UserRepository extends JpaRepository<UserAccount, Long> {
    Optional<UserAccount> findByUsername(String username);
    boolean existsByUsername(String username);
}
