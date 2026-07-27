package burnar.config;

import org.junit.jupiter.api.Test;

import java.util.List;
import java.util.Locale;
import java.util.Set;
import java.util.stream.Collectors;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

/**
 * Проверка списка админ-логинов (логика UserDetailsServiceImpl / OrgAccessService).
 */
class BurnarPropertiesAdminTest {

    @Test
    void adminUsersMatchIgnoreCase() {
        BurnarProperties props = new BurnarProperties();
        props.setAdminUsers(List.of("burnar_role", "ievc", "burnar_web"));
        Set<String> lower = props.getAdminUsers().stream()
                .map(s -> s.toLowerCase(Locale.ROOT))
                .collect(Collectors.toSet());

        assertTrue(lower.contains("burnar_web"));
        assertTrue(lower.contains("Burnar_Web".toLowerCase(Locale.ROOT)));
        assertTrue(lower.contains("ievc"));
        assertFalse(lower.contains("other_user"));
    }

    @Test
    void defaultOrgFilterIdsMatchDelphiLoadCbx() {
        BurnarProperties props = new BurnarProperties();
        assertTrue(props.getOrgFilterIds().containsAll(List.of(4, 5, 6, 7, 8)));
    }
}
