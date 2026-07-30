ALTER TABLE reservations ADD COLUMN pet_names VARCHAR(500);

UPDATE reservations r
SET pet_names = p.name
FROM pets p
WHERE p.id = r.pet_id;
