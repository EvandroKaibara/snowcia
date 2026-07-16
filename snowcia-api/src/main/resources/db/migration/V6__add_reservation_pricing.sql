ALTER TABLE reservations ADD COLUMN total_amount NUMERIC(10, 2);

UPDATE reservations SET total_amount = 0
WHERE total_amount IS NULL;

ALTER TABLE reservations ALTER COLUMN total_amount SET NOT NULL;
