-- Накатить на живую БД (объекты также должны появиться в репозитории Maxwellio/bd_bur).
-- Порядок: функция+триггер, процедура разовой зачистки, затем:
--   CALL burnar.cleanup_orphan_doljtostruct();

--Function: burnar.ftrg_karjera_cleanup_doljtostruct()

CREATE OR REPLACE FUNCTION burnar.ftrg_karjera_cleanup_doljtostruct()
RETURNS trigger
AS $$
DECLARE
  old_ds integer;
BEGIN
  -- karjera_add при UPDATE всегда пишет DOLJINSTRU в SET, даже если пара не менялась.
  IF TG_OP = 'UPDATE' AND NEW.doljinstru IS NOT DISTINCT FROM OLD.doljinstru THEN
    RETURN NEW;
  END IF;

  old_ds := OLD.doljinstru;
  IF old_ds IS NULL THEN
    IF TG_OP = 'DELETE' THEN
      RETURN OLD;
    END IF;
    RETURN NEW;
  END IF;

  -- пара общая (UNIQUE doljnost+org): удаляем только когда не осталось ни одной карьеры.
  IF EXISTS (
       SELECT 1
         FROM burnar.karjera k
        WHERE k.doljinstru = old_ds
     ) THEN
    IF TG_OP = 'DELETE' THEN
      RETURN OLD;
    END IF;
    RETURN NEW;
  END IF;

  -- устаревшие подчинения на уже ничью пару, иначе fk_boss не даст удалить строку.
  UPDATE burnar.doljtostruct
     SET boss = NULL
   WHERE boss = old_ds;

  DELETE FROM burnar.doljtostruct
   WHERE "key" = old_ds;

  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  END IF;
  RETURN NEW;
END;
$$
LANGUAGE 'plpgsql';

ALTER FUNCTION burnar.ftrg_karjera_cleanup_doljtostruct()
  OWNER TO postgres;

GRANT EXECUTE
  ON FUNCTION burnar.ftrg_karjera_cleanup_doljtostruct()
TO postgres;

GRANT EXECUTE
  ON FUNCTION burnar.ftrg_karjera_cleanup_doljtostruct()
TO burnar_role;

DROP TRIGGER IF EXISTS trg_karjera_cleanup_doljtostruct ON burnar.karjera;

CREATE TRIGGER trg_karjera_cleanup_doljtostruct
  AFTER DELETE OR UPDATE OF doljinstru
  ON burnar.karjera
  FOR EACH ROW
  EXECUTE PROCEDURE burnar.ftrg_karjera_cleanup_doljtostruct();

--Procedure: burnar.cleanup_orphan_doljtostruct()
-- Разовая зачистка сирот, накопившихся до триггера.

CREATE OR REPLACE PROCEDURE burnar.cleanup_orphan_doljtostruct()
AS $$
BEGIN
  UPDATE burnar.doljtostruct x
     SET boss = NULL
   WHERE x.boss IS NOT NULL
     AND NOT EXISTS (
           SELECT 1
             FROM burnar.karjera k
            WHERE k.doljinstru = x.boss
         );

  DELETE FROM burnar.doljtostruct d
   WHERE NOT EXISTS (
           SELECT 1
             FROM burnar.karjera k
            WHERE k.doljinstru = d."key"
         );
END
$$
LANGUAGE 'plpgsql';

ALTER PROCEDURE burnar.cleanup_orphan_doljtostruct()
  OWNER TO postgres;

GRANT EXECUTE
  ON PROCEDURE burnar.cleanup_orphan_doljtostruct()
TO postgres;
