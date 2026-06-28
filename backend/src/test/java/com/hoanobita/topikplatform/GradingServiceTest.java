package com.hoanobita.topikplatform;

import com.hoanobita.topikplatform.grading.entity.Grade;
import org.junit.jupiter.api.Test;
import java.math.BigDecimal;
import static org.junit.jupiter.api.Assertions.*;

class GradingServiceTest {
    @Test void gradeStoresScoreAndFeedback() {
        Grade g = new Grade();
        g.setScore(new BigDecimal("9.5"));
        g.setFeedback("Bài viết có bố cục rõ.");
        assertEquals(new BigDecimal("9.5"), g.getScore());
        assertTrue(g.getFeedback().contains("bố cục"));
    }
}
