package burnar.service;

import org.junit.jupiter.api.Test;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

/**
 * Копирование, вырезание, вставка и пустой блок: порядок и отказы до вызова процедур.
 */
class NaryadClipboardTest {

    @Test
    void blockWithSelectedInnerWorkIsRejectedEvenThroughAnUnselectedRow() {
        NaryadClipboard.Node section = block(10, null, "1");
        NaryadClipboard.Node nested = block(11, 10L, "1");
        NaryadClipboard.Node work = work(12, 11L, "1");
        NaryadClipboard.Node sibling = work(13, 10L, "2");

        assertTrue(NaryadClipboard.mixesBlockAndInnerWork(
                List.of(section, nested, work, sibling), List.of(10L, 13L)));
        assertTrue(NaryadClipboard.mixesBlockAndInnerWork(
                List.of(section, nested, work, sibling), List.of(11L, 12L)));
        assertFalse(NaryadClipboard.mixesBlockAndInnerWork(
                List.of(section, nested, work, sibling), List.of(12L, 13L)));
    }

    @Test
    void nestedOperationsStayAllowed() {
        NaryadClipboard.Node parent = work(1, null, "1");
        NaryadClipboard.Node child = work(2, 1L, "1");

        assertFalse(NaryadClipboard.mixesBlockAndInnerWork(List.of(parent, child), List.of(1L, 2L)));
    }

    @Test
    void pasteSequenceFollowsVisibleOrderFromTheEnd() {
        NaryadClipboard.Node first = work(1, null, "1");
        NaryadClipboard.Node second = work(2, null, "2");
        NaryadClipboard.Node child = work(3, 1L, "1");

        List<Long> order = NaryadClipboard.pasteSequence(List.of(first, second, child), List.of(3L, 2L))
                .stream()
                .map(node -> node.id)
                .toList();

        assertEquals(List.of(2L, 3L), order);
    }

    @Test
    void pasteSequenceRejectsABlockTogetherWithItsWork() {
        ResponseStatusException error = assertThrows(ResponseStatusException.class, () ->
                NaryadClipboard.pasteSequence(
                        List.of(block(1, null, "1"), work(2, 1L, "1")),
                        List.of(1L, 2L)));

        assertEquals(409, error.getStatus().value());
        assertEquals(NaryadClipboard.NESTED_BLOCK_MESSAGE, error.getReason());
    }

    @Test
    void insideSlotUsesTheEmptyBlockAndBeforeUsesItsParent() {
        NaryadClipboard.Node empty = block(5, 1L, "3");
        NaryadClipboard.Slot inside = NaryadClipboard.pasteSlot(empty, "inside");
        NaryadClipboard.Slot before = NaryadClipboard.pasteSlot(empty, "before");

        assertEquals(5L, inside.parentId);
        assertEquals(new BigDecimal("1"), inside.prnum);
        assertEquals(1L, before.parentId);
        assertEquals(new BigDecimal("3"), before.prnum);
    }

    @Test
    void insideSlotRejectsABlockThatAlreadyHasChildren() {
        NaryadClipboard.Node filled = new NaryadClipboard.Node(5, 1L, new BigDecimal("3"), null, 0, "0", true);

        ResponseStatusException error = assertThrows(ResponseStatusException.class, () ->
                NaryadClipboard.pasteSlot(filled, "inside"));

        assertEquals(409, error.getStatus().value());
        assertEquals(NaryadClipboard.NOT_EMPTY_BLOCK_MESSAGE, error.getReason());
    }

    @Test
    void pasteBeforeLockedRowIsRejected() {
        ResponseStatusException error = assertThrows(ResponseStatusException.class, () ->
                NaryadClipboard.pasteSlot(work(4, 1L, "1", 1), "before"));

        assertEquals(NaryadClipboard.PASTE_LOCKED_MESSAGE, error.getReason());
    }

    @Test
    void cutOfLockedVipolnenieStopsBeforeAnyMove() {
        ResponseStatusException error = assertThrows(ResponseStatusException.class, () ->
                NaryadClipboard.requireCutAllowed(List.of(work(1, null, "1", 1)), true));

        assertEquals(NaryadClipboard.CUT_LOCKED_MESSAGE, error.getReason());
        NaryadClipboard.requireCutAllowed(List.of(work(1, null, "1", 1)), false);
    }

    @Test
    void emptyBlockNeedsAParentAndMayHaveAnEmptyName() {
        ResponseStatusException root = assertThrows(ResponseStatusException.class, () ->
                NaryadClipboard.requireEmptyBlock(block(1, null, "1"), ""));

        assertEquals(NaryadClipboard.EMPTY_BLOCK_ROOT_MESSAGE, root.getReason());
        NaryadClipboard.requireEmptyBlock(work(2, 1L, "2"), "");
        NaryadClipboard.requireEmptyBlock(work(2, 1L, "2", 1), "", false);
    }

    @Test
    void emptyBlockBeforeLockedVipolnenieRowIsRejected() {
        ResponseStatusException error = assertThrows(ResponseStatusException.class, () ->
                NaryadClipboard.requireEmptyBlock(work(2, 1L, "2", 1), "", true));

        assertEquals(NaryadClipboard.PASTE_LOCKED_MESSAGE, error.getReason());
    }

    @Test
    void renameAllowsOnlyAnUnlockedOrdinaryBlockWithAName() {
        assertNull(NaryadClipboard.renameRefusal(block(1, 2L, "1"), "Новый"));
        assertEquals(NaryadClipboard.NAME_REQUIRED, NaryadClipboard.renameRefusal(block(1, 2L, "1"), ""));
        assertEquals(
                NaryadClipboard.SYSTEM_BLOCK_MESSAGE,
                NaryadClipboard.renameRefusal(new NaryadClipboard.Node(
                        1, null, BigDecimal.ONE, null, 0, "1", false), "Имя"));
        assertEquals(
                NaryadClipboard.NOT_A_BLOCK_MESSAGE,
                NaryadClipboard.renameRefusal(work(1, null, "1"), "Имя"));
    }

    private static NaryadClipboard.Node block(long id, Long parentId, String prnum) {
        return new NaryadClipboard.Node(id, parentId, new BigDecimal(prnum), null, 0, "0", false);
    }

    private static NaryadClipboard.Node work(long id, Long parentId, String prnum) {
        return work(id, parentId, prnum, 0);
    }

    private static NaryadClipboard.Node work(long id, Long parentId, String prnum, int locked) {
        return new NaryadClipboard.Node(id, parentId, new BigDecimal(prnum), 80, locked, "0", false);
    }
}
