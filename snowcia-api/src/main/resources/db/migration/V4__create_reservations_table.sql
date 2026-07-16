CREATE TABLE reservations (
    id BIGSERIAL PRIMARY KEY,
    pet_id BIGINT NOT NULL REFERENCES pets(id) ON DELETE CASCADE,
    check_in_date DATE NOT NULL,
    check_out_date DATE NOT NULL,
    status VARCHAR(30) NOT NULL,
    notes VARCHAR(500),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL,
    CONSTRAINT chk_reservation_dates CHECK (check_out_date > check_in_date)
);

CREATE INDEX idx_reservations_pet_dates ON reservations (pet_id, check_in_date, check_out_date);
