package burnar.controller;

import burnar.dto.NaryadAlgorithmDto;
import burnar.dto.NaryadOperNodeDto;
import burnar.dto.NaryadOperParamDto;
import burnar.service.NaryadWorkspaceService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/**
 * Карточка наряда: дерево работ (BaseTreeTable), параметры операции (BaseTable, массив),
 * текст алгоритма. id наряда — только цифры, чтобы не пересечься с /periods и /brigades.
 */
@RestController
@RequestMapping("/api/naryady")
public class NaryadWorkspaceController {

    private final NaryadWorkspaceService naryadWorkspaceService;

    public NaryadWorkspaceController(NaryadWorkspaceService naryadWorkspaceService) {
        this.naryadWorkspaceService = naryadWorkspaceService;
    }

    @GetMapping("/{id:\\d+}/zadanie")
    public List<NaryadOperNodeDto> zadanieRoots(@PathVariable int id) {
        return naryadWorkspaceService.findZadanieRoots(id);
    }

    @GetMapping("/{id:\\d+}/zadanie/{nodeId:\\d+}/children")
    public List<NaryadOperNodeDto> zadanieChildren(@PathVariable int id, @PathVariable long nodeId) {
        return naryadWorkspaceService.findZadanieChildren(id, nodeId);
    }

    @GetMapping("/{id:\\d+}/zadanie/params")
    public List<NaryadOperParamDto> zadanieParams(
            @PathVariable int id, @RequestParam(required = false) Long nodeId) {
        return naryadWorkspaceService.findZadanieParams(id, nodeId);
    }

    @GetMapping("/{id:\\d+}/zadanie/algorithm")
    public NaryadAlgorithmDto zadanieAlgorithm(
            @PathVariable int id, @RequestParam(required = false) Long nodeId) {
        return naryadWorkspaceService.findZadanieAlgorithm(id, nodeId);
    }

    @GetMapping("/{id:\\d+}/vipolnenie")
    public List<NaryadOperNodeDto> vipolnenieRoots(@PathVariable int id) {
        return naryadWorkspaceService.findVipolnenieRoots(id);
    }

    @GetMapping("/{id:\\d+}/vipolnenie/{nodeId:\\d+}/children")
    public List<NaryadOperNodeDto> vipolnenieChildren(
            @PathVariable int id, @PathVariable long nodeId) {
        return naryadWorkspaceService.findVipolnenieChildren(id, nodeId);
    }

    @GetMapping("/{id:\\d+}/vipolnenie/params")
    public List<NaryadOperParamDto> vipolnenieParams(
            @PathVariable int id, @RequestParam(required = false) Long nodeId) {
        return naryadWorkspaceService.findVipolnenieParams(id, nodeId);
    }

    @GetMapping("/{id:\\d+}/vipolnenie/algorithm")
    public NaryadAlgorithmDto vipolnenieAlgorithm(
            @PathVariable int id, @RequestParam(required = false) Long nodeId) {
        return naryadWorkspaceService.findVipolnenieAlgorithm(id, nodeId);
    }
}
