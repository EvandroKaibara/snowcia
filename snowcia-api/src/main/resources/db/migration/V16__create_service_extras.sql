CREATE TABLE service_extras (
    service_id BIGINT NOT NULL REFERENCES service_offerings(id) ON DELETE CASCADE,
    extra_code VARCHAR(60) NOT NULL,
    extra_name VARCHAR(120) NOT NULL,
    extra_price NUMERIC(10, 2) NOT NULL,
    extra_pricing VARCHAR(30) NOT NULL
);
