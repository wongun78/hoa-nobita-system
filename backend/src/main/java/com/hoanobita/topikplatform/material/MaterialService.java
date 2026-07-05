package com.hoanobita.topikplatform.material;

import com.hoanobita.topikplatform.activity.ActivityService;
import com.hoanobita.topikplatform.common.BusinessException;
import com.hoanobita.topikplatform.common.PageResponse;
import com.hoanobita.topikplatform.common.PageableUtil;
import com.hoanobita.topikplatform.common.PermissionService;
import com.hoanobita.topikplatform.material.dto.*;
import com.hoanobita.topikplatform.material.entity.Material;
import com.hoanobita.topikplatform.material.repository.MaterialRepository;
import com.hoanobita.topikplatform.user.entity.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Set;
import java.util.UUID;

@Service
public class MaterialService {

    private final MaterialRepository materialRepo;
    private final PermissionService permissionService;
    private final ActivityService activityService;

    public MaterialService(MaterialRepository materialRepo, PermissionService permissionService, ActivityService activityService) {
        this.materialRepo = materialRepo;
        this.permissionService = permissionService;
        this.activityService = activityService;
    }

    public PageResponse<MaterialResponse> listByClass(UUID classId, User user, Integer page, Integer size, String sort, String search) {
        permissionService.requireAccessClass(user, classId);

        Pageable pageable = PageableUtil.of(page, size, sort,
                Set.of("createdAt", "title"),
                Sort.by(Sort.Direction.DESC, "createdAt"));

        Page<Material> materialPage;
        if (user.isStudent()) {
            materialPage = materialRepo.findVisibleByClassId(classId, pageable);
        } else {
            materialPage = materialRepo.findByClassId(classId, pageable);
        }
        return PageableUtil.toPageResponse(materialPage.map(this::toResponse));
    }

    @Transactional
    public MaterialResponse create(UUID classId, MaterialRequest request, User user) {
        permissionService.requireManageClass(user, classId);

        // Validation: must have either fileId or externalUrl
        if (request.fileId() == null && (request.externalUrl() == null || request.externalUrl().isBlank())) {
            throw BusinessException.badRequest("Material must have either fileId or externalUrl");
        }

        var material = new Material();
        material.setClassId(classId);
        material.setTitle(request.title());
        material.setDescription(request.description());
        material.setExternalUrl(request.externalUrl());
        material.setFileId(request.fileId());
        material.setVisible(request.visible() != null ? request.visible() : true);
        material.setCreatedBy(user.getId());

        material = materialRepo.save(material);
        activityService.log("MATERIAL_CREATED", "MATERIAL", material.getId(), material.getTitle(), classId, "Đã tải lên tài liệu mới: " + material.getTitle());
        return toResponse(material);
    }

    public MaterialResponse getById(UUID materialId, User user) {
        var material = materialRepo.findActiveById(materialId)
                .orElseThrow(() -> BusinessException.notFound("Material not found"));
        permissionService.requireAccessClass(user, material.getClassId());

        // Students can only see visible materials
        if (user.isStudent() && !material.isVisible()) {
            throw BusinessException.notFound("Material not found");
        }

        return toResponse(material);
    }

    @Transactional
    public MaterialResponse update(UUID materialId, MaterialRequest request, User user) {
        var material = materialRepo.findActiveById(materialId)
                .orElseThrow(() -> BusinessException.notFound("Material not found"));
        permissionService.requireManageClass(user, material.getClassId());

        if (request.title() != null) material.setTitle(request.title());
        if (request.description() != null) material.setDescription(request.description());
        if (request.externalUrl() != null) material.setExternalUrl(request.externalUrl());
        if (request.fileId() != null) material.setFileId(request.fileId());
        if (request.visible() != null) material.setVisible(request.visible());
        material.setUpdatedBy(user.getId());

        material = materialRepo.save(material);
        activityService.log("MATERIAL_UPDATED", "MATERIAL", material.getId(), material.getTitle(), material.getClassId(), "Đã cập nhật tài liệu: " + material.getTitle());
        return toResponse(material);
    }

    @Transactional
    public void delete(UUID materialId, User user) {
        var material = materialRepo.findActiveById(materialId)
                .orElseThrow(() -> BusinessException.notFound("Material not found"));
        permissionService.requireManageClass(user, material.getClassId());
        material.softDelete();
        materialRepo.save(material);
        activityService.log("MATERIAL_DELETED", "MATERIAL", material.getId(), material.getTitle(), material.getClassId(), "Đã xóa tài liệu: " + material.getTitle());
    }

    @Transactional
    public MaterialResponse updateVisibility(UUID materialId, boolean visible, User user) {
        var material = materialRepo.findActiveById(materialId)
                .orElseThrow(() -> BusinessException.notFound("Material not found"));
        permissionService.requireManageClass(user, material.getClassId());
        material.setVisible(visible);
        material.setUpdatedBy(user.getId());
        material = materialRepo.save(material);
        return toResponse(material);
    }

    private MaterialResponse toResponse(Material m) {
        return new MaterialResponse(
                m.getId(), m.getClassId(), m.getLessonId(), m.getFileId(),
                m.getTitle(), m.getDescription(), m.getExternalUrl(),
                m.isVisible(), m.getCreatedAt()
        );
    }

}
