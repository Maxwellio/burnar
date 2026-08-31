package burnar.service;

import burnar.dto.TematicRazdelNodeDto;
import org.junit.jupiter.api.Test;

import java.util.Arrays;
import java.util.List;
import java.util.Set;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

/**
 * Обрезка ACL-корней до поддерева каталога (id=2): предок → 2, потомок сохраняется,
 * узел вне поддерева отбрасывается; 2 + потомки не дублируются как корни.
 */
class TematicRazdelServiceTest {

    private static final int ROOT = TematicRazdelService.CATALOG_ROOT_ID;
    /** 1 → 2 → 15, 20; 99 снаружи. */
    private static final Set<Integer> ANCESTORS = Set.of(1, ROOT);
    private static final Set<Integer> SUBTREE = Set.of(ROOT, 15, 20);

    @Test
    void catalogRootIsTwo() {
        assertEquals(2, TematicRazdelService.CATALOG_ROOT_ID);
    }

    @Test
    void ancestorAclRootBecomesCatalogRoot() {
        assertEquals(List.of(ROOT), TematicRazdelService.clipAclRoots(List.of(1), ANCESTORS, SUBTREE));
    }

    @Test
    void catalogRootItselfStays() {
        assertEquals(List.of(ROOT), TematicRazdelService.clipAclRoots(List.of(ROOT), ANCESTORS, SUBTREE));
    }

    @Test
    void descendantAclRootsKeptInOrder() {
        assertEquals(List.of(20, 15), TematicRazdelService.clipAclRoots(List.of(20, 15), ANCESTORS, SUBTREE));
    }

    @Test
    void ancestorPlusDescendantCollapsesToCatalogRoot() {
        assertEquals(List.of(ROOT), TematicRazdelService.clipAclRoots(List.of(1, 15), ANCESTORS, SUBTREE));
        assertEquals(List.of(ROOT), TematicRazdelService.clipAclRoots(List.of(15, 1), ANCESTORS, SUBTREE));
    }

    @Test
    void nodeOutsideSubtreeDropped() {
        assertEquals(List.of(), TematicRazdelService.clipAclRoots(List.of(99), ANCESTORS, SUBTREE));
    }

    @Test
    void outsideAmongDescendantsIsDropped() {
        assertEquals(List.of(15), TematicRazdelService.clipAclRoots(List.of(99, 15, 99), ANCESTORS, SUBTREE));
    }

    @Test
    void emptyAndNullsYieldEmpty() {
        assertEquals(List.of(), TematicRazdelService.clipAclRoots(List.of(), ANCESTORS, SUBTREE));
        assertEquals(List.of(), TematicRazdelService.clipAclRoots(Arrays.asList(1, null), Set.of(), Set.of()));
    }

    @Test
    void idPrefixDoesNotMatchMiddleDigits() {
        TematicRazdelNodeDto n167 = node(167, 15, "x", 167, 1);
        assertFalse(TematicRazdelService.matches(n167, "67", null, null));
        assertTrue(TematicRazdelService.matches(node(67, 15, "x", null, 1), "67", null, null));
        assertTrue(TematicRazdelService.matches(node(670, 15, "x", null, 1), "67", null, null));
    }

    @Test
    void operPrefixDoesNotMatchMiddleDigits() {
        assertFalse(TematicRazdelService.matches(node(151, 15, "Подъём", 167, 1), null, null, "67"));
        assertTrue(TematicRazdelService.matches(node(150, 15, "Спуск", 67, 1), null, null, "67"));
        assertTrue(TematicRazdelService.matches(node(201, 20, "Цемент", 670, 1), null, null, "67"));
        assertFalse(TematicRazdelService.matches(node(15, 2, "Бурение", null, 1), null, null, "67"));
    }

    @Test
    void nameMatchIsSubstringCaseInsensitive() {
        TematicRazdelNodeDto drilling = node(15, 2, "Бурение", null, 1);
        assertTrue(TematicRazdelService.matches(drilling, null, "бур", null));
        assertTrue(TematicRazdelService.matches(drilling, null, "РЕН", null));
        assertFalse(TematicRazdelService.matches(drilling, null, "цемент", null));
    }

    @Test
    void filtersCombineWithAnd() {
        TematicRazdelNodeDto hit = node(150, 15, "Спуск", 67, 1);
        assertTrue(TematicRazdelService.matches(hit, "15", "спуск", "67"));
        assertFalse(TematicRazdelService.matches(hit, "15", "спуск", "99"));
        assertFalse(TematicRazdelService.matches(node(151, 15, "Подъём", 167, 1), "15", null, "67"));
    }

    @Test
    void nestKeepsAncestorsAndDropsNonMatchingSiblings() {
        TematicRazdelNodeDto root = node(2, 1, "Каталог", null, 0);
        TematicRazdelNodeDto drilling = node(15, 2, "Бурение", null, 1);
        TematicRazdelNodeDto descent = node(150, 15, "Спуск", 67, 2);
        TematicRazdelNodeDto lift = node(151, 15, "Подъём", 167, 3);
        TematicRazdelNodeDto casing = node(20, 2, "Крепление", null, 4);
        TematicRazdelNodeDto cement = node(201, 20, "Цемент", 670, 5);

        List<TematicRazdelNodeDto> forest = TematicRazdelService.nestFiltered(
                List.of(root, drilling, descent, lift, casing, cement),
                List.of(2),
                null,
                null,
                "67");

        assertEquals(List.of(2), forest.stream().map(TematicRazdelNodeDto::getId).toList());
        assertEquals(List.of(15, 20), ids(forest.get(0).getChildren()));
        assertEquals(List.of(150), ids(forest.get(0).getChildren().get(0).getChildren()));
        assertEquals(List.of(201), ids(forest.get(0).getChildren().get(1).getChildren()));
        assertTrue(forest.get(0).getHasChildren());
        assertFalse(forest.get(0).getChildren().get(0).getChildren().get(0).getHasChildren());
    }

    private static List<Integer> ids(List<TematicRazdelNodeDto> nodes) {
        return nodes.stream().map(TematicRazdelNodeDto::getId).toList();
    }

    private static TematicRazdelNodeDto node(int id, Integer parentId, String name, Integer oper, Integer ord) {
        TematicRazdelNodeDto dto = new TematicRazdelNodeDto();
        dto.setId(id);
        dto.setParentId(parentId);
        dto.setName(name);
        dto.setOper(oper);
        dto.setOrd(ord);
        return dto;
    }
}
