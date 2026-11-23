package burnar.naryad.part.controller;

import burnar.naryad.list.dto.NaryadHeaderDto;
import burnar.naryad.part.dto.NaryadClosedDto;
import burnar.naryad.part.dto.NaryadClosedRequest;
import burnar.naryad.part.dto.NaryadLockTargetDto;
import burnar.naryad.part.dto.NaryadWorkLockDto;
import burnar.naryad.part.service.NaryadPartCommandService;
import burnar.naryad.shared.dto.NaryadNodeIdsRequest;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.GetMapping;
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
 * Закрытие, блокировка и создание выполнения наряда.
 * Пути остаются под /api/naryady.
 */
@RestController
@RequestMapping("/api/naryady")
public class NaryadPartController {

    private final NaryadPartCommandService naryadPartCommandService;

    public NaryadPartController(
            NaryadPartCommandService naryadPartCommandService) {
        this.naryadPartCommandService = naryadPartCommandService;
    }

    @PostMapping("/{id:\\d+}/zadanie/nodes/{nodeId:\\d+}/renumber")
    public ResponseEntity<Void> renumberZadanie(@PathVariable int id, @PathVariable long nodeId) {
        naryadPartCommandService.renumberZadanie(id, nodeId);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{id:\\d+}/zadanie/closed")
    public NaryadClosedDto setZadanieClosed(
            @PathVariable int id,
            @RequestBody(required = false) NaryadClosedRequest request) {
        return naryadPartCommandService.setZadanieClosed(id, request == null ? null : request.getClosed());
    }

    @PostMapping("/{id:\\d+}/vipolnenie")
    public NaryadHeaderDto createEmptyVipolnenie(@PathVariable int id) {
        return naryadPartCommandService.createEmptyVipolnenie(id);
    }

    @PostMapping("/{id:\\d+}/vipolnenie/import-zadanie")
    public ResponseEntity<Void> importZadanieWorks(@PathVariable int id) {
        naryadPartCommandService.importZadanieWorks(id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{id:\\d+}/vipolnenie/replace-zadanie")
    public NaryadHeaderDto replaceZadanieFromVipolnenie(@PathVariable int id) {
        return naryadPartCommandService.replaceZadanieFromVipolnenie(id);
    }

    @PostMapping("/{id:\\d+}/vipolnenie/nodes/{nodeId:\\d+}/renumber")
    public ResponseEntity<Void> renumberVipolnenie(@PathVariable int id, @PathVariable long nodeId) {
        naryadPartCommandService.renumberVipolnenie(id, nodeId);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{id:\\d+}/vipolnenie/closed")
    public NaryadClosedDto setVipolnenieClosed(
            @PathVariable int id,
            @RequestBody(required = false) NaryadClosedRequest request) {
        return naryadPartCommandService.setVipolnenieClosed(id, request == null ? null : request.getClosed());
    }

    @GetMapping("/{id:\\d+}/vipolnenie/lock-flags")
    public List<NaryadWorkLockDto> vipolnenieLockFlags(@PathVariable int id) {
        return naryadPartCommandService.vipolnenieLockFlags(id);
    }

    @PostMapping("/{id:\\d+}/vipolnenie/lock")
    public NaryadLockTargetDto lockVipolnenie(
            @PathVariable int id,
            @RequestBody(required = false) NaryadNodeIdsRequest request) {
        return naryadPartCommandService.lockVipolnenie(id, request == null ? null : request.getNodeIds());
    }

    @PostMapping("/{id:\\d+}/vipolnenie/unlock")
    public NaryadLockTargetDto unlockVipolnenie(
            @PathVariable int id,
            @RequestBody(required = false) NaryadNodeIdsRequest request) {
        return naryadPartCommandService.unlockVipolnenie(id, request == null ? null : request.getNodeIds());
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
