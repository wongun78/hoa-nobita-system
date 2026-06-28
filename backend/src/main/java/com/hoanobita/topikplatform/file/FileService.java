package com.hoanobita.topikplatform.file;

import com.hoanobita.topikplatform.common.BusinessException;
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
import java.util.UUID;

@Service
public class FileService {

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

        String originalName = file.getOriginalFilename();
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
}
