package com.hoanobita.topikplatform.classroom.dto;

public record UpdateClassRequest(
        String name,
        String code,
        String description,
        Integer levelFrom,
        Integer levelTo,
        String status,
        String startDate,
        String endDate
) {}
