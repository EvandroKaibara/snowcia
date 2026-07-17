DELETE FROM service_extras
WHERE extra_code IN ('extra_hour', 'weekend_holiday')
  AND service_id IN (
    SELECT id
    FROM service_offerings
    WHERE lower(name) LIKE '%daycare%'
       OR lower(name) LIKE '%day care%'
  );
