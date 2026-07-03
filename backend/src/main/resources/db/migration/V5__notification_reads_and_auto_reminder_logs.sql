CREATE TABLE notification_reads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    notification_id UUID NOT NULL REFERENCES notifications(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    read_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (notification_id, user_id)
);

CREATE INDEX idx_notification_reads_user_id ON notification_reads(user_id);
CREATE INDEX idx_notification_reads_notification_id ON notification_reads(notification_id);

CREATE TABLE assignment_auto_reminders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    assignment_id UUID NOT NULL REFERENCES assignments(id) ON DELETE CASCADE,
    reminder_type VARCHAR(10) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (assignment_id, reminder_type)
);

CREATE INDEX idx_assignment_auto_reminders_assignment_id ON assignment_auto_reminders(assignment_id);