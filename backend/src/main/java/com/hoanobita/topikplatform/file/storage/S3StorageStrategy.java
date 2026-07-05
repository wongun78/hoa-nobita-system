package com.hoanobita.topikplatform.file.storage;

import org.springframework.core.io.Resource;
import org.springframework.web.multipart.MultipartFile;

/**
 * AWS S3 storage strategy (stub for production).
 * TODO: Implement with AWS SDK v2 when deploying to production.
 *
 * Required dependencies (add to pom.xml when ready):
 *   - software.amazon.awssdk:s3
 *   - software.amazon.awssdk:s3-transfer-manager
 *
 * Required env vars:
 *   - AWS_S3_BUCKET
 *   - AWS_REGION
 *   - AWS_ACCESS_KEY_ID / AWS_SECRET_ACCESS_KEY (or IAM role)
 */
public class S3StorageStrategy implements FileStorageStrategy {

    private final String bucket;

    public S3StorageStrategy(String bucket) {
        this.bucket = bucket;
    }

    @Override
    public String store(MultipartFile file, String storedFileName) {
        // TODO: Implement S3 putObject
        // String key = "uploads/" + storedFileName;
        // s3Client.putObject(...)
        // return key;
        throw new UnsupportedOperationException("S3 storage not yet configured. Set app.storage.type=local for development.");
    }

    @Override
    public Resource load(String storageKey) {
        // TODO: Implement S3 getObject
        throw new UnsupportedOperationException("S3 storage not yet configured.");
    }

    @Override
    public void delete(String storageKey) {
        // TODO: Implement S3 deleteObject
    }

    @Override
    public boolean exists(String storageKey) {
        // TODO: Implement S3 headObject
        return false;
    }
}
