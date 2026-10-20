package burnar.controller;

import burnar.dto.NaryadSkvHeaderDto;
import burnar.dto.NaryadSkvParamDto;
import burnar.dto.NaryadSkvSaveRequest;
import burnar.dto.NaryadSkvSaveResultDto;
import burnar.dto.NaryadSkvValueDto;
import burnar.service.NaryadSkvParamsService;
import burnar.service.NaryadSkvParamsService.Part;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * Окно сквозных параметров карточки: шапка (дата начала, закрытие), таблица параметров
 * (BaseTable, массив), пункты выпадающего списка значения и сохранение.
 */
@RestController
@RequestMapping("/api/naryady")
public class NaryadSkvParamsController {

    private final NaryadSkvParamsService service;

    public NaryadSkvParamsController(NaryadSkvParamsService service) {
        this.service = service;
    }

    @GetMapping("/{id:\\d+}/{part:zadanie|vipolnenie}/skv")
    public NaryadSkvHeaderDto header(@PathVariable int id, @PathVariable String part) {
        return service.findHeader(id, toPart(part));
    }

    @GetMapping("/{id:\\d+}/{part:zadanie|vipolnenie}/skv/params")
    public List<NaryadSkvParamDto> params(@PathVariable int id, @PathVariable String part) {
        return service.findParams(id, toPart(part));
    }

    @GetMapping("/{id:\\d+}/{part:zadanie|vipolnenie}/skv/values")
    public List<NaryadSkvValueDto> values(
            @PathVariable int id,
            @PathVariable String part,
            @RequestParam(required = false) BigDecimal parcode) {
        return service.findValues(id, toPart(part), parcode);
    }

    @PutMapping("/{id:\\d+}/{part:zadanie|vipolnenie}/skv")
    public NaryadSkvSaveResultDto save(
            @PathVariable int id,
            @PathVariable String part,
            @RequestBody(required = false) NaryadSkvSaveRequest request) {
        return service.save(id, toPart(part), request);
    }

    private static Part toPart(String part) {
        return "zadanie".equals(part) ? Part.ZADANIE : Part.VIPOLNENIE;
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
