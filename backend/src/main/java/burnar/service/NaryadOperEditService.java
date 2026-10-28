package burnar.service;

import burnar.dto.NaryadEmptyBlockRequest;
import burnar.dto.NaryadPasteRequest;
import burnar.dto.NaryadRenameBlockRequest;
import burnar.dto.NaryadStructureNodeDto;
import org.springframework.dao.DataAccessException;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.namedparam.MapSqlParameterSource;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.sql.CallableStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Timestamp;
import java.sql.Types;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Objects;

/**
 * Удаление, снимок структуры, вставка, пустой блок и переименование.
 * Процедуры содержат COMMIT: каждый вызов со своим autocommit, как ExecProc в Delphi.
 */
@Service
public class NaryadOperEditService {

    private static final String WORK_RS_SQL =
            "(WITH vars(npi) AS ("
                    + "  VALUES (ARRAY[13555,13556,13557,13558,13559,13560,13561,13562,13563,13564,13565,13566])"
                    + ") SELECT CASE WHEN o.razdel = ANY(npi) THEN '1' ELSE '0' END FROM vars)";

    static final String ZADANIE_WORK_EXISTS_SQL =
            "SELECT o.key FROM burnar.zadanie_oper o WHERE o.narkey = :narkey AND o.key = :nodeId";

    static final String VIPOLNENIE_WORK_EXISTS_SQL =
            "SELECT o.key FROM burnar.vipolnenie_oper o WHERE o.narkey = :narkey AND o.key = :nodeId";

    static final String ZADANIE_DELETE_WORK_SQL = "CALL burnar.zadanie_operac_del(?, ?, ?, ?)";
    static final String ZADANIE_DELETE_BLOCK_SQL = "CALL burnar.zadanie_operac_del_block(?, ?, ?, ?)";
    static final String VIPOLNENIE_DELETE_WORK_SQL = "CALL burnar.vipolnenie_operac_del(?, ?, ?, ?)";
    static final String VIPOLNENIE_DELETE_BLOCK_SQL = "CALL burnar.vipolnenie_operac_del_block(?, ?, ?, ?)";

    static final String ZADANIE_STRUCTURE_SQL = structureSql(
            "burnar.zadanie_oper", "burnar.zadanie_anynm", "zad_key");
    static final String VIPOLNENIE_STRUCTURE_SQL = structureSql(
            "burnar.vipolnenie_oper", "burnar.vipolnenie_anynm", "vip_key");
    static final String ZADANIE_RENAME_SQL =
            "UPDATE burnar.zadanie_anynm a SET nm = :nm "
                    + "WHERE a.zad_key = :nodeId AND EXISTS ("
                    + "SELECT 1 FROM burnar.zadanie_oper o WHERE o.key = a.zad_key AND o.narkey = :narkey)";
    static final String VIPOLNENIE_RENAME_SQL =
            "UPDATE burnar.vipolnenie_anynm a SET nm = :nm "
                    + "WHERE a.vip_key = :nodeId AND EXISTS ("
                    + "SELECT 1 FROM burnar.vipolnenie_oper o WHERE o.key = a.vip_key AND o.narkey = :narkey)";

    private static String structureSql(String operTable, String nameTable, String nameColumn) {
        return "SELECT o.key AS id, o.parent AS parent_id, o.prnum, o.operlifetype, o.locked, "
                + WORK_RS_SQL + " AS rs, "
                + "CASE WHEN o.oper IS NOT NULL THEN "
                + "(SELECT s.nm FROM public.spr_oper s WHERE s.key = o.oper) "
                + "ELSE (SELECT a.nm FROM " + nameTable + " a WHERE a." + nameColumn + " = o.key) END AS nm, "
                + "EXISTS (SELECT 1 FROM " + operTable + " c WHERE c.parent = o.key) AS has_children "
                + "FROM " + operTable + " o WHERE o.narkey = :narkey";
    }

    private final NamedParameterJdbcTemplate jdbc;
    private final NaryadListService naryadListService;
    private final NaryadOperTreeService naryadOperTreeService;
    private final NaryadPartAccess partAccess;
    private final NaryadAutocommit autocommit;

    public NaryadOperEditService(
            NamedParameterJdbcTemplate jdbc,
            NaryadListService naryadListService,
            NaryadOperTreeService naryadOperTreeService,
            NaryadPartAccess partAccess,
            NaryadAutocommit autocommit) {
        this.jdbc = jdbc;
        this.naryadListService = naryadListService;
        this.naryadOperTreeService = naryadOperTreeService;
        this.partAccess = partAccess;
        this.autocommit = autocommit;
    }

    /** actDelSelOpers: burnar.zadanie_operac_del по выбранным, дети раньше родителей. */
    public List<Long> deleteZadanieWorks(int naryadId, List<Long> nodeIds) {
        return deleteWorks(
                naryadId,
                nodeIds,
                false,
                true,
                ZADANIE_WORK_EXISTS_SQL,
                ZADANIE_DELETE_WORK_SQL,
                false);
    }

    /** actDelSelOpers выполнения: заблокированная строка отменяет весь набор. */
    public List<Long> deleteVipolnenieWorks(int naryadId, List<Long> nodeIds) {
        return deleteWorks(
                naryadId,
                nodeIds,
                true,
                false,
                VIPOLNENIE_WORK_EXISTS_SQL,
                VIPOLNENIE_DELETE_WORK_SQL,
                true);
    }

    /** actZadanie_del_block: снять оболочку блока, вложенные работы поднять. */
    public void deleteZadanieBlock(int naryadId, long nodeId) {
        deleteBlock(naryadId, nodeId, true, ZADANIE_DELETE_BLOCK_SQL, false);
    }

    /** actVipolnenie_del_block. */
    public void deleteVipolnenieBlock(int naryadId, long nodeId) {
        deleteBlock(naryadId, nodeId, false, VIPOLNENIE_DELETE_BLOCK_SQL, true);
    }

    public List<NaryadStructureNodeDto> zadanieStructure(int naryadId) {
        return structure(naryadId, ZADANIE_STRUCTURE_SQL);
    }

    public List<NaryadStructureNodeDto> vipolnenieStructure(int naryadId) {
        return structure(naryadId, VIPOLNENIE_STRUCTURE_SQL);
    }

    /** actPasteRab: copy или move по снимку, с конца видимого порядка. */
    public void pasteZadanie(int naryadId, NaryadPasteRequest request) {
        paste(naryadId, request, false, true, ZADANIE_STRUCTURE_SQL, "burnar.zadanie_oper");
    }

    public void pasteVipolnenie(int naryadId, NaryadPasteRequest request) {
        paste(naryadId, request, true, false, VIPOLNENIE_STRUCTURE_SQL, "burnar.vipolnenie_oper");
    }

    /** act*_add_emptyblock: сосед перед выбранной строкой. */
    public void addZadanieEmptyBlock(int naryadId, NaryadEmptyBlockRequest request) {
        addEmptyBlock(naryadId, request, false, true, ZADANIE_STRUCTURE_SQL, "burnar.zadanie_oper");
    }

    public void addVipolnenieEmptyBlock(int naryadId, NaryadEmptyBlockRequest request) {
        addEmptyBlock(naryadId, request, true, false, VIPOLNENIE_STRUCTURE_SQL, "burnar.vipolnenie_oper");
    }

    public void renameZadanieBlock(int naryadId, long nodeId, NaryadRenameBlockRequest request) {
        renameBlock(naryadId, nodeId, request, true, ZADANIE_STRUCTURE_SQL, ZADANIE_RENAME_SQL);
    }

    public void renameVipolnenieBlock(int naryadId, long nodeId, NaryadRenameBlockRequest request) {
        renameBlock(naryadId, nodeId, request, false, VIPOLNENIE_STRUCTURE_SQL, VIPOLNENIE_RENAME_SQL);
    }

    private List<Long> deleteWorks(
            int naryadId,
            List<Long> nodeIds,
            boolean refuseLocked,
            boolean zadanie,
            String existsSql,
            String procedureSql,
            boolean bigintKeys) {
        naryadListService.findHeader(naryadId);
        if (partAccess.readClosed(zadanie, naryadId)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Naryad part is closed");
        }
        List<Long> ids = NaryadOperFormat.requireNodeIds(nodeIds);
        List<NaryadWorkDeletion.Node> nodes = naryadOperTreeService.loadWorkNodes(!zadanie, naryadId, ids);
        if (nodes.size() != ids.size()) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Naryad row not found");
        }
        return NaryadWorkDeletion.deleteMarked(
                nodes,
                refuseLocked,
                id -> workExists(existsSql, naryadId, id),
                node -> callDeleteProcedure(procedureSql, node, naryadId, bigintKeys));
    }

    private void deleteBlock(
            int naryadId,
            long nodeId,
            boolean zadanie,
            String procedureSql,
            boolean bigintKeys) {
        naryadListService.findHeader(naryadId);
        if (partAccess.readClosed(zadanie, naryadId)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Naryad part is closed");
        }
        List<NaryadWorkDeletion.Node> nodes = naryadOperTreeService.loadWorkNodes(!zadanie, naryadId, List.of(nodeId));
        if (nodes.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Naryad row not found");
        }
        NaryadWorkDeletion.Node node = nodes.get(0);
        String refusal = NaryadWorkDeletion.blockDeleteRefusal(node);
        if (refusal != null) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, refusal);
        }
        try {
            callDeleteProcedure(procedureSql, node, naryadId, bigintKeys);
        } catch (DataAccessException ex) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, NaryadProcedureMessages.from(ex));
        }
    }

    private List<NaryadStructureNodeDto> structure(int naryadId, String sql) {
        naryadListService.findHeader(naryadId);
        return jdbc.query(sql, new MapSqlParameterSource("narkey", naryadId), (rs, rowNum) -> {
            NaryadStructureNodeDto dto = new NaryadStructureNodeDto();
            dto.setId(getLong(rs, "id"));
            dto.setParentId(getLong(rs, "parent_id"));
            dto.setPrnum(rs.getBigDecimal("prnum"));
            dto.setOperlifetype(getInteger(rs, "operlifetype"));
            dto.setLocked(getInteger(rs, "locked"));
            dto.setRs(rs.getString("rs"));
            dto.setNm(rs.getString("nm"));
            dto.setHasChildren(rs.getBoolean("has_children"));
            return dto;
        });
    }

    private void paste(
            int naryadId,
            NaryadPasteRequest request,
            boolean vip,
            boolean zadanie,
            String structureSql,
            String operTable) {
        naryadListService.findHeader(naryadId);
        if (partAccess.readClosed(zadanie, naryadId)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Naryad part is closed");
        }
        if (request == null || request.getTargetId() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "targetId is required");
        }
        boolean copy = "copy".equals(request.getMode());
        boolean cut = "cut".equals(request.getMode());
        if (!copy && !cut) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "mode is required");
        }
        List<Long> ids = NaryadOperFormat.requireNodeIds(request.getNodeIds());
        List<NaryadClipboard.Node> tree = loadClipboardTree(structureSql, naryadId);
        List<NaryadClipboard.Node> sequence = NaryadClipboard.pasteSequence(tree, ids);
        if (cut) {
            NaryadClipboard.requireCutAllowed(sequence, vip);
        }
        NaryadClipboard.Node target = findClipboardNode(tree, request.getTargetId());
        if (target == null) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Naryad row not found");
        }
        String place = request.getPlace();
        NaryadClipboard.Slot slot = NaryadClipboard.pasteSlot(target, place);
        boolean allSameLevel = cut
                && !"inside".equals(place)
                && sequence.stream().allMatch(node -> Objects.equals(node.parentId, slot.parentId));
        List<NaryadClipboard.Node> apply = new ArrayList<>(sequence);
        if (allSameLevel && "before".equals(place)) {
            Collections.reverse(apply);
        }
        for (NaryadClipboard.Node source : apply) {
            FreshOper fresh = loadFreshOper(operTable, naryadId, source.id);
            if (fresh == null) {
                continue;
            }
            boolean sameLevel = !copy
                    && !"inside".equals(place)
                    && Objects.equals(fresh.parentId, slot.parentId);
            BigDecimal prnum = slot.prnum;
            if (sameLevel) {
                FreshOper liveTarget = loadFreshOper(operTable, naryadId, target.id);
                BigDecimal livePrnum = liveTarget == null ? target.prnum : liveTarget.prnum;
                prnum = NaryadClipboard.sameLevelMovePrnum(fresh.prnum, livePrnum, place);
            }
            if (copy) {
                callCopy(vip, source.id, fresh.parentId, slot.parentId, prnum, naryadId);
            } else {
                callMove(vip, source.id, fresh.parentId, fresh.prnum, slot.parentId, prnum, naryadId);
            }
        }
    }

    private void addEmptyBlock(
            int naryadId,
            NaryadEmptyBlockRequest request,
            boolean vip,
            boolean zadanie,
            String structureSql,
            String operTable) {
        naryadListService.findHeader(naryadId);
        if (partAccess.readClosed(zadanie, naryadId)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Naryad part is closed");
        }
        if (request == null || request.getBeforeNodeId() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "beforeNodeId is required");
        }
        List<NaryadClipboard.Node> tree = loadClipboardTree(structureSql, naryadId);
        NaryadClipboard.Node before = findClipboardNode(tree, request.getBeforeNodeId());
        NaryadClipboard.requireEmptyBlock(before, request.getName(), vip);
        BigDecimal prnum = NaryadClipboard.emptyBlockPrnum(before, request.getPlace());
        Timestamp date = loadBegoperdate(operTable, naryadId, before.id);
        callEmptyBlock(vip, naryadId, date, before.parentId, prnum, request.getName());
    }

    private void renameBlock(
            int naryadId,
            long nodeId,
            NaryadRenameBlockRequest request,
            boolean zadanie,
            String structureSql,
            String updateSql) {
        naryadListService.findHeader(naryadId);
        if (partAccess.readClosed(zadanie, naryadId)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Naryad part is closed");
        }
        String name = request == null ? null : request.getName();
        List<NaryadClipboard.Node> tree = loadClipboardTree(structureSql, naryadId);
        NaryadClipboard.Node node = findClipboardNode(tree, nodeId);
        if (node == null) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Naryad row not found");
        }
        String refusal = NaryadClipboard.renameRefusal(node, name);
        if (refusal != null) {
            HttpStatus status = NaryadClipboard.NAME_REQUIRED.equals(refusal)
                    || NaryadClipboard.NAME_TOO_LONG.equals(refusal)
                    ? HttpStatus.BAD_REQUEST
                    : HttpStatus.CONFLICT;
            throw new ResponseStatusException(status, refusal);
        }
        int updated = jdbc.update(
                updateSql,
                new MapSqlParameterSource("narkey", naryadId)
                        .addValue("nodeId", nodeId)
                        .addValue("nm", name));
        if (updated == 0) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Naryad row not found");
        }
    }

    private List<NaryadClipboard.Node> loadClipboardTree(String sql, int naryadId) {
        return jdbc.query(
                sql,
                new MapSqlParameterSource("narkey", naryadId),
                (rs, rowNum) -> new NaryadClipboard.Node(
                        rs.getLong("id"),
                        getLong(rs, "parent_id"),
                        rs.getBigDecimal("prnum"),
                        getInteger(rs, "operlifetype"),
                        getInteger(rs, "locked"),
                        rs.getString("rs"),
                        rs.getBoolean("has_children")));
    }

    private static NaryadClipboard.Node findClipboardNode(List<NaryadClipboard.Node> tree, long id) {
        for (NaryadClipboard.Node node : tree) {
            if (node.id == id) {
                return node;
            }
        }
        return null;
    }

    private FreshOper loadFreshOper(String operTable, int naryadId, long nodeId) {
        List<FreshOper> rows = jdbc.query(
                "SELECT o.parent AS parent_id, o.prnum FROM " + operTable
                        + " o WHERE o.narkey = :narkey AND o.key = :nodeId",
                new MapSqlParameterSource("narkey", naryadId).addValue("nodeId", nodeId),
                (rs, rowNum) -> new FreshOper(getLong(rs, "parent_id"), rs.getBigDecimal("prnum")));
        return rows.isEmpty() ? null : rows.get(0);
    }

    private Timestamp loadBegoperdate(String operTable, int naryadId, long nodeId) {
        List<Timestamp> rows = jdbc.query(
                "SELECT o.begoperdate FROM " + operTable + " o WHERE o.narkey = :narkey AND o.key = :nodeId",
                new MapSqlParameterSource("narkey", naryadId).addValue("nodeId", nodeId),
                (rs, rowNum) -> rs.getTimestamp("begoperdate"));
        return rows.isEmpty() ? null : rows.get(0);
    }

    private void callCopy(
            boolean vip, long key, Long parent, Long destParent, BigDecimal destPrnum, int naryadId) {
        String sql = vip
                ? "CALL burnar.vipolnenie_operac_copy(?, ?, ?, ?, ?)"
                : "CALL burnar.zadanie_operac_copy(?, ?, ?, ?, ?)";
        autocommit.runMapped(con -> {
            try (CallableStatement cs = con.prepareCall(sql)) {
                NaryadAutocommit.bindWorkKey(cs, 1, key, vip);
                NaryadAutocommit.bindNullableKey(cs, 2, parent, vip);
                NaryadAutocommit.bindNullableKey(cs, 3, destParent, vip);
                NaryadAutocommit.bindPrnum(cs, 4, destPrnum);
                cs.setInt(5, naryadId);
                cs.execute();
            }
        });
    }

    private void callMove(
            boolean vip,
            long key,
            Long parent,
            BigDecimal prnum,
            Long destParent,
            BigDecimal destPrnum,
            int naryadId) {
        String sql = vip
                ? "CALL burnar.vipolnenie_operac_move(?, ?, ?, ?, ?, ?)"
                : "CALL burnar.zadanie_operac_move(?, ?, ?, ?, ?, ?)";
        autocommit.runMapped(con -> {
            try (CallableStatement cs = con.prepareCall(sql)) {
                NaryadAutocommit.bindWorkKey(cs, 1, key, vip);
                NaryadAutocommit.bindNullableKey(cs, 2, parent, vip);
                NaryadAutocommit.bindPrnum(cs, 3, prnum);
                NaryadAutocommit.bindNullableKey(cs, 4, destParent, vip);
                NaryadAutocommit.bindPrnum(cs, 5, destPrnum);
                cs.setInt(6, naryadId);
                cs.execute();
            }
        });
    }

    private void callEmptyBlock(
            boolean vip, int naryadId, Timestamp date, long parentId, BigDecimal prnum, String name) {
        String sql = vip
                ? "CALL burnar.vipolnenie_add_emptyblock(?, ?, ?, ?, ?, ?)"
                : "CALL burnar.zadanie_add_emptyblock(?, ?, ?, ?, ?, ?)";
        autocommit.runMapped(con -> {
            try (CallableStatement cs = con.prepareCall(sql)) {
                cs.setInt(1, naryadId);
                if (date == null) {
                    cs.setNull(2, Types.TIMESTAMP);
                } else {
                    cs.setTimestamp(2, date);
                }
                NaryadAutocommit.bindWorkKey(cs, 3, parentId, vip);
                NaryadAutocommit.bindPrnum(cs, 4, prnum);
                cs.setString(5, name);
                cs.setNull(6, Types.INTEGER);
                cs.execute();
            }
        });
    }

    /**
     * Каждый вызов со своим autocommit: успешные удаления остаются, как ExecProc в Delphi.
     * Ошибку не прячем — её разбирает цикл удаления или deleteBlock.
     */
    private void callDeleteProcedure(
            String sql, NaryadWorkDeletion.Node node, int naryadId, boolean bigintKeys) {
        autocommit.run(con -> {
            try (CallableStatement cs = con.prepareCall(sql)) {
                NaryadAutocommit.bindWorkKey(cs, 1, node.id, bigintKeys);
                if (node.parentId == null) {
                    cs.setNull(2, bigintKeys ? Types.BIGINT : Types.INTEGER);
                } else {
                    NaryadAutocommit.bindWorkKey(cs, 2, node.parentId, bigintKeys);
                }
                if (node.prnum == null) {
                    cs.setNull(3, Types.NUMERIC);
                } else {
                    cs.setBigDecimal(3, node.prnum);
                }
                cs.setInt(4, naryadId);
                cs.execute();
            }
        });
    }

    private boolean workExists(String sql, int naryadId, long nodeId) {
        List<Long> found = jdbc.query(
                sql,
                new MapSqlParameterSource("narkey", naryadId).addValue("nodeId", nodeId),
                (rs, rowNum) -> rs.getLong("key"));
        return !found.isEmpty();
    }

    private static Integer getInteger(ResultSet rs, String column) throws SQLException {
        int value = rs.getInt(column);
        return rs.wasNull() ? null : value;
    }

    private static Long getLong(ResultSet rs, String column) throws SQLException {
        long value = rs.getLong(column);
        return rs.wasNull() ? null : value;
    }

    private static final class FreshOper {
        final Long parentId;
        final BigDecimal prnum;

        FreshOper(Long parentId, BigDecimal prnum) {
            this.parentId = parentId;
            this.prnum = prnum;
        }
    }
}
