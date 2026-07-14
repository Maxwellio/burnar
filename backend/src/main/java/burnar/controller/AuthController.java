package burnar.controller;

import burnar.dto.CurrentUserDto;
import burnar.repository.UserRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.stream.Collectors;

/**
 * Сессионный пользователь для фронта.
 * Сам POST /api/login обрабатывает Spring Security (formLogin), не этот контроллер.
 */
@RestController
@RequestMapping("/api")
public class AuthController {

    private final UserRepository userRepository;

    public AuthController(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    /**
     * Кто залогинен по JSESSIONID, либо 401.
     * permitAll в SecurityConfig — чтобы SPA могла проверить сессию без редиректа Security.
     */
    @GetMapping("/current-user")
    public ResponseEntity<CurrentUserDto> getCurrentUser() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated()
                || "anonymousUser".equals(auth.getPrincipal())) {
            return ResponseEntity.status(401).build();
        }

        String username = auth.getName();
        var roles = auth.getAuthorities().stream()
                .map(GrantedAuthority::getAuthority)
                .collect(Collectors.toList());

        var user = userRepository.findByOraName(username).orElse(null);
        Integer userId = user != null ? user.getUsersId() : null;

        return ResponseEntity.ok(new CurrentUserDto(username, roles, userId));
    }
}
