package burnar;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

/**
 * Точка входа Spring Boot.
 * Пакеты: controller → service → repository → entity; конфиг в config/.
 */
@SpringBootApplication
public class BurnarApplication {

    public static void main(String[] args) {
        SpringApplication.run(BurnarApplication.class, args);
    }
}
