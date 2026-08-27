package burnar.service;

import org.junit.jupiter.api.Test;

import java.util.Arrays;
import java.util.List;
import java.util.Set;

import static org.junit.jupiter.api.Assertions.assertEquals;

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
}
