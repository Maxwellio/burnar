package burnar.service;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertTrue;

class NaryadPartAccessTest {

    @Test
    void zadanieDescriptorIsLockedBeforeColorUpdate() {
        String sql = NaryadPartAccess.ZADANIE_DESCRIPTOR_SQL;
        assertTrue(sql.contains("FOR UPDATE"), sql);
    }

    @Test
    void vipolnenieDescriptorIsLockedBeforeColorUpdate() {
        String sql = NaryadPartAccess.VIPOLNENIE_DESCRIPTOR_SQL;
        assertTrue(sql.contains("FOR UPDATE"), sql);
    }
}
