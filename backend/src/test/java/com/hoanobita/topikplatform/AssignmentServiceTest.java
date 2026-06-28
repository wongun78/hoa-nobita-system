package com.hoanobita.topikplatform;

import com.hoanobita.topikplatform.assignment.entity.Assignment;
import com.hoanobita.topikplatform.common.Enums.AssignmentStatus;
import org.junit.jupiter.api.Test;
import java.math.BigDecimal;
import static org.junit.jupiter.api.Assertions.*;

class AssignmentServiceTest {
    @Test void assignmentDefaultsToDraftAndPositiveScore() {
        Assignment a = new Assignment();
        assertEquals(AssignmentStatus.DRAFT, a.getStatus());
        assertTrue(a.getMaxScore().compareTo(BigDecimal.ZERO) > 0);
    }
}
