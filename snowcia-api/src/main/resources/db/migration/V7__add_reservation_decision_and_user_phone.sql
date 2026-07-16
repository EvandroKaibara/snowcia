ALTER TABLE users ADD COLUMN phone VARCHAR(30);

ALTER TABLE reservations ADD COLUMN service_type VARCHAR(30);
ALTER TABLE reservations ADD COLUMN decline_reason VARCHAR(500);

UPDATE reservations SET service_type = 'HOSTING_24H' WHERE service_type IS NULL;

ALTER TABLE reservations ALTER COLUMN service_type SET NOT NULL;
