package burnar.controller;

import burnar.dto.AdminUserDetailDto;
import burnar.dto.AdminUserDto;
import burnar.dto.AdminUserWriteRequest;
import burnar.dto.IdResponse;
import burnar.service.AdminUserService;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
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
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import java.util.LinkedHashMap;
import java.util.Map;

/**
 * API админ-панели: список, карточка и сохранение пользователей (учётки).
 * Write: people_add + опционально add_user (bcrypt на сервисе).
 * Доступ: ROLE_ADMIN (SecurityConfig /api/admin/**).
 */
@RestController
@RequestMapping("/api/admin/users")
public class AdminUserController {

    private final AdminUserService adminUserService;

    public AdminUserController(AdminUserService adminUserService) {
        this.adminUserService = adminUserService;
    }

    @GetMapping
    public Page<AdminUserDto> list(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "100") int size,
            @RequestParam(required = false) String id,
            @RequestParam(required = false) String fio,
            @RequestParam(required = false) String oraName,
            @RequestParam(required = false) String note,
            @RequestParam(required = false) String accountKind,
            @RequestParam(required = false) String activeKind) {
        return adminUserService.findUsers(
                PageRequest.of(page, size),
                id,
                fio,
                oraName,
                note,
                accountKind,
                activeKind);
    }

    @GetMapping("/{peopleId}")
    public AdminUserDetailDto get(@PathVariable int peopleId) {
        return adminUserService.getUser(peopleId);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public IdResponse create(@RequestBody AdminUserWriteRequest body) {
        return adminUserService.createUser(body);
    }

    @PutMapping("/{peopleId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void update(
            @PathVariable int peopleId,
            @RequestBody AdminUserWriteRequest body) {
        adminUserService.updateUser(peopleId, body);
    }

    /**
     * Boot 2.7 по умолчанию скрывает message в JSON — без этого 409 логина
     * на форме будет только «Request failed: 409».
     */
    @ExceptionHandler(ResponseStatusException.class)
    public ResponseEntity<Map<String, Object>> handleStatus(ResponseStatusException ex) {
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("status", ex.getStatus().value());
        body.put("message", ex.getReason() != null ? ex.getReason() : ex.getStatus().getReasonPhrase());
        return ResponseEntity.status(ex.getStatus()).body(body);
    }
}
