package burnar.service;

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

import java.util.List;
import java.util.Locale;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/**
 * Удаление sprdoljnost: карьеры (включая закрытые) и brigades блокируют;
 * сироты doljtostruct снимаются, если должность больше ни у кого не стоит.
 */
@ExtendWith(MockitoExtension.class)
class PositionAdminServiceDeleteTest {

    @Mock
    private NamedParameterJdbcTemplate jdbc;

    private PositionAdminService service;

    @BeforeEach
    void setUp() {
        service = new PositionAdminService(jdbc);
    }

    private void stubCounts(long positions, long careers, long workers) {
        when(jdbc.queryForObject(anyString(), any(SqlParameterSource.class), eq(Long.class)))
                .thenAnswer(inv -> {
                    String sql = inv.<String>getArgument(0);
                    if (sql.contains("sprdoljnost")) {
                        return positions;
                    }
                    if (sql.contains("karjera")) {
                        return careers;
                    }
                    if (sql.contains("spr_workers")) {
                        return workers;
                    }
                    throw new IllegalArgumentException("unexpected sql: " + sql);
                });
    }

    @Test
    void missingPositionIsNotFound() {
        stubCounts(0, 0, 0);

        ResponseStatusException ex = assertThrows(
                ResponseStatusException.class, () -> service.deletePosition(7));

        assertEquals(HttpStatus.NOT_FOUND, ex.getStatus());
        verify(jdbc, never()).update(anyString(), any(SqlParameterSource.class));
    }

    @Test
    void anyCareerIncludingHistoricalBlocksDelete() {
        stubCounts(1, 2, 0);

        ResponseStatusException ex = assertThrows(
                ResponseStatusException.class, () -> service.deletePosition(7));

        assertEquals(HttpStatus.CONFLICT, ex.getStatus());
        assertTrue(ex.getReason().contains("карьере"));
        verify(jdbc, never()).update(anyString(), any(SqlParameterSource.class));
    }

    @Test
    void careerCheckDoesNotFilterByDates() {
        when(jdbc.queryForObject(anyString(), any(SqlParameterSource.class), eq(Long.class)))
                .thenAnswer(inv -> {
                    String sql = inv.<String>getArgument(0).toLowerCase(Locale.ROOT);
                    if (sql.contains("sprdoljnost")) {
                        return 1L;
                    }
                    if (sql.contains("karjera")) {
                        assertFalse(sql.contains("dtout"), sql);
                        assertFalse(sql.contains("dtenter"), sql);
                        return 1L;
                    }
                    return 0L;
                });

        ResponseStatusException ex = assertThrows(
                ResponseStatusException.class, () -> service.deletePosition(7));

        assertEquals(HttpStatus.CONFLICT, ex.getStatus());
    }

    @Test
    void brigadeBossBlocksDelete() {
        stubCounts(1, 0, 1);

        ResponseStatusException ex = assertThrows(
                ResponseStatusException.class, () -> service.deletePosition(7));

        assertEquals(HttpStatus.CONFLICT, ex.getStatus());
        assertTrue(ex.getReason().contains("бригад"));
        verify(jdbc, never()).update(anyString(), any(SqlParameterSource.class));
    }

    @Test
    void unusedOrphansAreRemovedThenPositionDeleted() {
        stubCounts(1, 0, 0);
        when(jdbc.update(anyString(), any(SqlParameterSource.class))).thenReturn(1);

        service.deletePosition(7);

        ArgumentCaptor<String> sqls = ArgumentCaptor.forClass(String.class);
        verify(jdbc, times(3)).update(sqls.capture(), any(SqlParameterSource.class));
        List<String> executed = sqls.getAllValues();
        assertTrue(executed.get(0).contains("SET boss = NULL"), executed.get(0));
        assertTrue(executed.get(1).contains("DELETE FROM burnar.doljtostruct"), executed.get(1));
        assertTrue(executed.get(2).contains("DELETE FROM burnar.sprdoljnost"), executed.get(2));
    }
}
