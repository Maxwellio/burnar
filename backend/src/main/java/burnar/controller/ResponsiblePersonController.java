package burnar.controller;

import burnar.dto.CareerDto;
import burnar.dto.ResponsiblePersonDto;
import burnar.service.ResponsiblePersonService;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/**
 * Pageable read-API для страницы «Ответственные лица» (BaseTable слева/справа).
 * Доступ — любой authenticated (SecurityConfig /api/**); orgUnitId meaningfully только для админа.
 */
@RestController
@RequestMapping("/api/responsible-persons")
public class ResponsiblePersonController {

    private final ResponsiblePersonService responsiblePersonService;

    public ResponsiblePersonController(ResponsiblePersonService responsiblePersonService) {
        this.responsiblePersonService = responsiblePersonService;
    }

    @GetMapping
    public Page<ResponsiblePersonDto> list(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "100") int size,
            @RequestParam(required = false) Integer orgUnitId) {
        return responsiblePersonService.findPeople(PageRequest.of(page, size), orgUnitId);
    }

    @GetMapping("/{peopleId}/careers")
    public Page<CareerDto> careers(
            @PathVariable int peopleId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "100") int size,
            @RequestParam(required = false) Integer orgUnitId) {
        return responsiblePersonService.findCareers(
                peopleId, PageRequest.of(page, size), orgUnitId);
    }
}
