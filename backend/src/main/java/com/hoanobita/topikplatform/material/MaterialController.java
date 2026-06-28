package com.hoanobita.topikplatform.material;

import com.hoanobita.topikplatform.common.ApiResponse;
import com.hoanobita.topikplatform.common.SecurityUtils;
import com.hoanobita.topikplatform.material.dto.MaterialRequest;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.UUID;

@RestController
public class MaterialController {

    private final MaterialService materialService;
    private final SecurityUtils securityUtils;

    public MaterialController(MaterialService materialService, SecurityUtils securityUtils) {
        this.materialService = materialService;
        this.securityUtils = securityUtils;
    }

    @GetMapping("/api/v1/classes/{classId}/materials")
    public ResponseEntity<?> listMaterials(@PathVariable UUID classId) {
        var user = securityUtils.getCurrentUser();
        return ResponseEntity.ok(ApiResponse.ok(materialService.listByClass(classId, user)));
    }

    @PostMapping("/api/v1/classes/{classId}/materials")
    public ResponseEntity<?> createMaterial(@PathVariable UUID classId, @Valid @RequestBody MaterialRequest request) {
        var user = securityUtils.getCurrentUser();
        var result = materialService.create(classId, request, user);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.created(result));
    }

    @GetMapping("/api/v1/materials/{materialId}")
    public ResponseEntity<?> getMaterial(@PathVariable UUID materialId) {
        var user = securityUtils.getCurrentUser();
        return ResponseEntity.ok(ApiResponse.ok(materialService.getById(materialId, user)));
    }

    @PatchMapping("/api/v1/materials/{materialId}")
    public ResponseEntity<?> updateMaterial(@PathVariable UUID materialId, @RequestBody MaterialRequest request) {
        var user = securityUtils.getCurrentUser();
        return ResponseEntity.ok(ApiResponse.ok(materialService.update(materialId, request, user)));
    }

    @DeleteMapping("/api/v1/materials/{materialId}")
    public ResponseEntity<?> deleteMaterial(@PathVariable UUID materialId) {
        var user = securityUtils.getCurrentUser();
        materialService.delete(materialId, user);
        return ResponseEntity.ok(ApiResponse.ok("Material deleted"));
    }

    @PatchMapping("/api/v1/materials/{materialId}/visibility")
    public ResponseEntity<?> updateVisibility(@PathVariable UUID materialId, @RequestBody Map<String, Boolean> body) {
        var user = securityUtils.getCurrentUser();
        boolean visible = body.getOrDefault("visible", true);
        return ResponseEntity.ok(ApiResponse.ok(materialService.updateVisibility(materialId, visible, user)));
    }
}
