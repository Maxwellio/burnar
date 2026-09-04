package burnar.controller;

import burnar.dto.TematicRazdelNodeDto;
import burnar.service.TematicRazdelService;
import org.springframework.util.StringUtils;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/**
 * Read-only дерево каталога тематических разделов (Delphi formStructNur).
 * Корни — массив (не Page): так ждёт BaseTreeTable / useFetchTreeData.
 * Дети — GET /{id}/children; литерал children не пересекается с числовым id.
 */
@RestController
@RequestMapping("/api/tematic-razdels")
public class TematicRazdelController {

    private final TematicRazdelService tematicRazdelService;

    public TematicRazdelController(TematicRazdelService tematicRazdelService) {
        this.tematicRazdelService = tematicRazdelService;
    }

    @GetMapping
    public List<TematicRazdelNodeDto> roots(
            @RequestParam(required = false) String id,
            @RequestParam(required = false) String name,
            @RequestParam(required = false) String oper,
            @RequestParam(required = false) String expandAll) {
        return tematicRazdelService.findRoots(id, name, oper, StringUtils.hasText(expandAll));
    }

    @GetMapping("/{id}/children")
    public List<TematicRazdelNodeDto> children(@PathVariable int id) {
        return tematicRazdelService.findChildren(id);
    }
}
