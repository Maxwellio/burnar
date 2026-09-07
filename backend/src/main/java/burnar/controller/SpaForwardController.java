package burnar.controller;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;

/**
 * Отдаёт SPA для client-side маршрутов: без forward GET /login и остальные
 * React Router-пути дают 404 в монолите (в dev Vite подставляет index.html;
 * Spring раздаёт только реальные файлы из static/).
 * /naryad/:id — карточка наряда (вкладки задание/выполнение).
 */
@Controller
public class SpaForwardController {

    @GetMapping("/login")
    public String loginSpa() {
        return "forward:/index.html";
    }

    @GetMapping({
            "/naryad",
            "/naryad/**",
            "/catalog",
            "/catalog/**",
            "/reports",
            "/reports/**",
            "/settings",
            "/settings/**",
            "/responsible-persons",
            "/responsible-persons/**",
            "/admin",
            "/admin/**"
    })
    public String appSpa() {
        return "forward:/index.html";
    }
}
