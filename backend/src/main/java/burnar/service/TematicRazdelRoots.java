package burnar.service;

import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;

/**
 * Корень видимого каталога — id=2; ACL-корни не-админа обрезаются до этого поддерева.
 */
final class TematicRazdelRoots {

    static final int CATALOG_ROOT_ID = 2;

    private TematicRazdelRoots() {
    }

    /**
     * Предок или сам корень → один корень {@link #CATALOG_ROOT_ID}.
     * Потомки сохраняются (порядок и уникальность). Узлы вне поддерева отбрасываются.
     */
    static List<Integer> clipAclRoots(
            List<Integer> aclRoots, Set<Integer> ancestorsOfRoot, Set<Integer> subtreeOfRoot) {
        if (aclRoots == null || aclRoots.isEmpty()) {
            return List.of();
        }
        Set<Integer> ancestors = ancestorsOfRoot == null ? Set.of() : ancestorsOfRoot;
        Set<Integer> subtree = subtreeOfRoot == null ? Set.of() : subtreeOfRoot;
        LinkedHashSet<Integer> descendants = new LinkedHashSet<>();
        boolean seesWholeSubtree = false;
        for (Integer id : aclRoots) {
            if (id == null) {
                continue;
            }
            if (ancestors.contains(id)) {
                seesWholeSubtree = true;
            } else if (subtree.contains(id)) {
                descendants.add(id);
            }
        }
        if (seesWholeSubtree) {
            return List.of(CATALOG_ROOT_ID);
        }
        return List.copyOf(descendants);
    }

    static boolean isInCatalogSubtree(int nodeId, Set<Integer> subtreeOfRoot) {
        return subtreeOfRoot != null && subtreeOfRoot.contains(nodeId);
    }
}
