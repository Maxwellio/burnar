package burnar.service;

import burnar.dto.ThematicCatalogNodeDto;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.jdbc.core.namedparam.MapSqlParameterSource;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;

import java.util.List;
import java.util.Set;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class ThematicCatalogServiceTest {

    @AfterEach
    void clearSecurityContext() {
        SecurityContextHolder.clearContext();
    }

    @Test
    void buildsMultipleRootsAndNestedChildrenInQueryOrder() {
        ThematicCatalogNodeDto firstRoot = node(10, 1, "Первый раздел", null);
        ThematicCatalogNodeDto nestedSection = node(11, 10, "Вложенный раздел", null);
        ThematicCatalogNodeDto operation = node(12, 11, "Операция", 77);
        ThematicCatalogNodeDto secondRoot = node(20, 1, "Второй раздел", null);

        List<ThematicCatalogNodeDto> catalog = ThematicCatalogService.buildTree(
                List.of(firstRoot, nestedSection, operation, secondRoot),
                Set.of(10, 20));

        assertEquals(List.of(10, 20), catalog.stream()
                .map(ThematicCatalogNodeDto::getId)
                .toList());
        assertEquals(List.of(11), ids(firstRoot.getChildren()));
        assertEquals(List.of(12), ids(nestedSection.getChildren()));
        assertTrue(firstRoot.isHasChildren());
        assertTrue(nestedSection.isHasChildren());
        assertFalse(operation.isHasChildren());
        assertEquals(77, operation.getOperKey());
    }

    @Test
    void returnsEmptyCatalogWithoutAuthenticatedUserBeforeDatabaseQuery() {
        ThematicCatalogService service = new ThematicCatalogService(null);

        assertTrue(service.getCatalog().isEmpty());
    }

    @Test
    void returnsEmptyCatalogForAuthenticatedUserWithEmptyAcl() {
        NamedParameterJdbcTemplate jdbc = mock(NamedParameterJdbcTemplate.class);
        when(jdbc.query(anyString(), any(MapSqlParameterSource.class), anyRowMapper()))
                .thenReturn(List.of());
        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken("catalog-user", "N/A", List.of()));

        assertTrue(new ThematicCatalogService(jdbc).getCatalog().isEmpty());

        // Логин берётся только из SecurityContext, поэтому endpoint не принимает его от клиента.
        ArgumentCaptor<MapSqlParameterSource> parameters = ArgumentCaptor.forClass(MapSqlParameterSource.class);
        verify(jdbc).query(anyString(), parameters.capture(), anyRowMapper());
        assertEquals("catalog-user", parameters.getValue().getValue("username"));
    }

    private static <T> RowMapper<T> anyRowMapper() {
        return any();
    }

    private static List<Integer> ids(List<ThematicCatalogNodeDto> nodes) {
        return nodes.stream().map(ThematicCatalogNodeDto::getId).toList();
    }

    private static ThematicCatalogNodeDto node(Integer id, Integer parentId, String name, Integer operKey) {
        ThematicCatalogNodeDto node = new ThematicCatalogNodeDto();
        node.setId(id);
        node.setParentId(parentId);
        node.setName(name);
        node.setOperKey(operKey);
        return node;
    }
}
