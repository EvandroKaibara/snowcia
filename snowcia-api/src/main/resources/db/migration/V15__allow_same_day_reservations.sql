ALTER TABLE reservations DROP CONSTRAINT IF EXISTS chk_reservation_dates;

ALTER TABLE reservations ADD CONSTRAINT chk_reservation_dates
    CHECK (
        check_out_date > check_in_date
        OR (check_out_date = check_in_date AND check_out_time > check_in_time)
    );
