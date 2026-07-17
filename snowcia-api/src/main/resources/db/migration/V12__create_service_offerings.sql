CREATE TABLE service_offerings (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(120) NOT NULL,
    description VARCHAR(1000),
    category VARCHAR(30) NOT NULL,
    target VARCHAR(20) NOT NULL,
    billing_type VARCHAR(20) NOT NULL,
    duration_minutes INTEGER,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    allow_date_selection BOOLEAN NOT NULL DEFAULT TRUE,
    allow_time_selection BOOLEAN NOT NULL DEFAULT FALSE,
    allow_customer_notes BOOLEAN NOT NULL DEFAULT TRUE,
    allow_check_in_out BOOLEAN NOT NULL DEFAULT FALSE,
    max_pets INTEGER
);

CREATE TABLE service_price_conditions (
    service_id BIGINT NOT NULL REFERENCES service_offerings(id) ON DELETE CASCADE,
    condition_name VARCHAR(80) NOT NULL,
    price NUMERIC(10, 2) NOT NULL
);
