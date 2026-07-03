package com.hoanobita.topikplatform.calendar.dto;

import java.util.List;

public record CalendarResponse(
        List<CalendarEventResponse> events
) {}
