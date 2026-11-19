package burnar.controller;

import burnar.dto.BrigadeDto;
import burnar.dto.NaryadCreateRequest;
import burnar.dto.NaryadCreatedDto;
import burnar.dto.NaryadHeaderDto;
import burnar.dto.NaryadListDto;
import burnar.dto.NaryadListFilter;
import burnar.dto.YearMonthsDto;
import burnar.service.NaryadListCommandService;
import burnar.service.NaryadListService;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/**
 * Pageable-список нарядов бурения для BaseTable (useFetchData ждёт content/totalPages/totalElements).
 * Query page/size — Spring Data; колоночные фильтры — NaryadListFilter;
 * dateMode/period — боковая панель месяцев; orgUnitId — админская обрезка ACL;
 * /periods — дерево для DynamicDateList, /brigades — справочник для фильтра «Бригада»
 * (оба с тем же ACL). POST создаёт наряд, DELETE /{id} удаляет один видимый наряд,
 * /create-brigades — бригады окна создания.
 */
@RestController
@RequestMapping("/api/naryady")
public class NaryadListController {

    private final NaryadListService naryadListService;
    private final NaryadListCommandService naryadListCommandService;

    public NaryadListController(
            NaryadListService naryadListService,
            NaryadListCommandService naryadListCommandService) {
        this.naryadListService = naryadListService;
        this.naryadListCommandService = naryadListCommandService;
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
            @RequestParam(required = false) String period,
            @RequestParam(required = false) Integer orgUnitId) {
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
        filter.setOrgUnitId(orgUnitId);
        return naryadListService.findDrillingOrders(PageRequest.of(page, size), filter);
    }

    /**
     * Справочник бригад для SELECT-фильтра колонки «Бригада».
     * Параметр называется org, а не orgUnitId — так его шлёт SelectFilter из mainComponent.
     */
    @GetMapping("/brigades")
    public List<BrigadeDto> brigades(@RequestParam(required = false) Integer org) {
        return naryadListService.findBrigades(org);
    }

    /** Бригады окна создания: spr_workers.key, подпись — путь. Админ видит весь справочник. */
    @GetMapping("/create-brigades")
    public List<BrigadeDto> createBrigades() {
        return naryadListCommandService.findCreateBrigades();
    }

    /** Новый наряд бурения. В ответе код, по которому страница открывает карточку. */
    @PostMapping
    public NaryadCreatedDto create(@RequestBody NaryadCreateRequest request) {
        return naryadListCommandService.create(request);
    }

    /** Удаление одного наряда. Закрытое задание и закрытое выполнение отвечают 409. */
    @DeleteMapping("/{id:\\d+}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable int id) {
        naryadListCommandService.delete(id);
    }

    /** Дерево годов/месяцев для DynamicDateList; dateMode/orgUnitId как у списка. */
    @GetMapping("/periods")
    public List<YearMonthsDto> periods(
            @RequestParam(defaultValue = "0") int dateMode,
            @RequestParam(required = false) Integer orgUnitId) {
        return naryadListService.findPeriodTree(dateMode, orgUnitId);
    }

    /**
     * Заголовок карточки /naryad/:id (id, nameNar, описатели, флаги закрытия).
     * Только цифры, чтобы не перехватить /periods и /brigades.
     */
    @GetMapping("/{id:\\d+}")
    public NaryadHeaderDto header(@PathVariable int id) {
        return naryadListService.findHeader(id);
    }
}
