package burnar.service;

import burnar.dto.NaryadListDto;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.jdbc.core.namedparam.MapSqlParameterSource;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.stereotype.Service;

import java.util.List;

/**
 * Список нарядов бурения (nartype = 1) — SQL как в Delphi NarListUnit.BitBtn2Click,
 * без ACL по оргструктуре и без отбора по датам (добавим позже).
 * Параметры скв/куст/мест: znparams parcode 149 / 470 / 5.
 */
@Service
public class NaryadListService {

    private static final String COUNT_SQL =
            "SELECT COUNT(*) FROM burnar.defnar d WHERE d.nartype = 1";

    /**
     * Ядро выборки из Delphi: defnar + задание/выполнение + путь бригады + getmasters /
     * getallpervip + znparams. Без join vipolnenie_period (дубли строк) и без ACL.
     */
    private static final String LIST_SQL =
            "SELECT "
                    + "  d.key AS id, "
                    + "  d.key AS cod_nar, "
                    + "  d.nm AS name_nar, "
                    + "  (WITH RECURSIVE tmp(id, parent, nm, path, level) AS ( "
                    + "     SELECT o.id, o.parent, o.nm, CAST(o.nm AS varchar(100)), 1 "
                    + "     FROM burnar.org_stru o WHERE o.parent = 0 "
                    + "     UNION ALL "
                    + "     SELECT o2.id, o2.parent, o2.nm, "
                    + "            CAST(tmp.path || ', ' || o2.nm AS varchar(100)), level + 1 "
                    + "     FROM burnar.org_stru o2 "
                    + "     INNER JOIN tmp ON tmp.id = o2.parent "
                    + "  ) SELECT tmp.path FROM tmp WHERE tmp.id = s.org) AS owner_nar, "
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
                    + "  (SELECT CASE WHEN z.znval IS NULL THEN "
                    + "            CASE WHEN z.val IS NULL THEN z.valstr ELSE z.val::varchar END "
                    + "          ELSE (SELECT c.nm FROM public.common_spr c WHERE c.id = z.znval) END "
                    + "   FROM burnar.znparams z WHERE z.defnar = d.key AND z.parcode = 149) AS skv, "
                    + "  (SELECT CASE WHEN z.znval IS NULL THEN "
                    + "            CASE WHEN z.val IS NULL THEN z.valstr ELSE z.val::varchar END "
                    + "          ELSE (SELECT c.nm FROM public.common_spr c WHERE c.id = z.znval) END "
                    + "   FROM burnar.znparams z WHERE z.defnar = d.key AND z.parcode = 470) AS kust, "
                    + "  (SELECT CASE WHEN z.znval IS NULL THEN "
                    + "            CASE WHEN z.val IS NULL THEN z.valstr ELSE z.val::varchar END "
                    + "          ELSE (SELECT c.nm FROM public.common_spr c WHERE c.id = z.znval) END "
                    + "   FROM burnar.znparams z WHERE z.defnar = d.key AND z.parcode = 5) AS mest, "
                    + "  to_char(d.createdate, 'dd.mm.yyyy') AS date_create, "
                    + "  u.ora_name AS autor_nar "
                    + "FROM burnar.defnar d "
                    + "LEFT JOIN burnar.defnarvip dfp ON d.key = dfp.narkey "
                    + "LEFT JOIN burnar.defnarzad dfz ON d.key = dfz.narkey "
                    + "INNER JOIN burnar.spr_workers s ON d.ownernar = s.key "
                    + "INNER JOIN burnar.users u ON d.narauthor = u.users_id "
                    + "WHERE d.nartype = 1 "
                    + "ORDER BY d.key DESC "
                    + "LIMIT :limit OFFSET :offset";

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

    public Page<NaryadListDto> findDrillingOrders(Pageable pageable) {
        Long total = jdbc.queryForObject(COUNT_SQL, new MapSqlParameterSource(), Long.class);
        if (total == null) {
            total = 0L;
        }

        MapSqlParameterSource params = new MapSqlParameterSource()
                .addValue("limit", pageable.getPageSize())
                .addValue("offset", pageable.getOffset());

        List<NaryadListDto> content = jdbc.query(LIST_SQL, params, ROW_MAPPER);
        return new PageImpl<>(content, pageable, total);
    }
}
