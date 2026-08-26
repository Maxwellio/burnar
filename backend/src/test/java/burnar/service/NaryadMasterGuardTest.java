package burnar.service;

import burnar.dto.DeleteBlockDto;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.jdbc.core.namedparam.SqlParameterSource;
import org.springframework.web.server.ResponseStatusException;

import java.util.Locale;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/**
 * Проверка «мастер в наряде»: SQL как у getmasters, без nartype и без отсечения closed.
 */
@ExtendWith(MockitoExtension.class)
class NaryadMasterGuardTest {

    @Mock
    private NamedParameterJdbcTemplate jdbc;

    private NaryadMasterGuard guard;

    @BeforeEach
    void setUp() {
        guard = new NaryadMasterGuard(jdbc);
    }

    @Test
    void personBlockUsesGetmastersJoinAndKeepsClosedNaryads() {
        when(jdbc.queryForObject(any(String.class), any(SqlParameterSource.class), eq(Long.class)))
                .thenReturn(1L);

        DeleteBlockDto dto = guard.personDeleteBlock(42);

        assertTrue(dto.isBlocked());
        assertEquals(NaryadMasterGuard.PERSON_BLOCK_MESSAGE, dto.getMessage());

        String sql = captureSql().toLowerCase(Locale.ROOT);
        assertTrue(sql.contains("defnar"), sql);
        assertTrue(sql.contains("spr_workers"), sql);
        assertTrue(sql.contains("karjera"), sql);
        assertTrue(sql.contains("doljtostruct"), sql);
        assertTrue(sql.contains("dtenter"), sql);
        assertTrue(sql.contains("dtout"), sql);
        assertTrue(sql.contains("createdate"), sql);
        assertTrue(sql.contains("boss"), sql);
        assertFalse(sql.contains("nartype"), sql);
        assertFalse(sql.contains("closed"), sql);
        assertFalse(sql.contains("k.key = :careerkey"), sql);
    }

    @Test
    void careerBlockFiltersByCareerKey() {
        when(jdbc.queryForObject(any(String.class), any(SqlParameterSource.class), eq(Long.class)))
                .thenReturn(1L);

        DeleteBlockDto dto = guard.careerDeleteBlock(42, 9);

        assertTrue(dto.isBlocked());
        assertEquals(NaryadMasterGuard.CAREER_BLOCK_MESSAGE, dto.getMessage());

        String sql = captureSql();
        assertTrue(sql.contains("k.key = :careerKey"), sql);
        assertFalse(sql.toLowerCase(Locale.ROOT).contains("nartype"), sql);
        assertFalse(sql.toLowerCase(Locale.ROOT).contains("closed"), sql);
    }

    @Test
    void allowedWhenNotListedAsMaster() {
        when(jdbc.queryForObject(any(String.class), any(SqlParameterSource.class), eq(Long.class)))
                .thenReturn(0L);

        DeleteBlockDto dto = guard.personDeleteBlock(1);

        assertFalse(dto.isBlocked());
        assertNull(dto.getMessage());
    }

    @Test
    void rejectPersonThrowsConflict() {
        when(jdbc.queryForObject(any(String.class), any(SqlParameterSource.class), eq(Long.class)))
                .thenReturn(1L);

        ResponseStatusException ex = assertThrows(
                ResponseStatusException.class, () -> guard.rejectIfPersonIsMaster(7));

        assertEquals(HttpStatus.CONFLICT, ex.getStatus());
        assertEquals(NaryadMasterGuard.PERSON_BLOCK_MESSAGE, ex.getReason());
    }

    @Test
    void rejectCareerThrowsConflict() {
        when(jdbc.queryForObject(any(String.class), any(SqlParameterSource.class), eq(Long.class)))
                .thenReturn(1L);

        ResponseStatusException ex = assertThrows(
                ResponseStatusException.class, () -> guard.rejectIfCareerHoldsMaster(7, 3));

        assertEquals(HttpStatus.CONFLICT, ex.getStatus());
        assertEquals(NaryadMasterGuard.CAREER_BLOCK_MESSAGE, ex.getReason());
    }

    @Test
    void rejectPersonDoesNothingWhenNotMaster() {
        when(jdbc.queryForObject(any(String.class), any(SqlParameterSource.class), eq(Long.class)))
                .thenReturn(0L);

        guard.rejectIfPersonIsMaster(7);
        guard.rejectIfCareerHoldsMaster(7, 3);
    }

    private String captureSql() {
        ArgumentCaptor<String> sql = ArgumentCaptor.forClass(String.class);
        verify(jdbc).queryForObject(sql.capture(), any(SqlParameterSource.class), eq(Long.class));
        return sql.getValue();
    }
}
