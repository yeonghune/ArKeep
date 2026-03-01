package com.archive.backend.controller;

import com.archive.backend.dto.MetadataPreviewRequest;
import com.archive.backend.dto.MetadataPreviewResponse;
import com.archive.backend.service.MetadataService;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/metadata")
public class MetadataController {

    private final MetadataService metadataService;

    public MetadataController(MetadataService metadataService) {
        this.metadataService = metadataService;
    }

    @PostMapping("/preview")
    public MetadataPreviewResponse preview(@Valid @RequestBody MetadataPreviewRequest request) {
        return metadataService.preview(request.url());
    }
}
