package burnar.controller;

import burnar.dto.ThematicCatalogNodeDto;
import burnar.service.ThematicCatalogService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/**
 * HTTP-точка полного дерева тематических разделов.
 * Доступ требует аутентифицированную сессию по общему правилу /api/**;
 * логин пользователя намеренно не принимается из query-параметров.
 */
@RestController
@RequestMapping("/api/thematic-catalog")
public class ThematicCatalogController {

    private final ThematicCatalogService thematicCatalogService;

    public ThematicCatalogController(ThematicCatalogService thematicCatalogService) {
        this.thematicCatalogService = thematicCatalogService;
    }

    @GetMapping
    public List<ThematicCatalogNodeDto> getCatalog() {
        return thematicCatalogService.getCatalog();
    }
}
