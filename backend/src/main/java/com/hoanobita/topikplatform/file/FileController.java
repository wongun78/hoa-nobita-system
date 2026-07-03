package com.hoanobita.topikplatform.file;

import com.hoanobita.topikplatform.common.ApiResponse;
import com.hoanobita.topikplatform.common.SecurityUtils;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/files")
public class FileController {

    private final FileService fileService;
    private final SecurityUtils securityUtils;

    public FileController(FileService fileService, SecurityUtils securityUtils) {
        this.fileService = fileService;
        this.securityUtils = securityUtils;
    }

    @PostMapping("/upload")
    public ResponseEntity<?> upload(@RequestParam("file") MultipartFile file) {
        var user = securityUtils.getCurrentUser();
        var stored = fileService.upload(file, user);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.created(Map.of(
                "id", stored.getId(),
                "originalFileName", stored.getOriginalFileName(),
                "contentType", stored.getContentType(),
                "fileSize", stored.getFileSize()
        )));
    }

    @GetMapping("/{fileId}/download")
    public ResponseEntity<Resource> download(@PathVariable UUID fileId) {
        securityUtils.getCurrentUser(); // auth check
        var storedFile = fileService.getById(fileId);
        Resource resource = fileService.download(fileId);
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + storedFile.getOriginalFileName() + "\"")
                .header(HttpHeaders.CONTENT_TYPE, storedFile.getContentType())
                .body(resource);
    }

    @GetMapping("/{fileId}")
    public ResponseEntity<?> getMetadata(@PathVariable UUID fileId) {
        securityUtils.getCurrentUser(); // auth check
        return ResponseEntity.ok(ApiResponse.ok(fileService.getMetadata(fileId)));
    }
}
