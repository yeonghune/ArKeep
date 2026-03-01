package com.archive.backend.auth;

public record GoogleUserProfile(String subject, String email, String name, String pictureUrl) {}
