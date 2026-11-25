package burnar.naryad.global.controller;

import burnar.naryad.global.dto.NaryadGlobalFormDto;
import burnar.naryad.global.dto.NaryadGlobalParamDto;
import burnar.naryad.global.dto.NaryadGlobalSaveRequest;
import burnar.naryad.global.dto.NaryadGlobalSaveResultDto;
import burnar.naryad.global.service.NaryadGlobalParamsService;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * Окно общих параметров карточки наряда: шапка, таблица {@code znparams}
 * и флажки отчёта «Расчет приведенной проходки».
 */
@RestController
@RequestMapping("/api/naryady")
public class NaryadGlobalParamsController {

    private final NaryadGlobalParamsService service;

    public NaryadGlobalParamsController(NaryadGlobalParamsService service) {
        this.service = service;
    }

    @GetMapping("/{id:\\d+}/global")
    public NaryadGlobalFormDto form(@PathVariable int id) {
        return service.findForm(id);
    }

    @GetMapping("/{id:\\d+}/global/params")
    public List<NaryadGlobalParamDto> params(@PathVariable int id) {
        return service.findParams(id);
    }

    @PutMapping("/{id:\\d+}/global")
    public NaryadGlobalSaveResultDto save(
            @PathVariable int id,
            @RequestBody(required = false) NaryadGlobalSaveRequest request) {
        return service.save(id, request);
    }

    @ExceptionHandler(ResponseStatusException.class)
    public ResponseEntity<Map<String, Object>> handleStatus(ResponseStatusException ex) {
        Map<String, Object> body = new LinkedHashMap<>();
        HttpStatus status = ex.getStatus();
        body.put("status", status.value());
        body.put("message", ex.getReason() != null ? ex.getReason() : status.getReasonPhrase());
        return ResponseEntity.status(status).body(body);
    }
}
