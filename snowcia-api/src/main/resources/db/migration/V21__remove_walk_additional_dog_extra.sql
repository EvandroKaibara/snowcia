DELETE FROM service_extras
WHERE extra_code = 'additional_dog'
  AND service_id IN (
    SELECT id
    FROM service_offerings
    WHERE lower(name) LIKE '%passeio%'
       OR lower(name) LIKE '%walk%'
  );
