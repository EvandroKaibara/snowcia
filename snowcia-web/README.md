# snowcia-web

Painel web da Snow & Cia, em React com Vite. Tutores cadastram os pets e pedem serviços. A equipe aceita ou recusa os pedidos, confirma pagamentos e mantém o catálogo de serviços.

## Rodar

```bash
npm install
npm run dev
```

O app abre em `http://localhost:5173` e chama a API em `http://localhost:8080`. Para outro endereço, defina `VITE_API_URL` num arquivo `.env.local`.

## Comandos

- `npm test`: testes do cálculo de preço e da montagem da reserva (`node --test`).
- `npm run lint`: oxlint.
- `npm run build`: gera o build de produção em `dist/`.

## Organização

- `src/App.jsx`: login, navegação, carregamento dos dados e ações que chamam a API.
- `src/screens/`: uma tela por arquivo (visão geral, pets, reservas, painel da equipe, perfil).
- `src/components/ui.jsx`: componentes compartilhados (campo, modal, aviso, ícones).
- `src/lib/`: formatação, regras do catálogo e a estimativa de preço.
- `src/assets/brand/`: logo e ilustrações exportadas do Figma SNOW_CIA_ASSETS.

O valor que aparece no formulário de reserva é só uma estimativa. Quem cobra é a API, em `ReservationPricingService`. Os dois lados têm testes com os mesmos casos, então uma mudança de regra precisa entrar nos dois.
