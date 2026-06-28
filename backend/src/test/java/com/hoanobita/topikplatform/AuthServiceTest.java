package com.hoanobita.topikplatform;

import com.hoanobita.topikplatform.common.BusinessException;
import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.*;

class AuthServiceTest {
    @Test void loginFailureCanBeRepresentedAsUnauthorized() {
        var ex = BusinessException.unauthorized("Invalid credentials");
        assertEquals(401, ex.getStatus().value());
    }
}
