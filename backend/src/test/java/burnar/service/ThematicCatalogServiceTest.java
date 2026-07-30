package burnar.service;

import burnar.dto.ThematicCatalogNodeDto;
import org.junit.jupiter.api.Test;

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

/**
 * Проверяет чистую сборку eager-дерева отдельно от PostgreSQL.
 * Это фиксирует multi-root контракт API, сортировку и дедупликацию пересекающихся ACL-корней.
 */
class ThematicCatalogServiceTest {

    @Test
    void buildsOrderedMultiRootTreeAndDeduplicatesOverlappingRoots() {
        ThematicCatalogNodeDto firstRoot = node(100, null, "Первый корень", null, 1, 1);
        ThematicCatalogNodeDto secondRoot = node(200, null, "Второй корень", null, 2, 2);
        ThematicCatalogNodeDto laterSection = node(110, 100, "Раздел позже", null, 20, 1);
        ThematicCatalogNodeDto earlierSection = node(111, 100, "Раздел раньше", null, 10, 1);
        ThematicCatalogNodeDto subsection = node(120, 110, "Подраздел", null, 1, 1);
        ThematicCatalogNodeDto operation = node(130, 120, "Название операции из spr_oper", 900, 1, 1);

        // 110 приходит второй раз, когда ACL одновременно разрешил предка 100 и вложенный корень 110.
        ThematicCatalogNodeDto overlappingAclDuplicate =
                node(110, 100, "Раздел позже", null, 20, 1);

        List<ThematicCatalogNodeDto> roots = ThematicCatalogService.buildTree(List.of(
                secondRoot,
                operation,
                laterSection,
                overlappingAclDuplicate,
                firstRoot,
                subsection,
                earlierSection));

        assertEquals(List.of(100, 200), roots.stream().map(ThematicCatalogNodeDto::getId).toList());
        assertEquals(
                List.of(111, 110),
                roots.get(0).getChildren().stream().map(ThematicCatalogNodeDto::getId).toList());

        ThematicCatalogNodeDto builtLaterSection = roots.get(0).getChildren().get(1);
        ThematicCatalogNodeDto builtSubsection = builtLaterSection.getChildren().get(0);
        ThematicCatalogNodeDto builtOperation = builtSubsection.getChildren().get(0);

        assertEquals(2, roots.size());
        assertEquals(1, builtLaterSection.getChildren().size());
        assertEquals(120, builtSubsection.getId());
        assertNull(builtSubsection.getOperationId());
        assertEquals(900, builtOperation.getOperationId());
        assertEquals("Название операции из spr_oper", builtOperation.getName());
        assertTrue(roots.get(0).isHasChildren());
        assertTrue(builtLaterSection.isHasChildren());
        assertTrue(builtSubsection.isHasChildren());
        assertFalse(builtOperation.isHasChildren());
        assertTrue(builtOperation.getChildren().isEmpty());
    }

    @Test
    void returnsEmptyTreeForEmptyAclResult() {
        assertTrue(ThematicCatalogService.buildTree(List.of()).isEmpty());
    }

    private static ThematicCatalogNodeDto node(
            Integer id,
            Integer parentId,
            String name,
            Integer operationId,
            Integer ord,
            Integer narType) {
        return new ThematicCatalogNodeDto(id, parentId, name, operationId, ord, narType);
    }
}
