package burnar.entity;

import javax.persistence.Column;
import javax.persistence.Entity;
import javax.persistence.Id;
import javax.persistence.Table;
import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * Пользователь системы (burnar.users).
 * Логин — ora_name; пароль — BCrypt в колонке password (как в Work_redone).
 * Связь people_id → burnar.people пока не подгружаем (достаточно для auth).
 */
@Entity
@Table(name = "users", schema = "burnar")
public class UserEntity {

    @Id
    @Column(name = "users_id")
    private Integer usersId;

    @Column(name = "ora_name", nullable = false, unique = true, length = 100)
    private String oraName;

    @Column(name = "people_id", nullable = false)
    private Integer peopleId;

    /** 1 — активен, 0 — отключён (см. COMMENT в DDL). */
    @Column(name = "active")
    private Integer active;

    @Column(name = "note", length = 250)
    private String note;

    @Column(name = "dtenter")
    private LocalDate dtenter;

    @Column(name = "dtout")
    private LocalDate dtout;

    @Column(name = "password")
    private String password;

    @Column(name = "created")
    private LocalDateTime created;

    public Integer getUsersId() {
        return usersId;
    }

    public void setUsersId(Integer usersId) {
        this.usersId = usersId;
    }

    public String getOraName() {
        return oraName;
    }

    public void setOraName(String oraName) {
        this.oraName = oraName;
    }

    public Integer getPeopleId() {
        return peopleId;
    }

    public void setPeopleId(Integer peopleId) {
        this.peopleId = peopleId;
    }

    public Integer getActive() {
        return active;
    }

    public void setActive(Integer active) {
        this.active = active;
    }

    public String getNote() {
        return note;
    }

    public void setNote(String note) {
        this.note = note;
    }

    public LocalDate getDtenter() {
        return dtenter;
    }

    public void setDtenter(LocalDate dtenter) {
        this.dtenter = dtenter;
    }

    public LocalDate getDtout() {
        return dtout;
    }

    public void setDtout(LocalDate dtout) {
        this.dtout = dtout;
    }

    public String getPassword() {
        return password;
    }

    public void setPassword(String password) {
        this.password = password;
    }

    public LocalDateTime getCreated() {
        return created;
    }

    public void setCreated(LocalDateTime created) {
        this.created = created;
    }
}
