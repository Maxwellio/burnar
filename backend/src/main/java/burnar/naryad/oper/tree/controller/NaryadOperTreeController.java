package burnar.naryad.oper.tree.controller;

import burnar.naryad.oper.tree.dto.NaryadDurationTotalsDto;
import burnar.naryad.oper.tree.dto.NaryadOperNodeDto;
import burnar.naryad.oper.tree.dto.NaryadPeriodTotalDto;
import burnar.naryad.oper.tree.dto.NaryadWorkActionDto;
import burnar.naryad.oper.tree.service.NaryadOperTreeService;
import burnar.ocard.dto.NaryadOcardFileDto;
import burnar.ocard.service.OcardService;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.util.StringUtils;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * Дерево работ наряда и о-карты узла.
 * Пути остаются под /api/naryady.
 */
@RestController
@RequestMapping("/api/naryady")
public class NaryadOperTreeController {

    private final NaryadOperTreeService naryadOperTreeService;
    private final OcardService ocardService;

    public NaryadOperTreeController(
            NaryadOperTreeService naryadOperTreeService,
            OcardService ocardService) {
        this.naryadOperTreeService = naryadOperTreeService;
        this.ocardService = ocardService;
    }

    @GetMapping("/{id:\\d+}/zadanie")
    public List<NaryadOperNodeDto> zadanieRoots(
            @PathVariable int id, @RequestParam(required = false) String expandAll) {
        return naryadOperTreeService.findZadanieRoots(id, StringUtils.hasText(expandAll));
    }

    @GetMapping("/{id:\\d+}/zadanie/{nodeId:\\d+}/children")
    public List<NaryadOperNodeDto> zadanieChildren(@PathVariable int id, @PathVariable long nodeId) {
        return naryadOperTreeService.findZadanieChildren(id, nodeId);
    }

    @GetMapping("/{id:\\d+}/zadanie/totals")
    public NaryadDurationTotalsDto zadanieTotals(@PathVariable int id) {
        return naryadOperTreeService.zadanieTotals(id);
    }

    @GetMapping("/{id:\\d+}/zadanie/nodes/{nodeId:\\d+}/action")
    public NaryadWorkActionDto zadanieWorkAction(@PathVariable int id, @PathVariable long nodeId) {
        return naryadOperTreeService.zadanieWorkAction(id, nodeId);
    }

    @GetMapping("/{id:\\d+}/zadanie/nodes/{nodeId:\\d+}/ocards")
    public List<NaryadOcardFileDto> zadanieOcards(@PathVariable int id, @PathVariable long nodeId) {
        return ocardService.zadanieFiles(id, nodeId);
    }

    @GetMapping("/{id:\\d+}/vipolnenie")
    public List<NaryadOperNodeDto> vipolnenieRoots(
            @PathVariable int id, @RequestParam(required = false) String expandAll) {
        return naryadOperTreeService.findVipolnenieRoots(id, StringUtils.hasText(expandAll));
    }

    @GetMapping("/{id:\\d+}/vipolnenie/{nodeId:\\d+}/children")
    public List<NaryadOperNodeDto> vipolnenieChildren(
            @PathVariable int id, @PathVariable long nodeId) {
        return naryadOperTreeService.findVipolnenieChildren(id, nodeId);
    }

    @GetMapping("/{id:\\d+}/vipolnenie/totals")
    public NaryadDurationTotalsDto vipolnenieTotals(@PathVariable int id) {
        return naryadOperTreeService.vipolnenieTotals(id);
    }

    @GetMapping("/{id:\\d+}/vipolnenie/period-totals")
    public List<NaryadPeriodTotalDto> vipolneniePeriodTotals(@PathVariable int id) {
        return naryadOperTreeService.vipolneniePeriodTotals(id);
    }

    @GetMapping("/{id:\\d+}/vipolnenie/nodes/{nodeId:\\d+}/action")
    public NaryadWorkActionDto vipolnenieWorkAction(@PathVariable int id, @PathVariable long nodeId) {
        return naryadOperTreeService.vipolnenieWorkAction(id, nodeId);
    }

    @GetMapping("/{id:\\d+}/vipolnenie/nodes/{nodeId:\\d+}/ocards")
    public List<NaryadOcardFileDto> vipolnenieOcards(@PathVariable int id, @PathVariable long nodeId) {
        return ocardService.vipolnenieFiles(id, nodeId);
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
