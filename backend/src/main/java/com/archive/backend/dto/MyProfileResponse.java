package com.archive.backend.dto;

public record MyProfileResponse(
        String userId,
        String displayName,
        String avatarUrl
) {
}
