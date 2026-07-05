package com.hoanobita.topikplatform.auth;

import com.hoanobita.topikplatform.common.BusinessException;
import org.springframework.stereotype.Component;

import java.time.Instant;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ConcurrentMap;

/**
 * Simple in-memory rate limiter for login attempts.
 * Tracks failed attempts per IP address.
 * Blocks after 5 failed attempts within 15 minutes.
 */
@Component
public class LoginRateLimiter {

    private static final int MAX_ATTEMPTS = 5;
    private static final long LOCKOUT_SECONDS = 15 * 60; // 15 minutes

    private final ConcurrentMap<String, AttemptInfo> attempts = new ConcurrentHashMap<>();

    /**
     * Checks if the IP is currently blocked. Throws if blocked.
     */
    public void checkRateLimit(String clientIp) {
        AttemptInfo info = attempts.get(clientIp);
        if (info == null) return;

        // Reset if lockout period has passed
        if (Instant.now().isAfter(info.lockedUntil())) {
            attempts.remove(clientIp);
            return;
        }

        if (info.count() >= MAX_ATTEMPTS) {
            long remainingSeconds = Instant.now().until(info.lockedUntil(), java.time.temporal.ChronoUnit.SECONDS);
            throw BusinessException.tooManyRequests(
                    "Quá nhiều lần thử đăng nhập. Vui lòng thử lại sau " + remainingSeconds + " giây.");
        }
    }

    /**
     * Records a failed login attempt for the given IP.
     */
    public void recordFailure(String clientIp) {
        attempts.merge(clientIp, new AttemptInfo(1, Instant.now().plusSeconds(LOCKOUT_SECONDS)),
                (existing, newEntry) -> {
                    int newCount = existing.count() + 1;
                    return new AttemptInfo(newCount, Instant.now().plusSeconds(LOCKOUT_SECONDS));
                });
    }

    /**
     * Clears attempts for the given IP on successful login.
     */
    public void recordSuccess(String clientIp) {
        attempts.remove(clientIp);
    }

    private record AttemptInfo(int count, Instant lockedUntil) {
    }
}
