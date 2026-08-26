package burnar.controller;

import burnar.dto.CareerDto;
import burnar.dto.CareerWriteRequest;
import burnar.dto.DeleteBlockDto;
import burnar.dto.IdResponse;
import burnar.dto.OrgUnitDto;
import burnar.dto.ResponsiblePersonCreateRequest;
import burnar.dto.ResponsiblePersonDetailDto;
import burnar.dto.ResponsiblePersonDto;
import burnar.dto.ResponsiblePersonUpdateRequest;
import burnar.service.ResponsiblePersonService;
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
import java.util.List;
import java.util.Map;

/**
 * API страницы «Ответственные лица»: список/карьеры + CRUD people и careers.
 * Литералы /org-units, /positions, /org-tree — до /{peopleId}, иначе уйдут в path variable.
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
            @RequestParam(required = false) Integer orgUnitId,
            @RequestParam(required = false) String id,
            @RequestParam(required = false) String fio,
            @RequestParam(required = false) String oraName) {
        return responsiblePersonService.findPeople(
                PageRequest.of(page, size), orgUnitId, id, fio, oraName);
    }

    /** Select «структура»: id 1,5,6,7,8,123 (Delphi qrPodr), не /api/org-units нарядов. */
    @GetMapping("/org-units")
    public List<OrgUnitDto> orgUnits() {
        return responsiblePersonService.listFilterOrgUnits();
    }

    /** Справочник должностей для формы добавления. */
    @GetMapping("/positions")
    public List<OrgUnitDto> positions() {
        return responsiblePersonService.listPositions();
    }

    /** Дерево подразделений с путём для комбо формы добавления. */
    @GetMapping("/org-tree")
    public List<OrgUnitDto> orgTree() {
        return responsiblePersonService.listOrgTree();
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public IdResponse create(@RequestBody ResponsiblePersonCreateRequest body) {
        return responsiblePersonService.createPerson(body);
    }

    @GetMapping("/{peopleId}")
    public ResponsiblePersonDetailDto get(@PathVariable int peopleId) {
        return responsiblePersonService.getPerson(peopleId);
    }

    @PutMapping("/{peopleId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void update(
            @PathVariable int peopleId,
            @RequestBody ResponsiblePersonUpdateRequest body) {
        responsiblePersonService.updatePerson(peopleId, body);
    }

    @GetMapping("/{peopleId}/delete-block")
    public DeleteBlockDto personDeleteBlock(@PathVariable int peopleId) {
        return responsiblePersonService.personDeleteBlock(peopleId);
    }

    @DeleteMapping("/{peopleId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable int peopleId) {
        responsiblePersonService.deletePerson(peopleId);
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

    @GetMapping("/{peopleId}/careers/{careerKey}")
    public CareerDto career(
            @PathVariable int peopleId,
            @PathVariable int careerKey) {
        return responsiblePersonService.getCareer(peopleId, careerKey);
    }

    @PostMapping("/{peopleId}/careers")
    @ResponseStatus(HttpStatus.CREATED)
    public void createCareer(
            @PathVariable int peopleId,
            @RequestBody CareerWriteRequest body) {
        responsiblePersonService.createCareer(peopleId, body);
    }

    @PutMapping("/{peopleId}/careers/{careerKey}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void updateCareer(
            @PathVariable int peopleId,
            @PathVariable int careerKey,
            @RequestBody CareerWriteRequest body) {
        responsiblePersonService.updateCareer(peopleId, careerKey, body);
    }

    @GetMapping("/{peopleId}/careers/{careerKey}/delete-block")
    public DeleteBlockDto careerDeleteBlock(
            @PathVariable int peopleId,
            @PathVariable int careerKey) {
        return responsiblePersonService.careerDeleteBlock(peopleId, careerKey);
    }

    @DeleteMapping("/{peopleId}/careers/{careerKey}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteCareer(
            @PathVariable int peopleId,
            @PathVariable int careerKey) {
        responsiblePersonService.deleteCareer(peopleId, careerKey);
    }

    /**
     * Boot 2.7 по умолчанию скрывает message в JSON — без этого 409 на фронте
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
