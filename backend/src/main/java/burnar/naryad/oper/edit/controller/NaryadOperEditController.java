package burnar.naryad.oper.edit.controller;

import burnar.naryad.oper.edit.dto.NaryadCatalogInsertRequest;
import burnar.naryad.oper.edit.dto.NaryadEmptyBlockRequest;
import burnar.naryad.oper.edit.dto.NaryadPasteRequest;
import burnar.naryad.oper.edit.dto.NaryadRenameBlockRequest;
import burnar.naryad.oper.edit.dto.NaryadStructureNodeDto;
import burnar.naryad.oper.edit.service.NaryadOperEditService;
import burnar.naryad.shared.dto.NaryadNodeIdsRequest;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * Правка структуры наряда: блоки, буфер, каталог и удаление работ.
 * Пути остаются под /api/naryady.
 */
@RestController
@RequestMapping("/api/naryady")
public class NaryadOperEditController {

    private final NaryadOperEditService naryadOperEditService;

    public NaryadOperEditController(
            NaryadOperEditService naryadOperEditService) {
        this.naryadOperEditService = naryadOperEditService;
    }

    @PostMapping("/{id:\\d+}/zadanie/works/delete")
    public List<Long> deleteZadanieWorks(
            @PathVariable int id,
            @RequestBody(required = false) NaryadNodeIdsRequest request) {
        return naryadOperEditService.deleteZadanieWorks(id, request == null ? null : request.getNodeIds());
    }

    @PostMapping("/{id:\\d+}/zadanie/blocks/{nodeId:\\d+}/delete")
    public ResponseEntity<Void> deleteZadanieBlock(@PathVariable int id, @PathVariable long nodeId) {
        naryadOperEditService.deleteZadanieBlock(id, nodeId);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/{id:\\d+}/zadanie/structure")
    public List<NaryadStructureNodeDto> zadanieStructure(@PathVariable int id) {
        return naryadOperEditService.zadanieStructure(id);
    }

    @PostMapping("/{id:\\d+}/zadanie/clipboard/paste")
    public ResponseEntity<Void> pasteZadanie(
            @PathVariable int id, @RequestBody(required = false) NaryadPasteRequest request) {
        naryadOperEditService.pasteZadanie(id, request);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{id:\\d+}/zadanie/blocks")
    public ResponseEntity<Void> addZadanieEmptyBlock(
            @PathVariable int id, @RequestBody(required = false) NaryadEmptyBlockRequest request) {
        naryadOperEditService.addZadanieEmptyBlock(id, request);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{id:\\d+}/zadanie/catalog")
    public ResponseEntity<Void> insertZadanieFromCatalog(
            @PathVariable int id, @RequestBody(required = false) NaryadCatalogInsertRequest request) {
        naryadOperEditService.insertZadanieFromCatalog(id, request);
        return ResponseEntity.noContent().build();
    }

    @PatchMapping("/{id:\\d+}/zadanie/blocks/{nodeId:\\d+}/name")
    public ResponseEntity<Void> renameZadanieBlock(
            @PathVariable int id,
            @PathVariable long nodeId,
            @RequestBody(required = false) NaryadRenameBlockRequest request) {
        naryadOperEditService.renameZadanieBlock(id, nodeId, request);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{id:\\d+}/vipolnenie/works/delete")
    public List<Long> deleteVipolnenieWorks(
            @PathVariable int id,
            @RequestBody(required = false) NaryadNodeIdsRequest request) {
        return naryadOperEditService.deleteVipolnenieWorks(id, request == null ? null : request.getNodeIds());
    }

    @PostMapping("/{id:\\d+}/vipolnenie/blocks/{nodeId:\\d+}/delete")
    public ResponseEntity<Void> deleteVipolnenieBlock(@PathVariable int id, @PathVariable long nodeId) {
        naryadOperEditService.deleteVipolnenieBlock(id, nodeId);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/{id:\\d+}/vipolnenie/structure")
    public List<NaryadStructureNodeDto> vipolnenieStructure(@PathVariable int id) {
        return naryadOperEditService.vipolnenieStructure(id);
    }

    @PostMapping("/{id:\\d+}/vipolnenie/clipboard/paste")
    public ResponseEntity<Void> pasteVipolnenie(
            @PathVariable int id, @RequestBody(required = false) NaryadPasteRequest request) {
        naryadOperEditService.pasteVipolnenie(id, request);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{id:\\d+}/vipolnenie/blocks")
    public ResponseEntity<Void> addVipolnenieEmptyBlock(
            @PathVariable int id, @RequestBody(required = false) NaryadEmptyBlockRequest request) {
        naryadOperEditService.addVipolnenieEmptyBlock(id, request);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{id:\\d+}/vipolnenie/catalog")
    public ResponseEntity<Void> insertVipolnenieFromCatalog(
            @PathVariable int id, @RequestBody(required = false) NaryadCatalogInsertRequest request) {
        naryadOperEditService.insertVipolnenieFromCatalog(id, request);
        return ResponseEntity.noContent().build();
    }

    @PatchMapping("/{id:\\d+}/vipolnenie/blocks/{nodeId:\\d+}/name")
    public ResponseEntity<Void> renameVipolnenieBlock(
            @PathVariable int id,
            @PathVariable long nodeId,
            @RequestBody(required = false) NaryadRenameBlockRequest request) {
        naryadOperEditService.renameVipolnenieBlock(id, nodeId, request);
        return ResponseEntity.noContent().build();
    }

    /**
     * Boot 2.7 по умолчанию скрывает message в JSON — без этого диалог
     * покажет только «Request failed: 409».
     */
    @ExceptionHandler(ResponseStatusException.class)
    public ResponseEntity<Map<String, Object>> handleStatus(ResponseStatusException ex) {
        Map<String, Object> body = new LinkedHashMap<>();
        HttpStatus status = ex.getStatus();
        body.put("status", status.value());
        body.put("message", ex.getReason() != null ? ex.getReason() : status.getReasonPhrase());
        return ResponseEntity.status(status).body(body);
    }
}
