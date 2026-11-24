package burnar;

import burnar.config.BurnarProperties;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.EnableConfigurationProperties;

/**
 * Точка входа Spring Boot.
 * Фичи лежат отдельными пакетами (admin.user, person, naryad.list, naryad.oper.tree и другие).
 * Внутри фичи — controller, dto и service. Конфиг в config/, пользователь БД в security/.
 */
@SpringBootApplication
@EnableConfigurationProperties(BurnarProperties.class)
public class BurnarApplication {

    public static void main(String[] args) {
        SpringApplication.run(BurnarApplication.class, args);
    }
}
