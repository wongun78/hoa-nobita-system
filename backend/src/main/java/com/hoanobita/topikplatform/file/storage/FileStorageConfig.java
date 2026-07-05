package com.hoanobita.topikplatform.file.storage;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * Configures file storage strategy based on app.storage.type property.
 * - local (default): stores files on local filesystem
 * - s3: stores files on AWS S3
 */
@Configuration
public class FileStorageConfig {

    @Value("${app.storage.type:local}")
    private String storageType;

    @Value("${app.upload-dir:uploads}")
    private String uploadDir;

    @Value("${app.storage.s3.bucket:}")
    private String s3Bucket;

    @Bean
    public FileStorageStrategy fileStorageStrategy() {
        return switch (storageType.toLowerCase()) {
            case "s3" -> {
                if (s3Bucket.isBlank()) {
                    throw new IllegalArgumentException("app.storage.s3.bucket must be set when using S3 storage");
                }
                yield new S3StorageStrategy(s3Bucket);
            }
            default -> new LocalStorageStrategy(uploadDir);
        };
    }
}
