INSERT INTO service_extras (service_id, extra_code, extra_name, extra_price, extra_pricing)
SELECT id, 'additional_cat', 'Gato adicional', 15, 'PER_UNIT' FROM service_offerings WHERE lower(name) LIKE '%cat sitter%' OR lower(name) LIKE '%catsitter%';
INSERT INTO service_extras (service_id, extra_code, extra_name, extra_price, extra_pricing)
SELECT id, 'additional_visit', 'Visita adicional', 10, 'PER_UNIT' FROM service_offerings WHERE lower(name) LIKE '%cat sitter%' OR lower(name) LIKE '%catsitter%';
INSERT INTO service_extras (service_id, extra_code, extra_name, extra_price, extra_pricing)
SELECT id, 'medication_up_to_2', 'Medicamento (até 2 medicamentos)', 5, 'PER_DAY' FROM service_offerings WHERE lower(name) LIKE '%cat sitter%' OR lower(name) LIKE '%catsitter%' OR lower(name) LIKE '%daycare%' OR lower(name) LIKE '%day care%' OR lower(name) LIKE '%hospedagem%';
INSERT INTO service_extras (service_id, extra_code, extra_name, extra_price, extra_pricing)
SELECT id, 'medication_3_plus', 'Medicamento (3 ou mais)', 10, 'PER_DAY' FROM service_offerings WHERE lower(name) LIKE '%cat sitter%' OR lower(name) LIKE '%catsitter%' OR lower(name) LIKE '%daycare%' OR lower(name) LIKE '%day care%' OR lower(name) LIKE '%hospedagem%';
INSERT INTO service_extras (service_id, extra_code, extra_name, extra_price, extra_pricing)
SELECT id, 'extra_hour', 'Hora adicional', 5, 'PER_UNIT' FROM service_offerings WHERE lower(name) LIKE '%daycare%' OR lower(name) LIKE '%day care%';
INSERT INTO service_extras (service_id, extra_code, extra_name, extra_price, extra_pricing)
SELECT id, 'extra_walk', 'Passeio extra', 10, 'PER_UNIT' FROM service_offerings WHERE lower(name) LIKE '%daycare%' OR lower(name) LIKE '%day care%';
INSERT INTO service_extras (service_id, extra_code, extra_name, extra_price, extra_pricing)
SELECT id, 'additional_dog_walk', 'Cão adicional no passeio', 5, 'PER_UNIT' FROM service_offerings WHERE lower(name) LIKE '%daycare%' OR lower(name) LIKE '%day care%';
INSERT INTO service_extras (service_id, extra_code, extra_name, extra_price, extra_pricing)
SELECT id, 'weekend_holiday', 'Fim de semana/Feriado', 10, 'PER_DAY' FROM service_offerings WHERE lower(name) LIKE '%daycare%' OR lower(name) LIKE '%day care%';
INSERT INTO service_extras (service_id, extra_code, extra_name, extra_price, extra_pricing)
SELECT id, 'additional_dog', 'Cachorro adicional', 15, 'PER_UNIT' FROM service_offerings WHERE lower(name) LIKE '%passeio%';
INSERT INTO service_extras (service_id, extra_code, extra_name, extra_price, extra_pricing)
SELECT id, 'additional_walk', 'Passeio adicional', 15, 'PER_UNIT' FROM service_offerings WHERE lower(name) LIKE '%passeio%';
