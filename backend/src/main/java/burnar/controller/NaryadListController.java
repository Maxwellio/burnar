package burnar.controller;

import burnar.dto.NaryadListDto;
import burnar.dto.NaryadListFilter;
import burnar.dto.YearMonthsDto;
import burnar.service.NaryadListService;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/**
 * Pageable-список нарядов бурения для BaseTable (useFetchData ждёт content/totalPages/totalElements).
 * Query page/size — Spring Data; колоночные фильтры — NaryadListFilter;
 * dateMode/period — боковая панель месяцев; /periods — дерево для DynamicDateList.
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
            @RequestParam(defaultValue = "100") int size,
            @RequestParam(required = false) String codNar,
            @RequestParam(required = false) String nameNar,
            @RequestParam(required = false) String ownerNar,
            @RequestParam(required = false) String masterNar,
            @RequestParam(required = false) String zadClose,
            @RequestParam(required = false) String vipClose,
            @RequestParam(required = false) String vipBegDate,
            @RequestParam(required = false) String skv,
            @RequestParam(required = false) String kust,
            @RequestParam(required = false) String mest,
            @RequestParam(required = false) String dateCreate,
            @RequestParam(required = false) String autorNar,
            @RequestParam(defaultValue = "0") int dateMode,
            @RequestParam(required = false) String period) {
        NaryadListFilter filter = new NaryadListFilter();
        filter.setCodNar(codNar);
        filter.setNameNar(nameNar);
        filter.setOwnerNar(ownerNar);
        filter.setMasterNar(masterNar);
        filter.setZadClose(zadClose);
        filter.setVipClose(vipClose);
        filter.setVipBegDate(vipBegDate);
        filter.setSkv(skv);
        filter.setKust(kust);
        filter.setMest(mest);
        filter.setDateCreate(dateCreate);
        filter.setAutorNar(autorNar);
        filter.setDateMode(dateMode);
        filter.setPeriod(period);
        return naryadListService.findDrillingOrders(PageRequest.of(page, size), filter);
    }

    /** Дерево годов/месяцев для DynamicDateList; dateMode как у списка. */
    @GetMapping("/periods")
    public List<YearMonthsDto> periods(@RequestParam(defaultValue = "0") int dateMode) {
        return naryadListService.findPeriodTree(dateMode);
    }
}
