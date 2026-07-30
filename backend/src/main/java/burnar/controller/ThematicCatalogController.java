package burnar.controller;

import burnar.dto.ThematicCatalogNodeDto;
import burnar.service.ThematicCatalogService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/**
 * HTTP-точка входа read-only каталога. За аутентификацию отвечает общее правило /api/**
 * в SecurityConfig, а пользовательский ACL и сборка дерева остаются в сервисе.
 */
@RestController
@RequestMapping("/api/catalog")
public class ThematicCatalogController {

    private final ThematicCatalogService thematicCatalogService;

    public ThematicCatalogController(ThematicCatalogService thematicCatalogService) {
        this.thematicCatalogService = thematicCatalogService;
    }

    @GetMapping("/tree")
    public List<ThematicCatalogNodeDto> tree() {
        return thematicCatalogService.findTree();
    }
}
