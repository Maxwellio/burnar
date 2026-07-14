package burnar.repository;

import burnar.entity.UserEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

/**
 * Доступ к burnar.users для логина и GET /api/current-user.
 * Поиск по ora_name (логин), без учёта регистра — как в старом Delphi (upper).
 */
public interface UserRepository extends JpaRepository<UserEntity, Integer> {

    Optional<UserEntity> findByOraName(String oraName);

    Optional<UserEntity> findByOraNameIgnoreCaseAndActive(String oraName, Integer active);
}
