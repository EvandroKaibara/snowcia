# Snowcia

Sistema de gestão de hotel pet, com API Spring Boot, PostgreSQL, Flyway e autenticação JWT.

## Como executar a API

1. Crie um banco PostgreSQL chamado `snowcia`.
2. Configure as credenciais em `snowcia-api/src/main/resources/application-dev.yml` ou pelas variáveis de ambiente.
3. Execute `mvn spring-boot:run` dentro de `snowcia-api`.

As migrações Flyway criam automaticamente as tabelas de perfis, usuários, pets, reservas e pagamentos.

## Endpoints

- `POST /api/auth/register` e `POST /api/auth/login`
- `GET|POST|PUT|DELETE /api/pets`
- `GET|POST|PUT|DELETE /api/reservations`
- `GET|POST /api/payments`
- `PATCH /api/payments/{id}/confirm` e `PATCH /api/payments/{id}/cancel`

Os endpoints de domínio exigem o cabeçalho `Authorization: Bearer <token>`.

- Documentação interativa: `http://localhost:8080/swagger-ui.html`
- Verificação de saúde: `http://localhost:8080/actuator/health`
