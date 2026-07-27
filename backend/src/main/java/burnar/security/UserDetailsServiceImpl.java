package burnar.security;

import burnar.config.BurnarProperties;
import burnar.entity.UserEntity;
import burnar.repository.UserRepository;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.Set;
import java.util.stream.Collectors;

/**
 * Загрузка пользователя из burnar.users для Spring Security formLogin.
 * ROLE_USER всем активным; ROLE_ADMIN — логинам из burnar.admin-users (Delphi + burnar_web).
 * Неактивные (active != 1) не находятся → «неверный логин/пароль».
 */
@Service
public class UserDetailsServiceImpl implements UserDetailsService {

    private static final String ROLE_USER = "ROLE_USER";
    private static final String ROLE_ADMIN = "ROLE_ADMIN";
    private static final int ACTIVE = 1;

    private final UserRepository userRepository;
    private final Set<String> adminUsersLower;

    public UserDetailsServiceImpl(UserRepository userRepository, BurnarProperties properties) {
        this.userRepository = userRepository;
        this.adminUsersLower = properties.getAdminUsers().stream()
                .filter(StringUtils::hasText)
                .map(s -> s.toLowerCase(Locale.ROOT))
                .collect(Collectors.toUnmodifiableSet());
    }

    @Override
    @Transactional(readOnly = true)
    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
        // username из формы = ora_name
        UserEntity entity = userRepository.findByOraNameIgnoreCaseAndActive(username, ACTIVE)
                .orElseThrow(() -> new UsernameNotFoundException(
                        "User not found or inactive: " + username));

        List<SimpleGrantedAuthority> authorities = new ArrayList<>();
        authorities.add(new SimpleGrantedAuthority(ROLE_USER));
        if (entity.getOraName() != null
                && adminUsersLower.contains(entity.getOraName().toLowerCase(Locale.ROOT))) {
            authorities.add(new SimpleGrantedAuthority(ROLE_ADMIN));
        }

        return User.builder()
                .username(entity.getOraName())
                .password(entity.getPassword())
                .authorities(authorities)
                .disabled(entity.getActive() == null || entity.getActive() != ACTIVE)
                .build();
    }
}
