package burnar.service;

import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

/**
 * Удаление помеченных работ ({@code *_operac_del}) и проверка блока для
 * {@code *_operac_del_block}. Глубже и с большим prnum — раньше, как цикл Delphi с конца.
 */
public final class NaryadWorkDeletion {

    public static final String LOCKED_MESSAGE = "Не допускается удаление заблокированных работ!";
    public static final String SYSTEM_BLOCK_MESSAGE = "Невозможно удалить основной блок!";
    public static final String NOT_A_BLOCK_MESSAGE =
            "Удаление блока без удаления входящих работ доступно только для блока";

    private NaryadWorkDeletion() {
    }

    public static final class Node {
        public final long id;
        public final Long parentId;
        public final BigDecimal prnum;
        public final Integer operlifetype;
        public final Integer locked;
        public final String rs;

        public Node(
                long id,
                Long parentId,
                BigDecimal prnum,
                Integer operlifetype,
                Integer locked,
                String rs) {
            this.id = id;
            this.parentId = parentId;
            this.prnum = prnum;
            this.operlifetype = operlifetype;
            this.locked = locked;
            this.rs = rs;
        }
    }

    @FunctionalInterface
    public interface Existence {
        boolean exists(long id);
    }

    @FunctionalInterface
    public interface ProcedureCall {
        void delete(Node node);
    }

    public static boolean isLocked(Node node) {
        return node != null && node.locked != null && node.locked == 1;
    }

    /** Пустой блок, RS = 0, не заблокирован. Так включается act*_del_block. */
    public static boolean isDeletableBlock(Node node) {
        if (node == null || isLocked(node) || !"0".equals(node.rs)) {
            return false;
        }
        return node.operlifetype == null;
    }

    public static String blockDeleteRefusal(Node node) {
        if (node == null) {
            return NOT_A_BLOCK_MESSAGE;
        }
        if (isLocked(node)) {
            return LOCKED_MESSAGE;
        }
        if (!"0".equals(node.rs)) {
            return SYSTEM_BLOCK_MESSAGE;
        }
        if (node.operlifetype != null) {
            return NOT_A_BLOCK_MESSAGE;
        }
        return null;
    }

    /**
     * Сначала более глубокие выбранные строки, внутри уровня — больший prnum.
     * Потомок выбранного предка идёт раньше предка.
     */
    public static List<Node> markedDeletionOrder(List<Node> selected) {
        Map<Long, Node> byId = new HashMap<>();
        for (Node node : selected) {
            byId.put(node.id, node);
        }
        List<Node> ordered = new ArrayList<>(selected);
        ordered.sort(Comparator
                .comparingInt((Node node) -> selectedDepth(node, byId)).reversed()
                .thenComparing(node -> node.prnum == null ? BigDecimal.ZERO : node.prnum, Comparator.reverseOrder())
                .thenComparing(node -> node.id, Comparator.reverseOrder()));
        return List.copyOf(ordered);
    }

    /**
     * @param refuseLocked выполнение: любая заблокированная строка отменяет весь набор до вызовов
     */
    public static List<Long> deleteMarked(
            List<Node> selected,
            boolean refuseLocked,
            Existence exists,
            ProcedureCall call) {
        if (selected == null || selected.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "nodeIds are required");
        }
        if (refuseLocked && selected.stream().anyMatch(NaryadWorkDeletion::isLocked)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, LOCKED_MESSAGE);
        }
        List<Long> deleted = new ArrayList<>();
        List<String> errors = new ArrayList<>();
        for (Node node : markedDeletionOrder(selected)) {
            if (!exists.exists(node.id)) {
                continue;
            }
            try {
                call.delete(node);
                deleted.add(node.id);
            } catch (RuntimeException ex) {
                errors.add(NaryadProcedureMessages.from(ex));
            }
        }
        if (!errors.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, String.join("\n", errors));
        }
        return List.copyOf(deleted);
    }

    private static int selectedDepth(Node node, Map<Long, Node> byId) {
        int depth = 0;
        Long parentId = node.parentId;
        Set<Long> seen = new HashSet<>();
        while (parentId != null && byId.containsKey(parentId) && seen.add(parentId)) {
            depth++;
            parentId = byId.get(parentId).parentId;
        }
        return depth;
    }
}
