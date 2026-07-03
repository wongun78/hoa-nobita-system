package com.hoanobita.topikplatform.assignment.repository;

import com.hoanobita.topikplatform.assignment.entity.AssignmentAutoReminder;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;

public interface AssignmentAutoReminderRepository extends JpaRepository<AssignmentAutoReminder, UUID> {
    boolean existsByAssignmentIdAndReminderType(UUID assignmentId, String reminderType);
}
