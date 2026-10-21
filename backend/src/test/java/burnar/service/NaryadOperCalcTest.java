package burnar.service;

import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

class NaryadOperCalcTest {

    @Test
    void calculationIsOnlyForCombinationAndAlgorithm() {
        assertTrue(NaryadOperCalc.isCalculable(79));
        assertTrue(NaryadOperCalc.isCalculable(80));
        assertFalse(NaryadOperCalc.isCalculable(78));
        assertFalse(NaryadOperCalc.isCalculable(81));
        assertFalse(NaryadOperCalc.isCalculable(82));
        assertFalse(NaryadOperCalc.isCalculable(null));
    }

    @Test
    void refusalNamesTheFirstBlockingReason() {
        assertEquals(
                NaryadOperCalc.CLOSED_MESSAGE,
                NaryadOperCalc.calcRefusal(true, true, true, 82));
        assertEquals(
                NaryadOperCalc.LOCKED_MESSAGE,
                NaryadOperCalc.calcRefusal(false, true, false, 79));
        assertEquals(
                NaryadOperCalc.NOT_LEAF_MESSAGE,
                NaryadOperCalc.calcRefusal(false, false, true, 80));
        assertEquals(
                NaryadOperCalc.WRONG_TYPE_MESSAGE,
                NaryadOperCalc.calcRefusal(false, false, false, 82));
        assertNull(NaryadOperCalc.calcRefusal(false, false, false, 79));
        assertEquals(
                NaryadOperCalc.NOT_EDITABLE_TYPE,
                NaryadOperCalc.paramRefusal(false, false, 3));
        assertNull(NaryadOperCalc.paramRefusal(false, false, 1));
    }

    @Test
    void continuousValueFitsNumeric16Scale4() {
        assertNull(NaryadOperCalc.normalizeZnach(null));
        assertEquals(new BigDecimal("1.2346"), NaryadOperCalc.normalizeZnach(new BigDecimal("1.23456")));
        assertEquals(new BigDecimal("999999999999.9999"), NaryadOperCalc.normalizeZnach(new BigDecimal("999999999999.9999")));
        assertThrows(
                IllegalArgumentException.class,
                () -> NaryadOperCalc.normalizeZnach(new BigDecimal("1000000000000")));
    }

    @Test
    void sameStoredNumberIgnoresScaleAndNullMatchesOnlyNull() {
        assertTrue(NaryadOperCalc.sameZnach(new BigDecimal("1.50"), new BigDecimal("1.5")));
        assertTrue(NaryadOperCalc.sameZnach(null, null));
        assertFalse(NaryadOperCalc.sameZnach(null, BigDecimal.ONE));
        assertFalse(NaryadOperCalc.sameZnach(BigDecimal.ONE, new BigDecimal("2")));
    }

    @Test
    void discreteValueMustBeOneOfTheLoadedCodes() {
        List<BigDecimal> allowed = List.of(new BigDecimal("10.0"), new BigDecimal("11"));
        assertTrue(NaryadOperCalc.listed(null, allowed));
        assertTrue(NaryadOperCalc.listed(new BigDecimal("10"), allowed));
        assertFalse(NaryadOperCalc.listed(new BigDecimal("12"), allowed));
    }

    @Test
    void procedureSettingsDistinguishZeroNullAndEmptyText() {
        assertNull(NaryadOperCalc.settingDecimal(null));
        assertNull(NaryadOperCalc.settingDecimal("  "));
        assertEquals(new BigDecimal("0"), NaryadOperCalc.settingDecimal("0"));
        assertEquals(new BigDecimal("1.25"), NaryadOperCalc.settingDecimal("1.25"));
        assertFalse(NaryadOperCalc.rebuilt("0"));
        assertFalse(NaryadOperCalc.rebuilt(""));
        assertTrue(NaryadOperCalc.rebuilt("1.0"));
        assertNull(NaryadOperCalc.settingText("", "0"));
        assertEquals("", NaryadOperCalc.settingText("", "1"));
        assertEquals("СН-1", NaryadOperCalc.settingText("СН-1", "1"));
    }
}
