package burnar.naryad.oper.params.controller;

import burnar.naryad.oper.params.dto.NaryadAlgorithmDto;
import burnar.naryad.oper.params.dto.NaryadCalcResultDto;
import burnar.naryad.oper.params.dto.NaryadOperParamDto;
import burnar.naryad.oper.params.dto.NaryadOperParamSaveDto;
import burnar.naryad.oper.params.dto.NaryadOperParamValueRequest;
import burnar.naryad.oper.params.service.NaryadOperCalcService;
import burnar.naryad.oper.params.service.NaryadOperParamsService;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.GetMapping;
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
 * Параметры операции и расчёт задания или выполнения.
 * Пути остаются под /api/naryady.
 */
@RestController
@RequestMapping("/api/naryady")
public class NaryadOperParamsController {

    private final NaryadOperParamsService naryadOperParamsService;
    private final NaryadOperCalcService naryadOperCalcService;

    public NaryadOperParamsController(
            NaryadOperParamsService naryadOperParamsService,
            NaryadOperCalcService naryadOperCalcService) {
        this.naryadOperParamsService = naryadOperParamsService;
        this.naryadOperCalcService = naryadOperCalcService;
    }

    @GetMapping("/{id:\\d+}/zadanie/params")
    public List<NaryadOperParamDto> zadanieParams(
            @PathVariable int id, @RequestParam(required = false) Long nodeId) {
        return naryadOperParamsService.findZadanieParams(id, nodeId);
    }

    @GetMapping("/{id:\\d+}/zadanie/algorithm")
    public NaryadAlgorithmDto zadanieAlgorithm(
            @PathVariable int id, @RequestParam(required = false) Long nodeId) {
        return naryadOperParamsService.findZadanieAlgorithm(id, nodeId);
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

    @GetMapping("/{id:\\d+}/vipolnenie/params")
    public List<NaryadOperParamDto> vipolnenieParams(
            @PathVariable int id, @RequestParam(required = false) Long nodeId) {
        return naryadOperParamsService.findVipolnenieParams(id, nodeId);
    }

    @GetMapping("/{id:\\d+}/vipolnenie/algorithm")
    public NaryadAlgorithmDto vipolnenieAlgorithm(
            @PathVariable int id, @RequestParam(required = false) Long nodeId) {
        return naryadOperParamsService.findVipolnenieAlgorithm(id, nodeId);
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
