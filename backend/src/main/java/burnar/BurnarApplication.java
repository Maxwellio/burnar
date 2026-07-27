package burnar;

import burnar.config.BurnarProperties;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.EnableConfigurationProperties;

/**
 * Точка входа Spring Boot.
 * Пакеты: controller → service → repository → entity; конфиг в config/.
 */
@SpringBootApplication
@EnableConfigurationProperties(BurnarProperties.class)
public class BurnarApplication {

    public static void main(String[] args) {
        SpringApplication.run(BurnarApplication.class, args);
    }
}
