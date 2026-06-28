package com.hoanobita.topikplatform.file.repository;

import com.hoanobita.topikplatform.file.entity.StoredFile;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface FileRepository extends JpaRepository<StoredFile, UUID> {
    Optional<StoredFile> findByIdAndDeletedAtIsNull(UUID id);
}
