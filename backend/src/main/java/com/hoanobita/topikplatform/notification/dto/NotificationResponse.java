package com.hoanobita.topikplatform.notification.dto;

import java.time.Instant;
import java.util.UUID;

public record NotificationResponse(
	UUID id,
	String title,
	String content,
	String targetType,
	UUID targetId,
	UUID createdBy,
	Instant createdAt,
	boolean isRead,
	Instant readAt
) {
}
