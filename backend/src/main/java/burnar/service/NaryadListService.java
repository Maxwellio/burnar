package burnar.service;

import burnar.dto.NaryadListDto;
import burnar.dto.NaryadListFilter;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.jdbc.core.namedparam.MapSqlParameterSource;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import java.util.List;

/**
 * Список нарядов бурения (nartype = 1) — SQL как в Delphi NarListUnit.BitBtn2Click,
 * без ACL по оргструктуре.
 * Параметры скв/куст/мест: znparams parcode 149 / 470 / 5.
 * Фильтры колонок BaseTable — см. appendFilters; составные: zadClose→dfz.begdate, vipClose→getallpervip.
 */
@Service
public class NaryadListService {

    /** Путь бригады по org — тот же CTE, что в SELECT owner_nar; нужен и для фильтра ownerNar. */
    private static final String OWNER_PATH_SQL =
            "(WITH RECURSIVE tmp(id, parent, nm, path, level) AS ( "
                    + "   SELECT o.id, o.parent, o.nm, CAST(o.nm AS varchar(100)), 1 "
                    + "   FROM burnar.org_stru o WHERE o.parent = 0 "
                    + "   UNION ALL "
                    + "   SELECT o2.id, o2.parent, o2.nm, "
                    + "          CAST(tmp.path || ', ' || o2.nm AS varchar(100)), level + 1 "
                    + "   FROM burnar.org_stru o2 "
                    + "   INNER JOIN tmp ON tmp.id = o2.parent "
                    + ") SELECT tmp.path FROM tmp WHERE tmp.id = s.org)";

    /** Значение znparams (скв/куст/мест) — совпадает с SELECT; :parcode подставляется в фильтре. */
    private static final String ZNPARAM_VALUE_SQL =
            "(SELECT CASE WHEN z.znval IS NULL THEN "
                    + "          CASE WHEN z.val IS NULL THEN z.valstr ELSE z.val::varchar END "
                    + "        ELSE (SELECT c.nm FROM public.common_spr c WHERE c.id = z.znval) END "
                    + " FROM burnar.znparams z WHERE z.defnar = d.key AND z.parcode = %d)";

    /**
     * Общий FROM/JOIN для COUNT и LIST — иначе фильтры по датам/бригаде/автору не совпадут с выборкой.
     */
    private static final String FROM_SQL =
            "FROM burnar.defnar d "
                    + "LEFT JOIN burnar.defnarvip dfp ON d.key = dfp.narkey "
                    + "LEFT JOIN burnar.defnarzad dfz ON d.key = dfz.narkey "
                    + "INNER JOIN burnar.spr_workers s ON d.ownernar = s.key "
                    + "INNER JOIN burnar.users u ON d.narauthor = u.users_id ";

    private static final String SELECT_SQL =
            "SELECT "
                    + "  d.key AS id, "
                    + "  d.key AS cod_nar, "
                    + "  d.nm AS name_nar, "
                    + "  " + OWNER_PATH_SQL + " AS owner_nar, "
                    + "  burnar.getmasters(d.key) AS master_nar, "
                    + "  CASE "
                    + "    WHEN (SELECT z.closed FROM burnar.defnarzad z WHERE d.key = z.narkey) = 1 THEN '1' "
                    + "    WHEN (SELECT z.closed FROM burnar.defnarzad z WHERE d.key = z.narkey) = 0 THEN '0' "
                    + "    ELSE NULL END AS zad_close, "
                    + "  CASE "
                    + "    WHEN (SELECT z.closed FROM burnar.defnarvip z WHERE d.key = z.narkey) = 1 THEN '1' "
                    + "    WHEN (SELECT z.closed FROM burnar.defnarvip z WHERE d.key = z.narkey) = 0 THEN '0' "
                    + "    ELSE NULL END AS vip_close, "
                    + "  to_char(dfp.begdate, 'dd.mm.yyyy') AS vip_beg_date, "
                    + "  burnar.getallpervip(d.key) AS per_vip, "
                    + "  to_char(dfz.begdate, 'dd.mm.yyyy') AS beg_date, "
                    + "  " + String.format(ZNPARAM_VALUE_SQL, 149) + " AS skv, "
                    + "  " + String.format(ZNPARAM_VALUE_SQL, 470) + " AS kust, "
                    + "  " + String.format(ZNPARAM_VALUE_SQL, 5) + " AS mest, "
                    + "  to_char(d.createdate, 'dd.mm.yyyy') AS date_create, "
                    + "  u.ora_name AS autor_nar ";

    private static final RowMapper<NaryadListDto> ROW_MAPPER = (rs, rowNum) -> {
        NaryadListDto dto = new NaryadListDto();
        dto.setId(rs.getInt("id"));
        dto.setCodNar(rs.getInt("cod_nar"));
        dto.setNameNar(rs.getString("name_nar"));
        dto.setOwnerNar(rs.getString("owner_nar"));
        dto.setMasterNar(rs.getString("master_nar"));
        dto.setZadClose(rs.getString("zad_close"));
        dto.setVipClose(rs.getString("vip_close"));
        dto.setVipBegDate(rs.getString("vip_beg_date"));
        dto.setPerVip(rs.getString("per_vip"));
        dto.setBegDate(rs.getString("beg_date"));
        dto.setSkv(rs.getString("skv"));
        dto.setKust(rs.getString("kust"));
        dto.setMest(rs.getString("mest"));
        dto.setDateCreate(rs.getString("date_create"));
        dto.setAutorNar(rs.getString("autor_nar"));
        return dto;
    };

    private final NamedParameterJdbcTemplate jdbc;

    public NaryadListService(NamedParameterJdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    public Page<NaryadListDto> findDrillingOrders(Pageable pageable, NaryadListFilter filter) {
        MapSqlParameterSource params = new MapSqlParameterSource();
        String where = buildWhere(filter, params);

        String countSql = "SELECT COUNT(*) " + FROM_SQL + where;
        Long total = jdbc.queryForObject(countSql, params, Long.class);
        if (total == null) {
            total = 0L;
        }

        params.addValue("limit", pageable.getPageSize());
        params.addValue("offset", pageable.getOffset());

        String listSql = SELECT_SQL + FROM_SQL + where
                + "ORDER BY d.key DESC "
                + "LIMIT :limit OFFSET :offset";
        List<NaryadListDto> content = jdbc.query(listSql, params, ROW_MAPPER);
        return new PageImpl<>(content, pageable, total);
    }

    /**
     * Базовый WHERE + динамические условия фильтров колонок.
     * Тексты — ILIKE %value%; даты с фронта (YYYY-MM-DDTHH:mm:ss) сравниваются по ::date.
     */
    private String buildWhere(NaryadListFilter filter, MapSqlParameterSource params) {
        StringBuilder where = new StringBuilder("WHERE d.nartype = 1 ");
        if (filter == null) {
            return where.toString();
        }

        appendTextFilter(where, params, "codNar", filter.getCodNar(),
                "CAST(d.key AS varchar) ILIKE CONCAT('%', :codNar, '%')");
        appendTextFilter(where, params, "nameNar", filter.getNameNar(),
                "d.nm ILIKE CONCAT('%', :nameNar, '%')");
        appendTextFilter(where, params, "ownerNar", filter.getOwnerNar(),
                OWNER_PATH_SQL + " ILIKE CONCAT('%', :ownerNar, '%')");
        appendTextFilter(where, params, "masterNar", filter.getMasterNar(),
                "burnar.getmasters(d.key) ILIKE CONCAT('%', :masterNar, '%')");
        appendDateFilter(where, params, "zadClose", filter.getZadClose(),
                "dfz.begdate::date = CAST(:zadClose AS timestamp)::date");
        appendTextFilter(where, params, "vipClose", filter.getVipClose(),
                "burnar.getallpervip(d.key) ILIKE CONCAT('%', :vipClose, '%')");
        appendDateFilter(where, params, "vipBegDate", filter.getVipBegDate(),
                "dfp.begdate::date = CAST(:vipBegDate AS timestamp)::date");
        appendTextFilter(where, params, "skv", filter.getSkv(),
                String.format(ZNPARAM_VALUE_SQL, 149) + " ILIKE CONCAT('%', :skv, '%')");
        appendTextFilter(where, params, "kust", filter.getKust(),
                String.format(ZNPARAM_VALUE_SQL, 470) + " ILIKE CONCAT('%', :kust, '%')");
        appendTextFilter(where, params, "mest", filter.getMest(),
                String.format(ZNPARAM_VALUE_SQL, 5) + " ILIKE CONCAT('%', :mest, '%')");
        appendDateFilter(where, params, "dateCreate", filter.getDateCreate(),
                "d.createdate::date = CAST(:dateCreate AS timestamp)::date");
        appendTextFilter(where, params, "autorNar", filter.getAutorNar(),
                "u.ora_name ILIKE CONCAT('%', :autorNar, '%')");

        return where.toString();
    }

    private void appendTextFilter(
            StringBuilder where,
            MapSqlParameterSource params,
            String paramName,
            String value,
            String condition) {
        if (!StringUtils.hasText(value)) {
            return;
        }
        params.addValue(paramName, value.trim());
        where.append("AND ").append(condition).append(' ');
    }

    private void appendDateFilter(
            StringBuilder where,
            MapSqlParameterSource params,
            String paramName,
            String value,
            String condition) {
        if (!StringUtils.hasText(value)) {
            return;
        }
        params.addValue(paramName, value.trim());
        where.append("AND ").append(condition).append(' ');
    }
}
