package com.hoanobita.topikplatform.file;

import com.hoanobita.topikplatform.common.BusinessException;
import com.hoanobita.topikplatform.file.dto.FileMetadataResponse;
import com.hoanobita.topikplatform.file.entity.StoredFile;
import com.hoanobita.topikplatform.file.repository.FileRepository;
import com.hoanobita.topikplatform.user.entity.User;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.Locale;
import java.util.Set;
import java.util.UUID;

@Service
public class FileService {
    private static final long MAX_FILE_SIZE_BYTES = 10L * 1024L * 1024L;
    private static final Set<String> ALLOWED_CONTENT_TYPES = Set.of(
            "application/pdf",
            "application/msword",
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            "image/png",
            "image/jpeg",
            "video/mp4"
    );
    private static final Set<String> ALLOWED_EXTENSIONS = Set.of("pdf", "doc", "docx", "png", "jpg", "jpeg", "mp4");

    private final FileRepository fileRepo;
    private final Path uploadDir;

    public FileService(FileRepository fileRepo, @Value("${app.upload-dir}") String uploadDir) {
        this.fileRepo = fileRepo;
        this.uploadDir = Paths.get(uploadDir).toAbsolutePath().normalize();
        try {
            Files.createDirectories(this.uploadDir);
        } catch (IOException e) {
            throw new RuntimeException("Could not create upload directory", e);
        }
    }

    public StoredFile upload(MultipartFile file, User currentUser) {
        if (file.isEmpty()) {
            throw BusinessException.badRequest("File is empty");
        }
        if (file.getSize() > MAX_FILE_SIZE_BYTES) {
            throw BusinessException.badRequest("File size must not exceed 10MB");
        }

        String originalName = file.getOriginalFilename();
        validateAllowedFile(originalName, file.getContentType());
        String storedName = UUID.randomUUID() + "_" + (originalName != null ? originalName : "file");
        Path targetPath = uploadDir.resolve(storedName);

        try {
            file.transferTo(targetPath.toFile());
        } catch (IOException e) {
            throw new RuntimeException("Failed to store file", e);
        }

        var storedFile = new StoredFile();
        storedFile.setOriginalFileName(originalName != null ? originalName : "file");
        storedFile.setStoredFileName(storedName);
        storedFile.setFileKey(targetPath.toString());
        storedFile.setFileSize(file.getSize());
        storedFile.setContentType(file.getContentType());
        storedFile.setUploadedBy(currentUser.getId());

        return fileRepo.save(storedFile);
    }

    private void validateAllowedFile(String originalName, String contentType) {
        String extension = "";
        if (originalName != null && originalName.contains(".")) {
            extension = originalName.substring(originalName.lastIndexOf('.') + 1).toLowerCase(Locale.ROOT);
        }
        boolean allowedType = contentType != null && ALLOWED_CONTENT_TYPES.contains(contentType.toLowerCase(Locale.ROOT));
        boolean allowedExtension = ALLOWED_EXTENSIONS.contains(extension);
        if (!allowedType || !allowedExtension) {
            throw BusinessException.badRequest("Unsupported file type. Allowed: PDF, DOC, DOCX, PNG, JPG, MP4");
        }
    }

    public Resource download(UUID fileId) {
        var storedFile = fileRepo.findByIdAndDeletedAtIsNull(fileId)
                .orElseThrow(() -> BusinessException.notFound("File not found"));

        try {
            Path path = Paths.get(storedFile.getFileKey());
            Resource resource = new UrlResource(path.toUri());
            if (resource.exists()) {
                return resource;
            }
            throw BusinessException.notFound("File not found on disk");
        } catch (Exception e) {
            throw BusinessException.notFound("File not found on disk");
        }
    }

    public StoredFile getById(UUID fileId) {
        return fileRepo.findByIdAndDeletedAtIsNull(fileId)
                .orElseThrow(() -> BusinessException.notFound("File not found"));
    }

    public FileMetadataResponse getMetadata(UUID fileId) {
        var storedFile = getById(fileId);
        return new FileMetadataResponse(
                storedFile.getId(),
                storedFile.getOriginalFileName(),
                storedFile.getContentType(),
                storedFile.getFileSize(),
                storedFile.getCreatedAt(),
                storedFile.getUploadedBy()
        );
    }
}
