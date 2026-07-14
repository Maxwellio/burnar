package burnar.security;

import burnar.entity.UserEntity;
import burnar.repository.UserRepository;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Collections;

/**
 * Загрузка пользователя из burnar.users для Spring Security formLogin.
 * Ролей в схеме нет — всем активным выдаём ROLE_USER.
 * Неактивные (active != 1) не находятся → «неверный логин/пароль».
 */
@Service
public class UserDetailsServiceImpl implements UserDetailsService {

    private static final String ROLE_USER = "ROLE_USER";
    private static final int ACTIVE = 1;

    private final UserRepository userRepository;

    public UserDetailsServiceImpl(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @Override
    @Transactional(readOnly = true)
    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
        // username из формы = ora_name
        UserEntity entity = userRepository.findByOraNameIgnoreCaseAndActive(username, ACTIVE)
                .orElseThrow(() -> new UsernameNotFoundException(
                        "User not found or inactive: " + username));

        return User.builder()
                .username(entity.getOraName())
                .password(entity.getPassword())
                .authorities(Collections.singletonList(new SimpleGrantedAuthority(ROLE_USER)))
                .disabled(entity.getActive() == null || entity.getActive() != ACTIVE)
                .build();
    }
}
