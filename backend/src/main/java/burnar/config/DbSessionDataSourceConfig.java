package burnar.config;

import org.springframework.beans.factory.config.BeanPostProcessor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import javax.sql.DataSource;

/** Оборачивает DataSource Spring Boot в {@link DbSessionDataSource}; JDBC и JPA идут через него. */
@Configuration
public class DbSessionDataSourceConfig {

    @Bean
    public static BeanPostProcessor dbSessionDataSourcePostProcessor() {
        return new BeanPostProcessor() {
            @Override
            public Object postProcessAfterInitialization(Object bean, String beanName) {
                if (bean instanceof DataSource && !(bean instanceof DbSessionDataSource)) {
                    return new DbSessionDataSource((DataSource) bean);
                }
                return bean;
            }
        };
    }
}
