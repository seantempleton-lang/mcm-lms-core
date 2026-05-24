CREATE OR REPLACE FUNCTION try_parse_jsonb(value text)
RETURNS jsonb
LANGUAGE plpgsql
AS $$
BEGIN
  IF value IS NULL OR btrim(value) = '' THEN
    RETURN NULL;
  END IF;

  RETURN value::jsonb;
EXCEPTION WHEN others THEN
  RETURN to_jsonb(value);
END;
$$;

ALTER TABLE "Module"
  ALTER COLUMN "contentBody" TYPE JSONB
  USING try_parse_jsonb("contentBody");

DROP FUNCTION try_parse_jsonb(text);
