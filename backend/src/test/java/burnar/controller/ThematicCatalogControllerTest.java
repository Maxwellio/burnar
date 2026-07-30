package burnar.controller;

import burnar.service.ThematicCatalogService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.util.List;

import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Регрессия 404 на GET /api/thematic-catalog: маппинг контроллера должен
 * быть зарегистрирован (типичный симптом — старый процесс backend без пересборки).
 */
@WebMvcTest(controllers = ThematicCatalogController.class)
@AutoConfigureMockMvc(addFilters = false)
class ThematicCatalogControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private ThematicCatalogService thematicCatalogService;

    @Test
    void getCatalogIsMappedAndReturnsJsonArray() throws Exception {
        when(thematicCatalogService.getCatalog()).thenReturn(List.of());

        mockMvc.perform(get("/api/thematic-catalog").accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_JSON))
                .andExpect(content().json("[]"));
    }
}
