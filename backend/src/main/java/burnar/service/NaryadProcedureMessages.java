package burnar.service;

import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * Текст исключения процедур наряда для диалога.
 * Снимает префикс PostgreSQL и код -200xx, а фрагмент между * и # вставляет в фразу.
 */
public final class NaryadProcedureMessages {

    private static final Pattern ROW_MARK = Pattern.compile("\\*\\s*([^#]*?)\\s*#");

    private NaryadProcedureMessages() {
    }

    public static String toUserMessage(String raw) {
        if (raw == null || raw.isBlank()) {
            return "Операция не выполнена";
        }
        String text = raw;
        int error = text.indexOf("ERROR:");
        if (error >= 0) {
            text = text.substring(error + "ERROR:".length()).trim();
        }
        int lineBreak = text.indexOf('\n');
        if (lineBreak >= 0) {
            text = text.substring(0, lineBreak).trim();
        }
        text = text.replaceFirst("^-\\d+,\\s*", "");
        Matcher marks = ROW_MARK.matcher(text);
        if (marks.find()) {
            String code = marks.group(1).trim();
            String before = text.substring(0, marks.start()).trim();
            String after = text.substring(marks.end()).trim();
            if (before.isEmpty() && after.isEmpty()) {
                return code.isEmpty() ? "Операция не выполнена" : "Код строки: " + code;
            }
            text = (before + " " + code + " " + after).replaceAll("\\s+", " ").trim();
        }
        return text.isEmpty() ? "Операция не выполнена" : text;
    }

    public static String from(Throwable error) {
        String best = null;
        Throwable current = error;
        while (current != null) {
            if (current.getMessage() != null && !current.getMessage().isBlank()) {
                best = current.getMessage();
            }
            current = current.getCause();
        }
        return toUserMessage(best);
    }
}
