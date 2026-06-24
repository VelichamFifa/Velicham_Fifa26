UPDATE `matches`
SET `isKnockoutMatch` = CASE
  WHEN `group` IS NOT NULL AND TRIM(`group`) <> '' THEN 0
  WHEN `round` IS NULL OR TRIM(`round`) = '' THEN 0
  WHEN LOWER(TRIM(`round`)) LIKE 'group%' THEN 0
  WHEN LOWER(TRIM(`round`)) REGEXP '^gr[0-9]+$' THEN 0
  ELSE 1
END;
