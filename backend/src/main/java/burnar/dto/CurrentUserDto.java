package burnar.dto;

import java.util.List;

/**
 * Ответ GET /api/current-user для SPA (AuthContext).
 * Без isFirstLogin — смена пароля пока не перенесена.
 */
public class CurrentUserDto {

    private final String username;
    private final List<String> roles;
    private final Integer userId;

    public CurrentUserDto(String username, List<String> roles, Integer userId) {
        this.username = username;
        this.roles = roles != null ? List.copyOf(roles) : List.of();
        this.userId = userId;
    }

    public String getUsername() {
        return username;
    }

    public List<String> getRoles() {
        return roles;
    }

    public Integer getUserId() {
        return userId;
    }
}
