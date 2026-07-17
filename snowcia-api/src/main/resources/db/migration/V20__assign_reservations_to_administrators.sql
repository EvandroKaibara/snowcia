ALTER TABLE reservations ADD COLUMN assigned_admin_id BIGINT;

ALTER TABLE reservations ADD CONSTRAINT fk_reservations_assigned_admin
  FOREIGN KEY (assigned_admin_id) REFERENCES users(id);
