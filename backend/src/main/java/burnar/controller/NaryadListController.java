package burnar.controller;

import burnar.dto.NaryadListDto;
import burnar.service.NaryadListService;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/**
 * Pageable-список нарядов бурения для BaseTable (useFetchData ждёт content/totalPages/totalElements).
 * Query-параметры page/size — как у Spring Data; фильтры колонок подключим позже.
 */
@RestController
@RequestMapping("/api/naryady")
public class NaryadListController {

    private final NaryadListService naryadListService;

    public NaryadListController(NaryadListService naryadListService) {
        this.naryadListService = naryadListService;
    }

    @GetMapping
    public Page<NaryadListDto> list(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "100") int size) {
        return naryadListService.findDrillingOrders(PageRequest.of(page, size));
    }
}
