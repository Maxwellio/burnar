package burnar.naryad.global.service;

import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

/**
 * Правила поиска скважины (Delphi {@code SkvFind}) без доступа к базе.
 * Скважина и куст ищутся с начала строки, месторождение — по вхождению.
 * Техместо входит в поиск только длиннее 4 символов. Знаки {@code %} и {@code _}
 * в тексте пользователя — обычные символы.
 */
public final class WellSearch {

    public static final String REFRESH_TOO_SHORT =
            "Для выполнения загрузки данных по скважинам из ИС \"Бурение\"\n"
                    + "необходимо в поле \"Тех. место\" указать не менее 9 символов";

    private static final String SEARCH_BODY =
            "SELECT sk.id_skv AS well_id, sk.nm_skv AS well_nm, "
                    + "lower(replace(upper(sk.nm_skv), 'СКВ.', '')) AS well_label, "
                    + "k.id_kust AS kust_id, k.nm_kust AS kust_nm, "
                    + "lower(replace(upper(k.nm_kust), 'К.', '')) AS kust_label, "
                    + "m.id_msr AS mest_id, m.nm_msr AS mest_nm, sk.techmst AS tehmesto "
                    + "FROM ( "
                    + "  SELECT s.id AS id_msr, s.nm AS nm_msr, o.znach AS znach_msr "
                    + "  FROM public.object_atribute o "
                    + "  JOIN public.common_spr s ON s.id = o.keyspr "
                    + "  WHERE s.parent_id = 5 AND o.ord = 1 "
                    + "  UNION "
                    + "  SELECT s.id, s.nm, o.znach "
                    + "  FROM public.object_atribute o "
                    + "  JOIN ( "
                    + "    WITH RECURSIVE tmp AS ( "
                    + "      SELECT c.id, c.nm, c.parent_id FROM public.common_spr c WHERE c.id = 3015 "
                    + "      UNION ALL "
                    + "      SELECT c.id, c.nm, c.parent_id FROM public.common_spr c "
                    + "      JOIN tmp ON tmp.id = c.parent_id "
                    + "    ) SELECT id, nm, parent_id FROM tmp "
                    + "  ) s ON s.id = o.keyspr "
                    + "  WHERE o.atribname = 'Key MDM' "
                    + ") m "
                    + "JOIN ( "
                    + "  SELECT s.id AS id_skv, s.nm AS nm_skv, o2.znach AS znach_kust, o3.znach AS techmst "
                    + "  FROM public.common_spr s "
                    + "  JOIN public.object_atribute o1 ON s.id = o1.keyspr AND o1.ord = 1 "
                    + "  JOIN public.object_atribute o2 ON s.id = o2.keyspr AND o2.ord = 2 "
                    + "  JOIN public.object_atribute o3 ON s.id = o3.keyspr AND o3.ord = 3 "
                    + "  WHERE s.parent_id = 149 "
                    + ") sk ON true "
                    + "LEFT JOIN ( "
                    + "  SELECT s.id AS id_kust, s.nm AS nm_kust, o1.znach AS znach_kust, o2.znach AS znach_msr "
                    + "  FROM public.common_spr s "
                    + "  JOIN public.object_atribute o1 ON s.id = o1.keyspr AND o1.ord = 1 "
                    + "  JOIN public.object_atribute o2 ON s.id = o2.keyspr AND o2.ord = 2 "
                    + "  WHERE s.parent_id = 470 "
                    + ") k ON sk.znach_kust = k.znach_kust "
                    + "WHERE k.znach_msr = m.znach_msr";

    private WellSearch() {
    }

    public static Filters filters(String skv, String mest, String kust, String tehmesto) {
        return new Filters(
                pattern(skv, true),
                pattern(mest, false),
                pattern(kust, true),
                searchableTehmesto(tehmesto) ? prefix(tehmesto) : null);
    }

    /** Длина как в Delphi: пробелы считаются, короче 9 символов процедура не вызывается. */
    public static String refreshTehmesto(String value) {
        if (value == null || value.length() < 9) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, REFRESH_TOO_SHORT);
        }
        return value;
    }

    public static String searchSql(Filters filters) {
        StringBuilder sql = new StringBuilder(SEARCH_BODY);
        if (filters.skvPrefix() != null) {
            sql.append(" AND lower(replace(upper(sk.nm_skv), 'СКВ.', '')) LIKE lower(:skv)");
        }
        if (filters.mestContains() != null) {
            sql.append(" AND upper(m.nm_msr) LIKE upper(:mest)");
        }
        if (filters.kustPrefix() != null) {
            sql.append(" AND lower(replace(upper(k.nm_kust), 'К.', '')) LIKE lower(:kust)");
        }
        if (filters.tehmestoPrefix() != null) {
            sql.append(" AND lower(sk.techmst) LIKE lower(:tehmesto)");
        }
        sql.append(" ORDER BY m.nm_msr, k.nm_kust, sk.nm_skv");
        return sql.toString();
    }

    private static boolean searchableTehmesto(String value) {
        return value != null && !value.isBlank() && value.length() > 4;
    }

    private static String pattern(String value, boolean fromStart) {
        if (value == null || value.isBlank()) {
            return null;
        }
        String literal = value.replace("\\", "\\\\").replace("%", "\\%").replace("_", "\\_");
        return fromStart ? literal + "%" : "%" + literal + "%";
    }

    private static String prefix(String value) {
        return pattern(value, true);
    }

    /** Шаблоны LIKE. {@code null} — поле в запрос не входит. */
    public record Filters(String skvPrefix, String mestContains, String kustPrefix, String tehmestoPrefix) {
    }
}
