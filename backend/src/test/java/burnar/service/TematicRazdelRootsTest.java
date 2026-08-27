package burnar.service;

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
class TematicRazdelRootsTest {

    private static final int ROOT = TematicRazdelRoots.CATALOG_ROOT_ID;
    /** 1 → 2 → 15, 20; 99 снаружи. */
    private static final Set<Integer> ANCESTORS = Set.of(1, ROOT);
    private static final Set<Integer> SUBTREE = Set.of(ROOT, 15, 20);

    @Test
    void catalogRootIsTwo() {
        assertEquals(2, TematicRazdelRoots.CATALOG_ROOT_ID);
    }

    @Test
    void ancestorAclRootBecomesCatalogRoot() {
        assertEquals(List.of(ROOT), TematicRazdelRoots.clipAclRoots(List.of(1), ANCESTORS, SUBTREE));
    }

    @Test
    void catalogRootItselfStays() {
        assertEquals(List.of(ROOT), TematicRazdelRoots.clipAclRoots(List.of(ROOT), ANCESTORS, SUBTREE));
    }

    @Test
    void descendantAclRootsKeptInOrder() {
        assertEquals(List.of(20, 15), TematicRazdelRoots.clipAclRoots(List.of(20, 15), ANCESTORS, SUBTREE));
    }

    @Test
    void ancestorPlusDescendantCollapsesToCatalogRoot() {
        assertEquals(List.of(ROOT), TematicRazdelRoots.clipAclRoots(List.of(1, 15), ANCESTORS, SUBTREE));
        assertEquals(List.of(ROOT), TematicRazdelRoots.clipAclRoots(List.of(15, 1), ANCESTORS, SUBTREE));
    }

    @Test
    void nodeOutsideSubtreeDropped() {
        assertEquals(List.of(), TematicRazdelRoots.clipAclRoots(List.of(99), ANCESTORS, SUBTREE));
    }

    @Test
    void outsideAmongDescendantsIsDropped() {
        assertEquals(List.of(15), TematicRazdelRoots.clipAclRoots(List.of(99, 15, 99), ANCESTORS, SUBTREE));
    }

    @Test
    void emptyAndNullsYieldEmpty() {
        assertEquals(List.of(), TematicRazdelRoots.clipAclRoots(List.of(), ANCESTORS, SUBTREE));
        assertEquals(List.of(), TematicRazdelRoots.clipAclRoots(Arrays.asList(1, null), Set.of(), Set.of()));
    }

    @Test
    void adminSeesOnlySubtreeIncludingRoot() {
        assertTrue(TematicRazdelRoots.isInCatalogSubtree(ROOT, SUBTREE));
        assertTrue(TematicRazdelRoots.isInCatalogSubtree(15, SUBTREE));
        assertFalse(TematicRazdelRoots.isInCatalogSubtree(1, SUBTREE));
        assertFalse(TematicRazdelRoots.isInCatalogSubtree(99, SUBTREE));
    }
}
