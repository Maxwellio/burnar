package burnar.service;

import org.junit.jupiter.api.Test;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.Set;
import java.util.concurrent.atomic.AtomicReference;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

/**
 * Порядок и отказы удаления работ: как tbDelSelOpersClick и act*_del_block.
 */
class NaryadWorkDeletionTest {

    @Test
    void markedOrderDeletesDeeperRowsAndHigherPrnumFirst() {
        NaryadWorkDeletion.Node parent = node(1, null, "1");
        NaryadWorkDeletion.Node lowChild = node(2, 1L, "1");
        NaryadWorkDeletion.Node highChild = node(3, 1L, "2");

        List<Long> order = NaryadWorkDeletion.markedDeletionOrder(List.of(parent, lowChild, highChild))
                .stream()
                .map(node -> node.id)
                .toList();

        assertEquals(List.of(3L, 2L, 1L), order);
    }

    @Test
    void vipLockedSelectionFailsBeforeAnyProcedureCall() {
        List<Long> called = new ArrayList<>();
        ResponseStatusException error = assertThrows(ResponseStatusException.class, () ->
                NaryadWorkDeletion.deleteMarked(
                        List.of(node(1, null, "1"), locked(2)),
                        true,
                        id -> true,
                        node -> called.add(node.id)));

        assertEquals(409, error.getStatus().value());
        assertEquals(NaryadWorkDeletion.LOCKED_MESSAGE, error.getReason());
        assertTrue(called.isEmpty());
    }

    @Test
    void zadanieLockedRowIsStillDeleted() {
        List<Long> called = new ArrayList<>();
        List<Long> deleted = NaryadWorkDeletion.deleteMarked(
                List.of(locked(4)),
                false,
                id -> true,
                node -> called.add(node.id));

        assertEquals(List.of(4L), deleted);
        assertEquals(List.of(4L), called);
    }

    @Test
    void continuesAfterAProcedureErrorAndSkipsRowsAlreadyRemoved() {
        Set<Long> present = new java.util.HashSet<>(Set.of(1L, 2L));
        List<Long> called = new ArrayList<>();
        AtomicReference<ResponseStatusException> error = new AtomicReference<>();

        try {
            NaryadWorkDeletion.deleteMarked(
                    List.of(node(1, null, "1"), node(2, 1L, "1")),
                    false,
                    present::contains,
                    node -> {
                        called.add(node.id);
                        if (node.id == 2L) {
                            throw new IllegalStateException("ERROR: -20001,Нельзя удалять работы из структуры!");
                        }
                        present.remove(node.id);
                        present.remove(2L);
                    });
        } catch (ResponseStatusException ex) {
            error.set(ex);
        }

        assertEquals(List.of(2L, 1L), called);
        assertEquals("Нельзя удалять работы из структуры!", error.get().getReason());
    }

    @Test
    void blockDeleteAllowsOnlyAnUnlockedOrdinaryBlock() {
        assertTrue(NaryadWorkDeletion.isDeletableBlock(node(1, null, "1")));
        assertFalse(NaryadWorkDeletion.isDeletableBlock(locked(1)));
        assertFalse(NaryadWorkDeletion.isDeletableBlock(new NaryadWorkDeletion.Node(
                1L, null, BigDecimal.ONE, null, 0, "1")));
        assertFalse(NaryadWorkDeletion.isDeletableBlock(new NaryadWorkDeletion.Node(
                1L, null, BigDecimal.ONE, 79, 0, "0")));
    }

    private static NaryadWorkDeletion.Node node(long id, Long parentId, String prnum) {
        return new NaryadWorkDeletion.Node(id, parentId, new BigDecimal(prnum), null, 0, "0");
    }

    private static NaryadWorkDeletion.Node locked(long id) {
        return new NaryadWorkDeletion.Node(id, null, BigDecimal.ONE, 80, 1, "0");
    }
}
