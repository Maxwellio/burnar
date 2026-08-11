package burnar.controller;

import burnar.dto.AdminUserDetailDto;
import burnar.dto.AdminUserDto;
import burnar.service.AdminUserService;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/**
 * Read-API админ-панели: список и карточка пользователей (учётки).
 * Write (add_user / пароль) — позже; см. docs/admin-panel-notes.md.
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
}
