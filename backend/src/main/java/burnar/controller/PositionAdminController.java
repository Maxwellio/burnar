package burnar.controller;

import burnar.dto.IdResponse;
import burnar.dto.PositionDto;
import burnar.dto.PositionWriteRequest;
import burnar.service.PositionAdminService;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
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
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import java.util.LinkedHashMap;
import java.util.Map;

/**
 * Админ-справочник должностей (Delphi SprDolj_list).
 * Список/карточка/CRUD по burnar.sprdoljnost; доступ ROLE_ADMIN (/api/admin/**).
 * Комбо на формах людей/карьер остаётся GET /api/responsible-persons/positions.
 */
@RestController
@RequestMapping("/api/admin/positions")
public class PositionAdminController {

    private final PositionAdminService positionAdminService;

    public PositionAdminController(PositionAdminService positionAdminService) {
        this.positionAdminService = positionAdminService;
    }

    @GetMapping
    public Page<PositionDto> list(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "100") int size,
            @RequestParam(required = false) String id,
            @RequestParam(required = false) String nm) {
        return positionAdminService.findPositions(PageRequest.of(page, size), id, nm);
    }

    @GetMapping("/{id}")
    public PositionDto get(@PathVariable int id) {
        return positionAdminService.getPosition(id);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public IdResponse create(@RequestBody PositionWriteRequest body) {
        return positionAdminService.createPosition(body);
    }

    @PutMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void update(@PathVariable int id, @RequestBody PositionWriteRequest body) {
        positionAdminService.updatePosition(id, body);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable int id) {
        positionAdminService.deletePosition(id);
    }

    /**
     * Boot 2.7 по умолчанию скрывает message в JSON — без этого 409 на форме
     * будет только «Request failed: 409».
     */
    @ExceptionHandler(ResponseStatusException.class)
    public ResponseEntity<Map<String, Object>> handleStatus(ResponseStatusException ex) {
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("status", ex.getStatus().value());
        body.put("message", ex.getReason() != null ? ex.getReason() : ex.getStatus().getReasonPhrase());
        return ResponseEntity.status(ex.getStatus()).body(body);
    }
}
