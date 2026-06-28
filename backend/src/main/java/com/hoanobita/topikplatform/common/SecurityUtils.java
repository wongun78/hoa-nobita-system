package com.hoanobita.topikplatform.common;

import com.hoanobita.topikplatform.user.entity.User;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;

@Component
public class SecurityUtils {

    public User getCurrentUser() {
        var auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !(auth.getPrincipal() instanceof User user)) {
            throw BusinessException.unauthorized("Not authenticated");
        }
        return user;
    }

    public User currentUser() {
        return getCurrentUser();
    }
}
