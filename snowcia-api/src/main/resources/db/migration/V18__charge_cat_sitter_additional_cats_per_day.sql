UPDATE service_extras
SET extra_pricing = 'PER_DAY'
WHERE extra_code = 'additional_cat'
  AND service_id IN (
    SELECT id
    FROM service_offerings
    WHERE lower(name) LIKE '%cat sitter%'
       OR lower(name) LIKE '%catsitter%'
  );
