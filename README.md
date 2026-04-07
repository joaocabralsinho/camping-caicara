# Camping Caiçara — Sistema de Reservas

Sistema completo de reservas online desenvolvido para um camping real na **Praia do Sono, Paraty-RJ**.

O cliente gerenciava tudo manualmente pelo WhatsApp — respondia perguntas repetidas, anotava reservas no Excel e já perdeu reservas por esquecimento. Esta plataforma automatiza todo o processo de ponta a ponta.

**[Ver site ao vivo](https://camping-caicara.vercel.app)**

![Next.js](https://img.shields.io/badge/Next.js_16-000?logo=nextdotjs&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?logo=typescript&logoColor=white)
![React](https://img.shields.io/badge/React_19-61DAFB?logo=react&logoColor=black)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS_v4-06B6D4?logo=tailwindcss&logoColor=white)
![Supabase](https://img.shields.io/badge/Supabase-3FCF8E?logo=supabase&logoColor=white)
![Mercado Pago](https://img.shields.io/badge/Mercado_Pago-00B1EA?logo=mercadopago&logoColor=white)
![Vercel](https://img.shields.io/badge/Vercel-000?logo=vercel&logoColor=white)

---

## Funcionalidades

### Busca de Disponibilidade em Tempo Real
- Seleciona datas de check-in/check-out e quantidade de hóspedes
- Verifica automaticamente quais das 7 acomodações estão disponíveis
- Lógica especial para a área de camping: aceita múltiplas reservas simultâneas e controla lotação pelo total de pessoas (até 500)
- Acomodações fixas (chalés, bangalôs, suíte) bloqueiam o período inteiro quando reservadas

### Motor de Precificação Dinâmica
- Preços variam automaticamente por **temporada** (Réveillon, Carnaval, alta temporada, etc.)
- **Faixas de hóspedes**: casal paga diferente de grupo de 6
- **Duração da estadia**: desconto para estadias mais longas
- 4 tipos de precificação: por noite, por pessoa/noite, por pessoa/dia e pacote fechado
- Temporadas e regras de preço são totalmente configuráveis pelo painel admin

### Reserva Completa com Coleta de Dados
- Formulário coleta dados de **todos** os hóspedes (nome, CPF com validação real, RG)
- Contato por e-mail e WhatsApp
- Campo de observações para pedidos especiais
- Opção de pagamento: **50% de entrada** ou **100% com 5% de desconto**

### Integração com Mercado Pago (Checkout Pro)
- Aceita PIX, cartão de crédito, débito e boleto
- Webhook recebe notificação de pagamento e atualiza status automaticamente
- Páginas de retorno para sucesso, falha e pagamento pendente
- Nenhuma intervenção manual necessária

### Confirmação por E-mail Automático (Resend)
- Após aprovação do pagamento, hóspede recebe e-mail com:
  - Detalhes da reserva e ID de confirmação
  - Contrato em anexo
  - Link direto para WhatsApp do camping
  - Resumo do pagamento (valor pago, restante se parcial)

### Painel Administrativo Completo
- Login protegido por senha com toggle de visibilidade
- **Reservas**: listar, filtrar por status (pendente, confirmada, cancelada, concluída), expandir detalhes dos hóspedes, atualizar status
- **Preços**: CRUD completo de regras de preço por acomodação e temporada
- **Temporadas**: criar, editar e excluir períodos com indicadores de ativa/futura/passada
- **Bloqueio de datas**: bloquear intervalos por acomodação com motivo (manutenção, evento, etc.)
- Envio de contrato via WhatsApp direto pelo painel

---

## Acomodações

| Acomodação | Capacidade | Tipo |
|---|---|---|
| Chalé 1 | 6 pessoas | Chalé |
| Chalé 2 | 4 pessoas | Chalé |
| Chalé 3 | 4 pessoas | Chalé |
| Suíte | 5 pessoas | Suíte |
| Bangalô 1 | 2 pessoas | Bangalô |
| Bangalô 2 | 2 pessoas | Bangalô |
| Área de Camping | 500 pessoas | Camping |

---

## Stack

| Tecnologia | Uso |
|---|---|
| **Next.js 16** | Framework full-stack (App Router) |
| **React 19** | Interface de usuário |
| **TypeScript** | Tipagem estática |
| **Tailwind CSS v4** | Estilização |
| **Supabase** | Banco de dados PostgreSQL |
| **Mercado Pago** | Processamento de pagamentos |
| **Resend** | Envio de e-mails transacionais |
| **Vercel** | Hospedagem e deploy automático |

---

## Estrutura do Projeto

```
src/
├── app/
│   ├── page.tsx                    # Homepage — busca e vitrine de acomodações
│   ├── reservar/page.tsx           # Formulário de reserva
│   ├── reserva/
│   │   ├── sucesso/page.tsx        # Página de pagamento aprovado
│   │   ├── falha/page.tsx          # Página de pagamento recusado
│   │   └── pendente/page.tsx       # Página de pagamento pendente
│   ├── admin/
│   │   ├── page.tsx                # Login do admin
│   │   ├── reservas/page.tsx       # Gerenciamento de reservas
│   │   ├── precos/page.tsx         # Regras de preço
│   │   ├── temporadas/page.tsx     # Temporadas
│   │   └── bloqueios/page.tsx      # Bloqueio de datas
│   └── api/
│       ├── admin/route.ts          # Auth do admin (login/logout/verificação)
│       ├── payments/checkout/      # Criação de checkout Mercado Pago
│       └── payments/webhook/       # Webhook de confirmação de pagamento
├── lib/
│   ├── supabase.ts                 # Cliente Supabase
│   ├── availability.ts             # Motor de disponibilidade
│   ├── pricing.ts                  # Motor de precificação
│   ├── reservations.ts             # Criação de reservas
│   ├── email.ts                    # Templates e envio de e-mail
│   └── cpf.ts                      # Validação e formatação de CPF
└── public/
    └── fotos/                      # Fotos das acomodações
```

---

## Rodando Localmente

```bash
# Clonar o repositório
git clone https://github.com/joaocabralsinho/camping-caicara.git
cd camping-caicara

# Instalar dependências
npm install

# Configurar variáveis de ambiente
cp .env.example .env.local
# Preencher com suas chaves do Supabase, Mercado Pago e Resend

# Rodar em desenvolvimento
npm run dev
```

### Variáveis de Ambiente

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
NEXT_PUBLIC_BASE_URL=
ADMIN_PASSWORD=
RESEND_API_KEY=
MERCADO_PAGO_ACCESS_TOKEN=
NEXT_PUBLIC_MERCADO_PAGO_PUBLIC_KEY=
```

---

## Banco de Dados

6 tabelas no Supabase (PostgreSQL):

- **accommodations** — inventário de acomodações
- **seasons** — períodos de temporada com datas
- **pricing** — regras de preço por acomodação, temporada e faixa de hóspedes
- **reservations** — reservas com dados dos hóspedes
- **payments** — registros de pagamento vinculados às reservas
- **blocked_dates** — datas bloqueadas manualmente por acomodação

Os scripts de migração estão em `supabase/`.
