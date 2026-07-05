package com.hoanobita.topikplatform.file.storage;

import org.springframework.core.io.Resource;
import org.springframework.web.multipart.MultipartFile;

/**
 * Strategy interface for file storage backends.
 * Implementations: LocalStorageStrategy, S3StorageStrategy
 */
public interface FileStorageStrategy {

    /**
     * Store a file and return the storage key/path.
     * @param file the multipart file to store
     * @param storedFileName the unique generated filename
     * @return the storage key (path or S3 key) used to retrieve the file later
     */
    String store(MultipartFile file, String storedFileName);

    /**
     * Load a file as a Spring Resource.
     * @param storageKey the key returned by store()
     * @return the file as a Resource
     */
    Resource load(String storageKey);

    /**
     * Delete a file from storage.
     * @param storageKey the key returned by store()
     */
    void delete(String storageKey);

    /**
     * Check if a file exists.
     * @param storageKey the key returned by store()
     * @return true if the file exists
     */
    boolean exists(String storageKey);
}
