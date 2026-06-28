CREATE TABLE activity_logs (
    id UUID PRIMARY KEY,
    actor_id UUID,
    actor_name VARCHAR(255),
    action_type VARCHAR(50) NOT NULL,
    target_type VARCHAR(50) NOT NULL,
    target_id UUID,
    target_name VARCHAR(255),
    class_id UUID,
    message TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_activity_logs_class_id ON activity_logs(class_id);
CREATE INDEX idx_activity_logs_actor_id ON activity_logs(actor_id);
CREATE INDEX idx_activity_logs_created_at ON activity_logs(created_at DESC);
