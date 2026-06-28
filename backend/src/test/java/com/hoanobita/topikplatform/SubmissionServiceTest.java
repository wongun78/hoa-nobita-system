package com.hoanobita.topikplatform;

import com.hoanobita.topikplatform.common.Enums.SubmissionStatus;
import com.hoanobita.topikplatform.submission.entity.Submission;
import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.*;

class SubmissionServiceTest {
    @Test void newSubmissionDefaultsToSubmitted() {
        Submission s = new Submission();
        assertEquals(SubmissionStatus.SUBMITTED, s.getStatus());
        assertNotNull(s.getSubmittedAt());
    }
}
