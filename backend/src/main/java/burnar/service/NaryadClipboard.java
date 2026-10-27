package burnar.service;

import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.HashSet;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

/**
 * Буфер копирования и вырезания работ наряда и место вставки.
 * Процедуры вызываются с конца видимого порядка, чтобы несколько строк
 * встали в одну точку в исходной последовательности.
 */
public final class NaryadClipboard {

    public static final String NESTED_BLOCK_MESSAGE =
            "Нельзя копировать и вырезать блок вместе с работами внутри него. Выделите их по отдельности.";
    public static final String CUT_LOCKED_MESSAGE =
            "Не допускается перемещение заблокированных работ!";
    public static final String PASTE_LOCKED_MESSAGE =
            "Не допускается вставка работы перед заблокированными!";
    public static final String EMPTY_BLOCK_ROOT_MESSAGE =
            "Создавать блоки можно только в основных разделах!";
    public static final String NOT_EMPTY_BLOCK_MESSAGE =
            "Внутрь можно вставить только в пустой блок";
    public static final String NAME_REQUIRED = "Название блока не задано";
    public static final String NAME_TOO_LONG = "Название блока длиннее 512 символов";
    public static final String SYSTEM_BLOCK_MESSAGE = "Невозможно переименовать основной блок!";
    public static final String NOT_A_BLOCK_MESSAGE = "Переименовать можно только блок";
    public static final String LOCKED_RENAME_MESSAGE =
            "Не допускается изменение заблокированных работ!";
    public static final int NAME_LIMIT = 512;

    private NaryadClipboard() {
    }

    public static final class Node {
        public final long id;
        public final Long parentId;
        public final BigDecimal prnum;
        public final Integer operlifetype;
        public final Integer locked;
        public final String rs;
        public final boolean hasChildren;

        public Node(
                long id,
                Long parentId,
                BigDecimal prnum,
                Integer operlifetype,
                Integer locked,
                String rs,
                boolean hasChildren) {
            this.id = id;
            this.parentId = parentId;
            this.prnum = prnum;
            this.operlifetype = operlifetype;
            this.locked = locked;
            this.rs = rs;
            this.hasChildren = hasChildren;
        }
    }

    public static final class Slot {
        public final Long parentId;
        public final BigDecimal prnum;

        public Slot(Long parentId, BigDecimal prnum) {
            this.parentId = parentId;
            this.prnum = prnum;
        }
    }

    public static boolean isBlock(Node node) {
        return node != null && node.operlifetype == null;
    }

    public static boolean isEmptyBlock(Node node) {
        return isBlock(node) && !node.hasChildren;
    }

    public static boolean isLocked(Node node) {
        return node != null && node.locked != null && node.locked == 1;
    }

    /**
     * Выделен блок и одновременно строка внутри него, в том числе через
     * невыделенный промежуточный уровень.
     */
    public static boolean mixesBlockAndInnerWork(List<Node> tree, List<Long> selectedIds) {
        if (tree == null || selectedIds == null || selectedIds.size() < 2) {
            return false;
        }
        Map<Long, Node> byId = index(tree);
        Set<Long> selected = new HashSet<>(selectedIds);
        for (Long id : selected) {
            Node node = byId.get(id);
            if (node == null) {
                continue;
            }
            Long parentId = node.parentId;
            while (parentId != null) {
                Node parent = byId.get(parentId);
                if (parent == null) {
                    break;
                }
                if (selected.contains(parent.id) && isBlock(parent)) {
                    return true;
                }
                parentId = parent.parentId;
            }
        }
        return false;
    }

    /** Видимый порядок дерева, затем разворот: каждая вставка занимает одно и то же место. */
    public static List<Node> pasteSequence(List<Node> tree, List<Long> selectedIds) {
        if (selectedIds == null || selectedIds.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "nodeIds are required");
        }
        if (mixesBlockAndInnerWork(tree, selectedIds)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, NESTED_BLOCK_MESSAGE);
        }
        List<Node> visual = visualOrder(tree, selectedIds);
        List<Node> reversed = new ArrayList<>(visual);
        java.util.Collections.reverse(reversed);
        return List.copyOf(reversed);
    }

    public static List<Node> visualOrder(List<Node> tree, List<Long> selectedIds) {
        Map<Long, Node> byId = index(tree);
        LinkedHashSet<Long> selected = new LinkedHashSet<>(selectedIds);
        for (Long id : selected) {
            if (!byId.containsKey(id)) {
                throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Naryad row not found");
            }
        }
        Map<Long, List<Node>> children = new HashMap<>();
        List<Node> roots = new ArrayList<>();
        for (Node node : byId.values()) {
            if (node.parentId == null || !byId.containsKey(node.parentId)) {
                roots.add(node);
            } else {
                children.computeIfAbsent(node.parentId, key -> new ArrayList<>()).add(node);
            }
        }
        Comparator<Node> sibling = Comparator
                .comparing((Node node) -> node.prnum == null ? new BigDecimal(Long.MAX_VALUE) : node.prnum)
                .thenComparingLong(node -> node.id);
        roots.sort(sibling);
        for (List<Node> level : children.values()) {
            level.sort(sibling);
        }
        List<Node> ordered = new ArrayList<>();
        walk(roots, children, ordered);
        List<Node> picked = new ArrayList<>();
        for (Node node : ordered) {
            if (selected.contains(node.id)) {
                picked.add(node);
            }
        }
        return List.copyOf(picked);
    }

    public static Slot pasteSlot(Node target, String place) {
        if (target == null) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Naryad row not found");
        }
        if (isLocked(target)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, PASTE_LOCKED_MESSAGE);
        }
        if ("inside".equals(place)) {
            if (!isEmptyBlock(target)) {
                throw new ResponseStatusException(HttpStatus.CONFLICT, NOT_EMPTY_BLOCK_MESSAGE);
            }
            return new Slot(target.id, BigDecimal.ONE);
        }
        if ("before".equals(place)) {
            return new Slot(target.parentId, target.prnum);
        }
        if ("after".equals(place)) {
            BigDecimal prnum = target.prnum == null ? BigDecimal.ONE : target.prnum.add(BigDecimal.ONE);
            return new Slot(target.parentId, prnum);
        }
        throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "place is required");
    }

    /**
     * Перенос внутри того же уровня: процедура ставит строку на конечный номер,
     * а не сдвигает хвост, как копирование. Номер считается от живого номера цели.
     */
    public static BigDecimal sameLevelMovePrnum(BigDecimal sourcePrnum, BigDecimal targetPrnum, String place) {
        if (!"before".equals(place) && !"after".equals(place)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "place is required");
        }
        if (sourcePrnum == null || targetPrnum == null) {
            return "after".equals(place) ? BigDecimal.ONE : targetPrnum;
        }
        int cmp = sourcePrnum.compareTo(targetPrnum);
        if ("before".equals(place)) {
            return cmp < 0 ? targetPrnum.subtract(BigDecimal.ONE) : targetPrnum;
        }
        return cmp > 0 ? targetPrnum.add(BigDecimal.ONE) : targetPrnum;
    }

    /** Пустой блок — сосед выбранной строки: перед ней или сразу после. */
    public static BigDecimal emptyBlockPrnum(Node anchor, String place) {
        if (!"before".equals(place) && !"after".equals(place)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "place is required");
        }
        if ("before".equals(place)) {
            return anchor.prnum;
        }
        return anchor.prnum == null ? BigDecimal.ONE : anchor.prnum.add(BigDecimal.ONE);
    }

    /** Выполнение не вырезает набор, в котором есть заблокированная работа. */
    public static void requireCutAllowed(List<Node> sources, boolean refuseLocked) {
        if (refuseLocked && sources != null && sources.stream().anyMatch(NaryadClipboard::isLocked)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, CUT_LOCKED_MESSAGE);
        }
    }

    public static void requireEmptyBlock(Node before, String name) {
        requireEmptyBlock(before, name, false);
    }

    public static void requireEmptyBlock(Node before, String name, boolean refuseLocked) {
        if (name == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, NAME_REQUIRED);
        }
        if (name.length() > NAME_LIMIT) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, NAME_TOO_LONG);
        }
        if (before == null) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Naryad row not found");
        }
        if (before.parentId == null) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, EMPTY_BLOCK_ROOT_MESSAGE);
        }
        if (refuseLocked && isLocked(before)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, PASTE_LOCKED_MESSAGE);
        }
    }

    /** null — переименование допустимо. Пустое имя и длина — отказ, не запись. */
    public static String renameRefusal(Node node, String name) {
        if (name == null || name.isEmpty()) {
            return NAME_REQUIRED;
        }
        if (name.length() > NAME_LIMIT) {
            return NAME_TOO_LONG;
        }
        if (node == null) {
            return "Naryad row not found";
        }
        if (isLocked(node)) {
            return LOCKED_RENAME_MESSAGE;
        }
        if (!"0".equals(node.rs)) {
            return SYSTEM_BLOCK_MESSAGE;
        }
        if (!isBlock(node)) {
            return NOT_A_BLOCK_MESSAGE;
        }
        return null;
    }

    private static Map<Long, Node> index(List<Node> tree) {
        Map<Long, Node> byId = new HashMap<>();
        if (tree == null) {
            return byId;
        }
        for (Node node : tree) {
            byId.put(node.id, node);
        }
        return byId;
    }

    private static void walk(List<Node> level, Map<Long, List<Node>> children, List<Node> ordered) {
        for (Node node : level) {
            ordered.add(node);
            List<Node> nested = children.get(node.id);
            if (nested != null) {
                walk(nested, children, ordered);
            }
        }
    }
}
