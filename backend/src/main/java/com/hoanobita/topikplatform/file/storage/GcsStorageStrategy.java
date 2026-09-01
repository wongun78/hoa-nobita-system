package com.hoanobita.topikplatform.file.storage;

import com.google.cloud.storage.Blob;
import com.google.cloud.storage.BlobId;
import com.google.cloud.storage.BlobInfo;
import com.google.cloud.storage.Storage;
import com.google.cloud.storage.StorageOptions;
import com.hoanobita.topikplatform.common.BusinessException;
import com.hoanobita.topikplatform.common.ErrorCode;
import org.springframework.core.io.Resource;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;

/**
 * Google Cloud Storage strategy.
 * Stores files in a GCS bucket using Application Default Credentials (ADC).
 *
 * On Cloud Run, the service account automatically has access — no keys needed.
 */
public class GcsStorageStrategy implements FileStorageStrategy {

    private final Storage storage;
    private final String bucket;

    public GcsStorageStrategy(String bucket) {
        this.bucket = bucket;
        this.storage = StorageOptions.getDefaultInstance().getService();
    }

    @Override
    public String store(MultipartFile file, String storedFileName) {
        String objectName = "uploads/" + storedFileName;
        BlobInfo blobInfo = BlobInfo.newBuilder(BlobId.of(bucket, objectName))
                .setContentType(file.getContentType())
                .build();
        try {
            storage.create(blobInfo, file.getBytes());
            return objectName;
        } catch (IOException e) {
            throw BusinessException.of(ErrorCode.FILE_STORAGE_ERROR, "Failed to store file in GCS: " + e.getMessage());
        }
    }

    @Override
    public Resource load(String storageKey) {
        try {
            Blob blob = storage.get(BlobId.of(bucket, storageKey));
            if (blob == null || !blob.exists()) {
                throw BusinessException.of(ErrorCode.FILE_NOT_ON_DISK);
            }
            byte[] content = blob.getContent();
            return new ByteArrayResource(content) {
                @Override
                public String getFilename() {
                    // Extract filename from key: "uploads/uuid_filename.ext" → "filename.ext"
                    String name = storageKey;
                    int idx = name.indexOf('_');
                    if (idx > 0 && name.startsWith("uploads/")) {
                        name = name.substring(idx + 1);
                    }
                    return name;
                }
            };
        } catch (BusinessException e) {
            throw e;
        } catch (Exception e) {
            throw BusinessException.of(ErrorCode.FILE_NOT_ON_DISK, "Failed to load file from GCS: " + e.getMessage());
        }
    }

    @Override
    public void delete(String storageKey) {
        try {
            boolean deleted = storage.delete(BlobId.of(bucket, storageKey));
            if (!deleted) {
                // File may already be deleted — not an error
            }
        } catch (Exception e) {
            // Log but don't throw — deletion failure is non-critical
        }
    }

    @Override
    public boolean exists(String storageKey) {
        try {
            Blob blob = storage.get(BlobId.of(bucket, storageKey));
            return blob != null && blob.exists();
        } catch (Exception e) {
            return false;
        }
    }
}
