package burnar.naryad.interval.controller;

import burnar.naryad.interval.dto.NaryadIntervalRowDto;
import burnar.naryad.interval.service.NaryadIntervalService;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * Интервалы мехбурения и наращивания.
 * Пути остаются под /api/naryady.
 */
@RestController
@RequestMapping("/api/naryady")
public class NaryadIntervalController {

    private final NaryadIntervalService naryadIntervalService;

    public NaryadIntervalController(
            NaryadIntervalService naryadIntervalService) {
        this.naryadIntervalService = naryadIntervalService;
    }

    @GetMapping("/{id:\\d+}/vipolnenie/intervals/mehbur")
    public List<NaryadIntervalRowDto> vipolnenieMehburIntervals(@PathVariable int id) {
        return naryadIntervalService.mehbur(id);
    }

    @GetMapping("/{id:\\d+}/vipolnenie/intervals/narashchivanie")
    public List<NaryadIntervalRowDto> vipolnenieNarashchivanieIntervals(@PathVariable int id) {
        return naryadIntervalService.narashchivanie(id);
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
