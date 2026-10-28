package burnar.controller;

import burnar.dto.NaryadAlgorithmDto;
import burnar.dto.NaryadCalcResultDto;
import burnar.dto.NaryadClosedDto;
import burnar.dto.NaryadEmptyBlockRequest;
import burnar.dto.NaryadPasteRequest;
import burnar.dto.NaryadRenameBlockRequest;
import burnar.dto.NaryadStructureNodeDto;
import burnar.dto.NaryadOperParamSaveDto;
import burnar.dto.NaryadOperParamValueRequest;
import burnar.dto.NaryadClosedRequest;
import burnar.dto.NaryadDurationTotalsDto;
import burnar.dto.NaryadHeaderDto;
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
import burnar.service.NaryadOperCalcService;
import burnar.service.NaryadOperEditService;
import burnar.service.NaryadOperParamsService;
import burnar.service.NaryadOperTreeService;
import burnar.service.NaryadPartCommandService;
import burnar.service.NaryadRowColorService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
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

    private final NaryadOperTreeService naryadOperTreeService;
    private final NaryadOperParamsService naryadOperParamsService;
    private final NaryadRowColorService naryadRowColorService;
    private final NaryadPartCommandService naryadPartCommandService;
    private final NaryadOperEditService naryadOperEditService;
    private final NaryadOperCalcService naryadOperCalcService;

    public NaryadWorkspaceController(
            NaryadOperTreeService naryadOperTreeService,
            NaryadOperParamsService naryadOperParamsService,
            NaryadRowColorService naryadRowColorService,
            NaryadPartCommandService naryadPartCommandService,
            NaryadOperEditService naryadOperEditService,
            NaryadOperCalcService naryadOperCalcService) {
        this.naryadOperTreeService = naryadOperTreeService;
        this.naryadOperParamsService = naryadOperParamsService;
        this.naryadRowColorService = naryadRowColorService;
        this.naryadPartCommandService = naryadPartCommandService;
        this.naryadOperEditService = naryadOperEditService;
        this.naryadOperCalcService = naryadOperCalcService;
    }

    @GetMapping("/{id:\\d+}/zadanie")
    public List<NaryadOperNodeDto> zadanieRoots(@PathVariable int id) {
        return naryadOperTreeService.findZadanieRoots(id);
    }

    @GetMapping("/{id:\\d+}/zadanie/{nodeId:\\d+}/children")
    public List<NaryadOperNodeDto> zadanieChildren(@PathVariable int id, @PathVariable long nodeId) {
        return naryadOperTreeService.findZadanieChildren(id, nodeId);
    }

    @GetMapping("/{id:\\d+}/zadanie/params")
    public List<NaryadOperParamDto> zadanieParams(
            @PathVariable int id, @RequestParam(required = false) Long nodeId) {
        return naryadOperParamsService.findZadanieParams(id, nodeId);
    }

    @PostMapping("/{id:\\d+}/zadanie/{nodeId:\\d+}/calc")
    public NaryadCalcResultDto calcZadanie(@PathVariable int id, @PathVariable long nodeId) {
        return naryadOperCalcService.calcZadanie(id, nodeId);
    }

    @PutMapping("/{id:\\d+}/zadanie/{nodeId:\\d+}/params/{parcode:\\d+}")
    public NaryadOperParamSaveDto saveZadanieParam(
            @PathVariable int id,
            @PathVariable long nodeId,
            @PathVariable long parcode,
            @RequestBody(required = false) NaryadOperParamValueRequest request) {
        return naryadOperCalcService.saveZadanieParam(
                id, nodeId, parcode, request == null ? null : request.getValue());
    }

    @GetMapping("/{id:\\d+}/zadanie/algorithm")
    public NaryadAlgorithmDto zadanieAlgorithm(
            @PathVariable int id, @RequestParam(required = false) Long nodeId) {
        return naryadOperParamsService.findZadanieAlgorithm(id, nodeId);
    }

    @PatchMapping("/{id:\\d+}/zadanie/{nodeId:\\d+}/color")
    public NaryadRowColorDto updateZadanieColor(
            @PathVariable int id,
            @PathVariable long nodeId,
            @RequestBody(required = false) NaryadRowColorRequest request) {
        return naryadRowColorService.updateZadanieColor(
                id, nodeId, request == null ? null : request.getColor());
    }

    @GetMapping("/{id:\\d+}/zadanie/totals")
    public NaryadDurationTotalsDto zadanieTotals(@PathVariable int id) {
        return naryadOperTreeService.zadanieTotals(id);
    }

    @PostMapping("/{id:\\d+}/zadanie/closed")
    public NaryadClosedDto setZadanieClosed(
            @PathVariable int id,
            @RequestBody(required = false) NaryadClosedRequest request) {
        return naryadPartCommandService.setZadanieClosed(id, request == null ? null : request.getClosed());
    }

    @GetMapping("/{id:\\d+}/zadanie/nodes/{nodeId:\\d+}/action")
    public NaryadWorkActionDto zadanieWorkAction(@PathVariable int id, @PathVariable long nodeId) {
        return naryadOperTreeService.zadanieWorkAction(id, nodeId);
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

    @PatchMapping("/{id:\\d+}/zadanie/blocks/{nodeId:\\d+}/name")
    public ResponseEntity<Void> renameZadanieBlock(
            @PathVariable int id,
            @PathVariable long nodeId,
            @RequestBody(required = false) NaryadRenameBlockRequest request) {
        naryadOperEditService.renameZadanieBlock(id, nodeId, request);
        return ResponseEntity.noContent().build();
    }

    @PatchMapping("/{id:\\d+}/zadanie/colors")
    public NaryadRowsColorDto updateZadanieColors(
            @PathVariable int id,
            @RequestBody(required = false) NaryadRowsColorRequest request) {
        return naryadRowColorService.updateZadanieColors(
                id,
                request == null ? null : request.getColor(),
                request == null ? null : request.getNodeIds());
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

    @GetMapping("/{id:\\d+}/vipolnenie")
    public List<NaryadOperNodeDto> vipolnenieRoots(@PathVariable int id) {
        return naryadOperTreeService.findVipolnenieRoots(id);
    }

    @GetMapping("/{id:\\d+}/vipolnenie/{nodeId:\\d+}/children")
    public List<NaryadOperNodeDto> vipolnenieChildren(
            @PathVariable int id, @PathVariable long nodeId) {
        return naryadOperTreeService.findVipolnenieChildren(id, nodeId);
    }

    @GetMapping("/{id:\\d+}/vipolnenie/params")
    public List<NaryadOperParamDto> vipolnenieParams(
            @PathVariable int id, @RequestParam(required = false) Long nodeId) {
        return naryadOperParamsService.findVipolnenieParams(id, nodeId);
    }

    @PostMapping("/{id:\\d+}/vipolnenie/{nodeId:\\d+}/calc")
    public NaryadCalcResultDto calcVipolnenie(@PathVariable int id, @PathVariable long nodeId) {
        return naryadOperCalcService.calcVipolnenie(id, nodeId);
    }

    @PutMapping("/{id:\\d+}/vipolnenie/{nodeId:\\d+}/params/{parcode:\\d+}")
    public NaryadOperParamSaveDto saveVipolnenieParam(
            @PathVariable int id,
            @PathVariable long nodeId,
            @PathVariable long parcode,
            @RequestBody(required = false) NaryadOperParamValueRequest request) {
        return naryadOperCalcService.saveVipolnenieParam(
                id, nodeId, parcode, request == null ? null : request.getValue());
    }

    @GetMapping("/{id:\\d+}/vipolnenie/algorithm")
    public NaryadAlgorithmDto vipolnenieAlgorithm(
            @PathVariable int id, @RequestParam(required = false) Long nodeId) {
        return naryadOperParamsService.findVipolnenieAlgorithm(id, nodeId);
    }

    @PatchMapping("/{id:\\d+}/vipolnenie/{nodeId:\\d+}/color")
    public NaryadRowColorDto updateVipolnenieColor(
            @PathVariable int id,
            @PathVariable long nodeId,
            @RequestBody(required = false) NaryadRowColorRequest request) {
        return naryadRowColorService.updateVipolnenieColor(
                id, nodeId, request == null ? null : request.getColor());
    }

    @GetMapping("/{id:\\d+}/vipolnenie/totals")
    public NaryadDurationTotalsDto vipolnenieTotals(@PathVariable int id) {
        return naryadOperTreeService.vipolnenieTotals(id);
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

    @GetMapping("/{id:\\d+}/vipolnenie/nodes/{nodeId:\\d+}/action")
    public NaryadWorkActionDto vipolnenieWorkAction(@PathVariable int id, @PathVariable long nodeId) {
        return naryadOperTreeService.vipolnenieWorkAction(id, nodeId);
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

    @PatchMapping("/{id:\\d+}/vipolnenie/blocks/{nodeId:\\d+}/name")
    public ResponseEntity<Void> renameVipolnenieBlock(
            @PathVariable int id,
            @PathVariable long nodeId,
            @RequestBody(required = false) NaryadRenameBlockRequest request) {
        naryadOperEditService.renameVipolnenieBlock(id, nodeId, request);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{id:\\d+}/vipolnenie/unlock")
    public NaryadLockTargetDto unlockVipolnenie(
            @PathVariable int id,
            @RequestBody(required = false) NaryadNodeIdsRequest request) {
        return naryadPartCommandService.unlockVipolnenie(id, request == null ? null : request.getNodeIds());
    }

    @PatchMapping("/{id:\\d+}/vipolnenie/colors")
    public NaryadRowsColorDto updateVipolnenieColors(
            @PathVariable int id,
            @RequestBody(required = false) NaryadRowsColorRequest request) {
        return naryadRowColorService.updateVipolnenieColors(
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
