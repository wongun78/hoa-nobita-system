package com.hoanobita.topikplatform.calendar;

import com.hoanobita.topikplatform.calendar.dto.CalendarResponse;
import com.hoanobita.topikplatform.common.ApiResponse;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/calendar")
public class CalendarController {
    private final CalendarService service;

    public CalendarController(CalendarService service) {
        this.service = service;
    }

    @GetMapping
    public ApiResponse<CalendarResponse> calendar(@RequestParam LocalDate from,
                                                  @RequestParam LocalDate to,
                                                  @RequestParam(required = false) UUID classId) {
        return ApiResponse.ok(service.calendar(from, to, classId));
    }
}
