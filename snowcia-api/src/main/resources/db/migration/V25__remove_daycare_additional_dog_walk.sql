DELETE FROM service_extras
WHERE extra_code = 'additional_dog_walk'
  AND service_id IN (
    SELECT id FROM service_offerings
    WHERE category = 'DAYCARE' OR lower(name) LIKE '%daycare%' OR lower(name) LIKE '%day care%'
  );
