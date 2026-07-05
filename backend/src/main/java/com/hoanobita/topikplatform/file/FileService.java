package com.hoanobita.topikplatform.file;

import com.hoanobita.topikplatform.common.BusinessException;
import com.hoanobita.topikplatform.common.ErrorCode;
import com.hoanobita.topikplatform.file.dto.FileMetadataResponse;
import com.hoanobita.topikplatform.file.entity.StoredFile;
import com.hoanobita.topikplatform.file.repository.FileRepository;
import com.hoanobita.topikplatform.file.storage.FileStorageStrategy;
import com.hoanobita.topikplatform.user.entity.User;
import org.springframework.core.io.Resource;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.util.Locale;
import java.util.Set;
import java.util.UUID;

@Service
public class FileService {
    private static final Set<String> ALLOWED_CONTENT_TYPES = Set.of(
            "application/pdf",
            "application/msword",
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            "application/vnd.ms-excel",
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            "application/vnd.ms-powerpoint",
            "application/vnd.openxmlformats-officedocument.presentationml.presentation",
            "application/zip",
            "application/x-rar-compressed",
            "application/octet-stream",
            "text/plain",
            "text/csv",
            "image/png",
            "image/jpeg",
            "image/gif",
            "image/webp",
            "image/svg+xml",
            "audio/mpeg",
            "audio/wav",
            "video/mp4",
            "video/webm",
            "video/quicktime"
    );
    private static final Set<String> ALLOWED_EXTENSIONS = Set.of(
            "pdf", "doc", "docx", "xls", "xlsx", "ppt", "pptx",
            "txt", "csv", "zip", "rar", "7z",
            "png", "jpg", "jpeg", "gif", "webp", "svg", "bmp",
            "mp3", "wav", "ogg",
            "mp4", "webm", "mov", "avi"
    );

    private final FileRepository fileRepo;
    private final FileStorageStrategy storageStrategy;

    public FileService(FileRepository fileRepo, FileStorageStrategy storageStrategy) {
        this.fileRepo = fileRepo;
        this.storageStrategy = storageStrategy;
    }

    public StoredFile upload(MultipartFile file, User currentUser) {
        if (file.isEmpty()) {
            throw BusinessException.of(ErrorCode.FILE_EMPTY);
        }
        String originalName = file.getOriginalFilename();
        validateAllowedFile(originalName, file.getContentType());
        String storedName = UUID.randomUUID() + "_" + (originalName != null ? originalName : "file");

        String storageKey = storageStrategy.store(file, storedName);

        var storedFile = new StoredFile();
        storedFile.setOriginalFileName(originalName != null ? originalName : "file");
        storedFile.setStoredFileName(storedName);
        storedFile.setFileKey(storageKey);
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
            throw BusinessException.of(ErrorCode.FILE_TYPE_NOT_ALLOWED,
                    "Unsupported file type: " + contentType + " (" + extension + ")");
        }
    }

    public Resource download(UUID fileId) {
        var storedFile = fileRepo.findByIdAndDeletedAtIsNull(fileId)
                .orElseThrow(() -> BusinessException.of(ErrorCode.FILE_NOT_FOUND));
        return storageStrategy.load(storedFile.getFileKey());
    }

    public StoredFile getById(UUID fileId) {
        return fileRepo.findByIdAndDeletedAtIsNull(fileId)
                .orElseThrow(() -> BusinessException.of(ErrorCode.FILE_NOT_FOUND));
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
