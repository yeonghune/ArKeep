package com.archive.backend.controller;

import com.archive.backend.dto.MyProfileResponse;
import com.archive.backend.exception.UnauthorizedException;
import com.archive.backend.service.AuthService;
import java.security.Principal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class ProfileController {

    private final AuthService authService;

    public ProfileController(AuthService authService) {
        this.authService = authService;
    }

    @GetMapping("/me")
    public MyProfileResponse me(Principal principal) {
        if (principal == null || principal.getName() == null || principal.getName().isBlank()) {
            throw new UnauthorizedException("Authentication required");
        }
        return authService.getMyProfile(principal.getName());
    }
}
