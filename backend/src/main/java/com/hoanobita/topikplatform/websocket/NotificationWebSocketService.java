package com.hoanobita.topikplatform.websocket;

import com.hoanobita.topikplatform.notification.dto.NotificationResponse;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

/**
 * Sends real-time notifications to users via WebSocket.
 * Uses STOMP convertAndSendToUser() which routes to /user/queue/notifications.
 */
@Service
public class NotificationWebSocketService {

    private final SimpMessagingTemplate messagingTemplate;

    public NotificationWebSocketService(SimpMessagingTemplate messagingTemplate) {
        this.messagingTemplate = messagingTemplate;
    }

    /**
     * Send a notification to a specific user via their username (email).
     * The user must be connected via WebSocket and subscribed to /user/queue/notifications.
     *
     * @param username the user's email/username (Principal name)
     * @param notification the notification payload
     */
    public void sendToUser(String username, NotificationResponse notification) {
        messagingTemplate.convertAndSendToUser(
                username,
                "/queue/notifications",
                notification
        );
    }
}
