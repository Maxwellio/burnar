package burnar.controller;

import burnar.dto.OrgUnitDto;
import burnar.service.OrgAccessService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/**
 * Справочник оргединиц для админского Select «структура» на странице нарядов.
 * Доступ только ROLE_ADMIN (см. SecurityConfig).
 */
@RestController
@RequestMapping("/api/org-units")
public class OrgUnitController {

    private final OrgAccessService orgAccessService;

    public OrgUnitController(OrgAccessService orgAccessService) {
        this.orgAccessService = orgAccessService;
    }

    @GetMapping
    public List<OrgUnitDto> list() {
        return orgAccessService.listFilterOrgUnits();
    }
}
