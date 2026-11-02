package burnar.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

import java.util.ArrayList;
import java.util.List;

/**
 * Настройки burnar.*: админ-логины (как Delphi + burnar_web) и id оргединиц для Select.
 */
@ConfigurationProperties(prefix = "burnar")
public class BurnarProperties {

    /** ora_name с ROLE_ADMIN (ignoreCase). */
    private List<String> adminUsers = new ArrayList<>();

    /** Пункты админского фильтра структуры (Delphi LoadCBX: 4,5,6,7,8). */
    private List<Integer> orgFilterIds = List.of(4, 5, 6, 7, 8);

    /** Каталог HTML-оперкарт на сервере, где работает приложение. */
    private Ocards ocards = new Ocards();

    public List<String> getAdminUsers() {
        return adminUsers;
    }

    public void setAdminUsers(List<String> adminUsers) {
        this.adminUsers = adminUsers != null ? adminUsers : new ArrayList<>();
    }

    public List<Integer> getOrgFilterIds() {
        return orgFilterIds;
    }

    public void setOrgFilterIds(List<Integer> orgFilterIds) {
        this.orgFilterIds = orgFilterIds != null ? orgFilterIds : List.of();
    }

    public String getOcardsDir() {
        return ocards == null || ocards.getDir() == null ? "" : ocards.getDir();
    }

    public Ocards getOcards() {
        return ocards;
    }

    public void setOcards(Ocards ocards) {
        this.ocards = ocards != null ? ocards : new Ocards();
    }

    public static class Ocards {
        private String dir = "";

        public String getDir() {
            return dir;
        }

        public void setDir(String dir) {
            this.dir = dir != null ? dir : "";
        }
    }
}
