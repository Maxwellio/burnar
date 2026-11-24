package burnar.naryad.period.controller;

import burnar.naryad.period.dto.NaryadPeriodBindRequest;
import burnar.naryad.period.dto.NaryadPeriodDto;
import burnar.naryad.period.dto.NaryadPeriodWriteRequest;
import burnar.naryad.period.service.NaryadPeriodService;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * Периоды выполнения наряда.
 * Пути остаются под /api/naryady.
 */
@RestController
@RequestMapping("/api/naryady")
public class NaryadPeriodController {

    private final NaryadPeriodService naryadPeriodService;

    public NaryadPeriodController(
            NaryadPeriodService naryadPeriodService) {
        this.naryadPeriodService = naryadPeriodService;
    }

    @GetMapping("/{id:\\d+}/vipolnenie/periods")
    public List<NaryadPeriodDto> vipolneniePeriods(@PathVariable int id) {
        return naryadPeriodService.list(id);
    }

    @PostMapping("/{id:\\d+}/vipolnenie/periods")
    public NaryadPeriodDto createVipolneniePeriod(
            @PathVariable int id,
            @RequestBody(required = false) NaryadPeriodWriteRequest request) {
        return naryadPeriodService.create(id, request);
    }

    @PutMapping("/{id:\\d+}/vipolnenie/periods/{periodKey:\\d+}")
    public NaryadPeriodDto updateVipolneniePeriod(
            @PathVariable int id,
            @PathVariable int periodKey,
            @RequestBody(required = false) NaryadPeriodWriteRequest request) {
        return naryadPeriodService.update(id, periodKey, request);
    }

    @DeleteMapping("/{id:\\d+}/vipolnenie/periods/{periodKey:\\d+}")
    public ResponseEntity<Void> deleteVipolneniePeriod(@PathVariable int id, @PathVariable int periodKey) {
        naryadPeriodService.delete(id, periodKey);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{id:\\d+}/vipolnenie/periods/bind")
    public ResponseEntity<Void> bindVipolneniePeriod(
            @PathVariable int id,
            @RequestBody(required = false) NaryadPeriodBindRequest request) {
        naryadPeriodService.bind(
                id,
                request == null ? null : request.getPeriodKey(),
                request == null ? null : request.getNodeIds());
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
