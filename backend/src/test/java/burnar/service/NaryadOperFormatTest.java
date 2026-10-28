package burnar.service;

import org.junit.jupiter.api.Test;
import org.springframework.web.server.ResponseStatusException;

import java.sql.Timestamp;
import java.time.LocalDateTime;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

class NaryadOperFormatTest {

    @Test
    void midnightBegoperdateIsDateOnly() {
        Timestamp ts = Timestamp.valueOf(LocalDateTime.of(2024, 3, 5, 0, 0, 0));
        assertEquals("05.03.2024", NaryadOperFormat.formatBegoperdate(ts));
    }

    @Test
    void begoperdateWithTimeKeepsHoursMinutesAndSeconds() {
        Timestamp ts = Timestamp.valueOf(LocalDateTime.of(2024, 3, 5, 14, 7, 30));
        assertEquals("05.03.2024 14:07:30", NaryadOperFormat.formatBegoperdate(ts));
    }

    @Test
    void begoperdateWithOnlySecondsKeepsTime() {
        Timestamp ts = Timestamp.valueOf(LocalDateTime.of(2024, 3, 5, 0, 0, 15));
        assertEquals("05.03.2024 00:00:15", NaryadOperFormat.formatBegoperdate(ts));
    }

    @Test
    void nullBegoperdateStaysNull() {
        assertNull(NaryadOperFormat.formatBegoperdate(null));
    }

    @Test
    void paramsOnlyForCombinationAndAlgorithm() {
        assertTrue(NaryadOperFormat.loadsParams(79));
        assertTrue(NaryadOperFormat.loadsParams(80));
        assertFalse(NaryadOperFormat.loadsParams(78));
        assertFalse(NaryadOperFormat.loadsParams(82));
        assertFalse(NaryadOperFormat.loadsParams(81));
        assertFalse(NaryadOperFormat.loadsParams(null));
    }

    @Test
    void algorithmOnlyForOperlifetype80() {
        assertTrue(NaryadOperFormat.loadsAlgorithm(80));
        assertFalse(NaryadOperFormat.loadsAlgorithm(79));
        assertFalse(NaryadOperFormat.loadsAlgorithm(null));
    }

    @Test
    void colorMustBeWithinRgbRange() {
        assertEquals(0, NaryadOperFormat.requireValidColor(0));
        assertEquals(0xFFFFFF, NaryadOperFormat.requireValidColor(0xFFFFFF));
        assertThrows(ResponseStatusException.class,
                () -> NaryadOperFormat.requireValidColor(-1));
        assertThrows(ResponseStatusException.class,
                () -> NaryadOperFormat.requireValidColor(0x1000000));
        assertThrows(ResponseStatusException.class,
                () -> NaryadOperFormat.requireValidColor(null));
    }

    @Test
    void nodeIdsAreRequiredAndDuplicatesCollapseInRequestOrder() {
        assertEquals(List.of(7L, 8L), NaryadOperFormat.requireNodeIds(List.of(7L, 7L, 8L)));
        assertThrows(ResponseStatusException.class,
                () -> NaryadOperFormat.requireNodeIds(null));
        assertThrows(ResponseStatusException.class,
                () -> NaryadOperFormat.requireNodeIds(List.of()));
        assertThrows(ResponseStatusException.class,
                () -> NaryadOperFormat.requireNodeIds(java.util.Arrays.asList(7L, null)));
    }
}
