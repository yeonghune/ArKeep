package com.archive.backend.auth;

public interface GoogleTokenVerifier {
    GoogleUserProfile verify(String idToken);
}
