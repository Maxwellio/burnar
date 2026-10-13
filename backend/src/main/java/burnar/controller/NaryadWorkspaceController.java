package burnar.controller;

import burnar.dto.NaryadAlgorithmDto;
import burnar.dto.NaryadClosedDto;
import burnar.dto.NaryadClosedRequest;
import burnar.dto.NaryadDurationTotalsDto;
import burnar.dto.NaryadLockTargetDto;
import burnar.dto.NaryadNodeIdsRequest;
import burnar.dto.NaryadWorkActionDto;
import burnar.dto.NaryadWorkLockDto;
import burnar.dto.NaryadOperNodeDto;
import burnar.dto.NaryadOperParamDto;
import burnar.dto.NaryadRowColorDto;
import burnar.dto.NaryadRowColorRequest;
import burnar.dto.NaryadRowsColorDto;
import burnar.dto.NaryadRowsColorRequest;
import burnar.service.NaryadWorkspaceService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * Карточка наряда: дерево работ (BaseTreeTable), параметры операции (BaseTable, массив),
 * текст алгоритма. id наряда — только цифры, чтобы не пересечься с /periods и /brigades.
 */
@RestController
@RequestMapping("/api/naryady")
public class NaryadWorkspaceController {

    private final NaryadWorkspaceService naryadWorkspaceService;

    public NaryadWorkspaceController(NaryadWorkspaceService naryadWorkspaceService) {
        this.naryadWorkspaceService = naryadWorkspaceService;
    }

    @GetMapping("/{id:\\d+}/zadanie")
    public List<NaryadOperNodeDto> zadanieRoots(@PathVariable int id) {
        return naryadWorkspaceService.findZadanieRoots(id);
    }

    @GetMapping("/{id:\\d+}/zadanie/{nodeId:\\d+}/children")
    public List<NaryadOperNodeDto> zadanieChildren(@PathVariable int id, @PathVariable long nodeId) {
        return naryadWorkspaceService.findZadanieChildren(id, nodeId);
    }

    @GetMapping("/{id:\\d+}/zadanie/params")
    public List<NaryadOperParamDto> zadanieParams(
            @PathVariable int id, @RequestParam(required = false) Long nodeId) {
        return naryadWorkspaceService.findZadanieParams(id, nodeId);
    }

    @GetMapping("/{id:\\d+}/zadanie/algorithm")
    public NaryadAlgorithmDto zadanieAlgorithm(
            @PathVariable int id, @RequestParam(required = false) Long nodeId) {
        return naryadWorkspaceService.findZadanieAlgorithm(id, nodeId);
    }

    @PatchMapping("/{id:\\d+}/zadanie/{nodeId:\\d+}/color")
    public NaryadRowColorDto updateZadanieColor(
            @PathVariable int id,
            @PathVariable long nodeId,
            @RequestBody(required = false) NaryadRowColorRequest request) {
        return naryadWorkspaceService.updateZadanieColor(
                id, nodeId, request == null ? null : request.getColor());
    }

    @GetMapping("/{id:\\d+}/zadanie/totals")
    public NaryadDurationTotalsDto zadanieTotals(@PathVariable int id) {
        return naryadWorkspaceService.zadanieTotals(id);
    }

    @PostMapping("/{id:\\d+}/zadanie/closed")
    public NaryadClosedDto setZadanieClosed(
            @PathVariable int id,
            @RequestBody(required = false) NaryadClosedRequest request) {
        return naryadWorkspaceService.setZadanieClosed(id, request == null ? null : request.getClosed());
    }

    @GetMapping("/{id:\\d+}/zadanie/nodes/{nodeId:\\d+}/action")
    public NaryadWorkActionDto zadanieWorkAction(@PathVariable int id, @PathVariable long nodeId) {
        return naryadWorkspaceService.zadanieWorkAction(id, nodeId);
    }

    @PostMapping("/{id:\\d+}/zadanie/works/delete")
    public List<Long> deleteZadanieWorks(
            @PathVariable int id,
            @RequestBody(required = false) NaryadNodeIdsRequest request) {
        return naryadWorkspaceService.deleteZadanieWorks(id, request == null ? null : request.getNodeIds());
    }

    @PostMapping("/{id:\\d+}/zadanie/blocks/{nodeId:\\d+}/delete")
    public ResponseEntity<Void> deleteZadanieBlock(@PathVariable int id, @PathVariable long nodeId) {
        naryadWorkspaceService.deleteZadanieBlock(id, nodeId);
        return ResponseEntity.noContent().build();
    }

    @PatchMapping("/{id:\\d+}/zadanie/colors")
    public NaryadRowsColorDto updateZadanieColors(
            @PathVariable int id,
            @RequestBody(required = false) NaryadRowsColorRequest request) {
        return naryadWorkspaceService.updateZadanieColors(
                id,
                request == null ? null : request.getColor(),
                request == null ? null : request.getNodeIds());
    }

    @GetMapping("/{id:\\d+}/vipolnenie")
    public List<NaryadOperNodeDto> vipolnenieRoots(@PathVariable int id) {
        return naryadWorkspaceService.findVipolnenieRoots(id);
    }

    @GetMapping("/{id:\\d+}/vipolnenie/{nodeId:\\d+}/children")
    public List<NaryadOperNodeDto> vipolnenieChildren(
            @PathVariable int id, @PathVariable long nodeId) {
        return naryadWorkspaceService.findVipolnenieChildren(id, nodeId);
    }

    @GetMapping("/{id:\\d+}/vipolnenie/params")
    public List<NaryadOperParamDto> vipolnenieParams(
            @PathVariable int id, @RequestParam(required = false) Long nodeId) {
        return naryadWorkspaceService.findVipolnenieParams(id, nodeId);
    }

    @GetMapping("/{id:\\d+}/vipolnenie/algorithm")
    public NaryadAlgorithmDto vipolnenieAlgorithm(
            @PathVariable int id, @RequestParam(required = false) Long nodeId) {
        return naryadWorkspaceService.findVipolnenieAlgorithm(id, nodeId);
    }

    @PatchMapping("/{id:\\d+}/vipolnenie/{nodeId:\\d+}/color")
    public NaryadRowColorDto updateVipolnenieColor(
            @PathVariable int id,
            @PathVariable long nodeId,
            @RequestBody(required = false) NaryadRowColorRequest request) {
        return naryadWorkspaceService.updateVipolnenieColor(
                id, nodeId, request == null ? null : request.getColor());
    }

    @GetMapping("/{id:\\d+}/vipolnenie/totals")
    public NaryadDurationTotalsDto vipolnenieTotals(@PathVariable int id) {
        return naryadWorkspaceService.vipolnenieTotals(id);
    }

    @PostMapping("/{id:\\d+}/vipolnenie/closed")
    public NaryadClosedDto setVipolnenieClosed(
            @PathVariable int id,
            @RequestBody(required = false) NaryadClosedRequest request) {
        return naryadWorkspaceService.setVipolnenieClosed(id, request == null ? null : request.getClosed());
    }

    @GetMapping("/{id:\\d+}/vipolnenie/lock-flags")
    public List<NaryadWorkLockDto> vipolnenieLockFlags(@PathVariable int id) {
        return naryadWorkspaceService.vipolnenieLockFlags(id);
    }

    @PostMapping("/{id:\\d+}/vipolnenie/lock")
    public NaryadLockTargetDto lockVipolnenie(
            @PathVariable int id,
            @RequestBody(required = false) NaryadNodeIdsRequest request) {
        return naryadWorkspaceService.lockVipolnenie(id, request == null ? null : request.getNodeIds());
    }

    @GetMapping("/{id:\\d+}/vipolnenie/nodes/{nodeId:\\d+}/action")
    public NaryadWorkActionDto vipolnenieWorkAction(@PathVariable int id, @PathVariable long nodeId) {
        return naryadWorkspaceService.vipolnenieWorkAction(id, nodeId);
    }

    @PostMapping("/{id:\\d+}/vipolnenie/works/delete")
    public List<Long> deleteVipolnenieWorks(
            @PathVariable int id,
            @RequestBody(required = false) NaryadNodeIdsRequest request) {
        return naryadWorkspaceService.deleteVipolnenieWorks(id, request == null ? null : request.getNodeIds());
    }

    @PostMapping("/{id:\\d+}/vipolnenie/blocks/{nodeId:\\d+}/delete")
    public ResponseEntity<Void> deleteVipolnenieBlock(@PathVariable int id, @PathVariable long nodeId) {
        naryadWorkspaceService.deleteVipolnenieBlock(id, nodeId);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{id:\\d+}/vipolnenie/unlock")
    public NaryadLockTargetDto unlockVipolnenie(
            @PathVariable int id,
            @RequestBody(required = false) NaryadNodeIdsRequest request) {
        return naryadWorkspaceService.unlockVipolnenie(id, request == null ? null : request.getNodeIds());
    }

    @PatchMapping("/{id:\\d+}/vipolnenie/colors")
    public NaryadRowsColorDto updateVipolnenieColors(
            @PathVariable int id,
            @RequestBody(required = false) NaryadRowsColorRequest request) {
        return naryadWorkspaceService.updateVipolnenieColors(
                id,
                request == null ? null : request.getColor(),
                request == null ? null : request.getNodeIds());
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
