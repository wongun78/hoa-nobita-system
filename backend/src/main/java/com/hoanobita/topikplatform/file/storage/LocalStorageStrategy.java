package com.hoanobita.topikplatform.file.storage;

import com.hoanobita.topikplatform.common.BusinessException;
import com.hoanobita.topikplatform.common.ErrorCode;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;

/**
 * Local filesystem storage strategy.
 * Stores files in a configurable local directory.
 */
public class LocalStorageStrategy implements FileStorageStrategy {

    private final Path uploadDir;

    public LocalStorageStrategy(String uploadDir) {
        this.uploadDir = Paths.get(uploadDir).toAbsolutePath().normalize();
        try {
            Files.createDirectories(this.uploadDir);
        } catch (IOException e) {
            throw new RuntimeException("Could not create upload directory: " + this.uploadDir, e);
        }
    }

    @Override
    public String store(MultipartFile file, String storedFileName) {
        Path targetPath = uploadDir.resolve(storedFileName);
        try {
            file.transferTo(targetPath.toFile());
            return targetPath.toString();
        } catch (IOException e) {
            throw BusinessException.of(ErrorCode.FILE_STORAGE_ERROR, "Failed to store file: " + e.getMessage());
        }
    }

    @Override
    public Resource load(String storageKey) {
        try {
            Path path = Paths.get(storageKey);
            Resource resource = new UrlResource(path.toUri());
            if (resource.exists() && resource.isReadable()) {
                return resource;
            }
            throw BusinessException.of(ErrorCode.FILE_NOT_ON_DISK);
        } catch (BusinessException e) {
            throw e;
        } catch (Exception e) {
            throw BusinessException.of(ErrorCode.FILE_NOT_ON_DISK);
        }
    }

    @Override
    public void delete(String storageKey) {
        try {
            Path path = Paths.get(storageKey);
            Files.deleteIfExists(path);
        } catch (IOException e) {
            // Log but don't throw — file might already be gone
        }
    }

    @Override
    public boolean exists(String storageKey) {
        try {
            return Files.exists(Paths.get(storageKey));
        } catch (Exception e) {
            return false;
        }
    }
}
