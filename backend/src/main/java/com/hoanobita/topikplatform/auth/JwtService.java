package com.hoanobita.topikplatform.auth;

import com.hoanobita.topikplatform.user.entity.User;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.nio.charset.StandardCharsets;
import java.util.Date;
import java.util.UUID;

@Component
public class JwtService {

    @Value("${app.jwt.secret}")
    private String secret;

    @Value("${app.jwt.expires-seconds}")
    private long expiresSeconds;

    public String generateToken(User user) {
        var roles = user.getRoles().stream()
                .map(r -> r.getName().name())
                .toList();

        return Jwts.builder()
                .subject(user.getId().toString())
                .claim("roles", roles)
                .issuedAt(new Date())
                .expiration(new Date(System.currentTimeMillis() + expiresSeconds * 1000))
                .signWith(Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8)))
                .compact();
    }

    public UUID parseUserId(String token) {
        var claims = Jwts.parser()
                .verifyWith(Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8)))
                .build()
                .parseSignedClaims(token)
                .getPayload();
        return UUID.fromString(claims.getSubject());
    }

    public long getExpiresSeconds() {
        return expiresSeconds;
    }
}
