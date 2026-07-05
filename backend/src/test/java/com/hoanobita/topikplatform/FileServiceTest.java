package com.hoanobita.topikplatform;

import com.hoanobita.topikplatform.common.BusinessException;
import com.hoanobita.topikplatform.common.Enums;
import com.hoanobita.topikplatform.file.FileService;
import com.hoanobita.topikplatform.file.dto.FileMetadataResponse;
import com.hoanobita.topikplatform.file.entity.StoredFile;
import com.hoanobita.topikplatform.file.repository.FileRepository;
import com.hoanobita.topikplatform.file.storage.FileStorageStrategy;
import com.hoanobita.topikplatform.user.entity.User;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.core.io.Resource;
import org.springframework.mock.web.MockMultipartFile;

import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class FileServiceTest {

    @Mock private FileRepository fileRepo;
    @Mock private FileStorageStrategy storageStrategy;

    @InjectMocks
    private FileService fileService;

    private User teacherUser;
    private StoredFile sampleFile;

    @BeforeEach
    void setUp() {
        teacherUser = new User();
        teacherUser.setId(UUID.randomUUID());
        teacherUser.setEmail("teacher@hoanobita.edu.vn");

        sampleFile = new StoredFile();
        sampleFile.setId(UUID.randomUUID());
        sampleFile.setOriginalFileName("test.pdf");
        sampleFile.setStoredFileName("uuid_test.pdf");
        sampleFile.setFileKey("/uploads/uuid_test.pdf");
        sampleFile.setFileSize(1024L);
        sampleFile.setContentType("application/pdf");
        sampleFile.setUploadedBy(teacherUser.getId());
    }

    @Test
    void upload_success() {
        MockMultipartFile file = new MockMultipartFile(
                "file", "test.pdf", "application/pdf", "hello".getBytes());

        when(storageStrategy.store(any(), anyString())).thenReturn("/uploads/uuid_test.pdf");
        when(fileRepo.save(any(StoredFile.class))).thenAnswer(inv -> {
            StoredFile sf = inv.getArgument(0);
            sf.setId(UUID.randomUUID());
            return sf;
        });

        StoredFile result = fileService.upload(file, teacherUser);

        assertNotNull(result);
        assertEquals("test.pdf", result.getOriginalFileName());
        assertEquals(teacherUser.getId(), result.getUploadedBy());
        verify(storageStrategy).store(any(), anyString());
        verify(fileRepo).save(any(StoredFile.class));
    }

    @Test
    void upload_emptyFile_throwsException() {
        MockMultipartFile file = new MockMultipartFile("file", "test.pdf", "application/pdf", new byte[0]);

        BusinessException ex = assertThrows(BusinessException.class, () -> fileService.upload(file, teacherUser));
        assertTrue(ex.getMessage().contains("trống"));
    }

    @Test
    void upload_invalidFileType_throwsException() {
        MockMultipartFile file = new MockMultipartFile(
                "file", "test.exe", "application/x-msdownload", "data".getBytes());

        BusinessException ex = assertThrows(BusinessException.class, () -> fileService.upload(file, teacherUser));
        assertTrue(ex.getMessage().contains("không hỗ trợ") || ex.getMessage().contains("Unsupported"));
    }

    @Test
    void download_success() {
        Resource resource = new ByteArrayResource("file content".getBytes());
        when(fileRepo.findByIdAndDeletedAtIsNull(sampleFile.getId())).thenReturn(Optional.of(sampleFile));
        when(storageStrategy.load(sampleFile.getFileKey())).thenReturn(resource);

        Resource result = fileService.download(sampleFile.getId());

        assertNotNull(result);
        assertTrue(result.exists());
        verify(storageStrategy).load(sampleFile.getFileKey());
    }

    @Test
    void download_fileNotInDb_throwsException() {
        UUID unknownId = UUID.randomUUID();
        when(fileRepo.findByIdAndDeletedAtIsNull(unknownId)).thenReturn(Optional.empty());

        assertThrows(BusinessException.class, () -> fileService.download(unknownId));
    }

    @Test
    void getById_success() {
        when(fileRepo.findByIdAndDeletedAtIsNull(sampleFile.getId())).thenReturn(Optional.of(sampleFile));

        StoredFile result = fileService.getById(sampleFile.getId());

        assertEquals(sampleFile.getId(), result.getId());
        assertEquals("test.pdf", result.getOriginalFileName());
    }

    @Test
    void getById_notFound_throwsException() {
        UUID unknownId = UUID.randomUUID();
        when(fileRepo.findByIdAndDeletedAtIsNull(unknownId)).thenReturn(Optional.empty());

        assertThrows(BusinessException.class, () -> fileService.getById(unknownId));
    }

    @Test
    void getMetadata_success() {
        when(fileRepo.findByIdAndDeletedAtIsNull(sampleFile.getId())).thenReturn(Optional.of(sampleFile));

        FileMetadataResponse result = fileService.getMetadata(sampleFile.getId());

        assertEquals(sampleFile.getId(), result.id());
        assertEquals("test.pdf", result.originalFileName());
        assertEquals("application/pdf", result.contentType());
        assertEquals(1024L, result.fileSize());
    }
}
