ALTER TABLE reservations ADD COLUMN service_offering_id BIGINT REFERENCES service_offerings(id);
