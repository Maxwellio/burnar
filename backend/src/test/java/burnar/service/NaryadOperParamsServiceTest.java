package burnar.service;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertTrue;

class NaryadOperParamsServiceTest {

    @Test
    void zadanieParamsSqlMatchesQrParamZ() {
        String sql = NaryadOperParamsService.ZADANIE_PARAMS_SQL;
        assertTrue(sql.contains("burnar.zadanie_param"), sql);
        assertTrue(sql.contains("burnar.zndefnarzadatrib"), sql);
        assertTrue(sql.contains("public.user_param"), sql);
        assertTrue(sql.contains("public.zn_dparam"), sql);
        assertTrue(sql.contains("public.comboperparam"), sql);
        assertTrue(sql.contains(":zadkey"), sql);
        assertTrue(sql.contains(":aoperlifeid"), sql);
    }

    @Test
    void vipolnenieParamsSqlMatchesQrParamV() {
        String sql = NaryadOperParamsService.VIPOLNENIE_PARAMS_SQL;
        assertTrue(sql.contains("burnar.vipolnenie_param"), sql);
        assertTrue(sql.contains("burnar.zndefnarvipatrib"), sql);
        assertTrue(sql.contains(":vipkey"), sql);
    }

    @Test
    void algorithmSqlMatchesQrAlgInfo() {
        String sql = NaryadOperParamsService.ALGORITHM_SQL;
        assertTrue(sql.contains("public.algs"), sql);
        assertTrue(sql.contains("public.alg_operlife"), sql);
        assertTrue(sql.contains("public.operlife"), sql);
        assertTrue(sql.contains(":oplife"), sql);
    }
}
