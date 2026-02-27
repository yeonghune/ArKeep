package com.archive.backend.auth;

import com.archive.backend.exception.BadRequestException;
import com.google.api.client.googleapis.auth.oauth2.GoogleIdToken;
import com.google.api.client.googleapis.auth.oauth2.GoogleIdTokenVerifier;
import com.google.api.client.http.javanet.NetHttpTransport;
import com.google.api.client.json.gson.GsonFactory;
import java.io.IOException;
import java.security.GeneralSecurityException;
import java.util.Arrays;
import java.util.List;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

@Component
public class GoogleTokenVerifierImpl implements GoogleTokenVerifier {

    private final GoogleIdTokenVerifier verifier;

    public GoogleTokenVerifierImpl(@Value("${security.google.client-ids}") String clientIdsRaw) {
        List<String> clientIds = Arrays.stream(clientIdsRaw.split(","))
                .map(String::trim)
                .filter(value -> !value.isBlank())
                .toList();
        if (clientIds.isEmpty()) {
            throw new IllegalStateException("security.google.client-ids must not be empty");
        }
        this.verifier = new GoogleIdTokenVerifier.Builder(new NetHttpTransport(), GsonFactory.getDefaultInstance())
                .setAudience(clientIds)
                .build();
    }

    @Override
    public GoogleUserProfile verify(String idToken) {
        try {
            GoogleIdToken token = verifier.verify(idToken);
            if (token == null) {
                throw new BadRequestException("Invalid Google id token");
            }
            GoogleIdToken.Payload payload = token.getPayload();
            String subject = payload.getSubject();
            String email = payload.getEmail();
            String name = (String) payload.get("name");
            String pictureUrl = (String) payload.get("picture");
            if (subject == null || subject.isBlank()) {
                throw new BadRequestException("Invalid Google token subject");
            }
            return new GoogleUserProfile(subject, email, name, pictureUrl);
        } catch (GeneralSecurityException | IOException ex) {
            throw new BadRequestException("Failed to verify Google id token");
        }
    }
}
