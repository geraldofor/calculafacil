# 🧮 Calcula Fácil - Sistema Unificado de Cálculos

Sistema SaaS para consolidadoras de viagens que facilita cálculos de tarifas, conversão de itinerários e reemissões em múltiplos GDS (Amadeus, Galileo, Sabre).

## 🚀 Funcionalidades

### ✅ Implementado

- **Autenticação Completa**
  - Login com email/senha
  - Cadastro de novos usuários
  - Google OAuth (preparado para integração)
  - JWT tokens seguros
  - Proteção de rotas

- **Cálculo de Tarifas**
  - Suporte para Amadeus, Galileo e Sabre
  - Cálculo automático de RAV e fees
  - Regras de reemissão e reembolso
  - Exportação formatada

- **Conversor de Itinerários**
  - Converte itinerários de GDS para formato WhatsApp
  - Reconhecimento automático de aeroportos e companhias
  - Formatação padronizada

- **Reemissão (Amadeus)**
  - Cálculo complexo de reemissões
  - Validação automática com GDS
  - Tratamento de residual negativo
  - Conferência de valores

- **Histórico de Cálculos**
  - Salvamento automático de todos os cálculos
  - Organização por tipo e GDS
  - Recuperação de cálculos anteriores

### 🔜 Próximas Features

- Reemissão para Sabre e Galileo
- Suporte NDC (Iberia, Air France, American, Emirates)
- Exportação para PDF
- Dashboard com estatísticas
- Sistema de assinatura (Stripe)
- Multi-idioma (Inglês, Espanhol)

## 🛠 Stack Tecnológica

### Backend
- **FastAPI** - Framework Python moderno e rápido
- **MongoDB** - Banco de dados NoSQL
- **Motor** - Driver async para MongoDB
- **JWT + bcrypt** - Autenticação segura
- **Pydantic** - Validação de dados

### Frontend
- **React 19** - Framework JavaScript
- **Tailwind CSS** - Estilização
- **shadcn/ui** - Componentes UI
- **React Router** - Navegação
- **Axios** - Requisições HTTP

## 📁 Estrutura do Projeto

```
calcula-facil/
├── backend/
│   ├── app/
│   │   ├── api/
│   │   │   ├── auth.py              # Endpoints de autenticação
│   │   │   └── calculations.py      # Endpoints de cálculos
│   │   ├── core/
│   │   │   ├── config.py            # Configurações
│   │   │   ├── database.py          # Conexão MongoDB
│   │   │   └── security.py          # JWT e bcrypt
│   │   ├── models/
│   │   │   ├── user.py              # Modelo de usuário
│   │   │   └── calculation.py       # Modelo de cálculo
│   │   └── schemas/
│   │       ├── user.py              # Schemas Pydantic
│   │       └── calculation.py
│   ├── server.py                    # App principal
│   ├── requirements.txt
│   └── .env
│
└── frontend/
    ├── src/
    │   ├── pages/
    │   │   ├── Landing.jsx          # Página inicial
    │   │   ├── Auth.jsx             # Login/Registro
    │   │   └── Dashboard.jsx        # App principal
    │   ├── components/
    │   │   ├── calculators/
    │   │   │   ├── Tarifa.jsx
    │   │   │   ├── Conversor.jsx
    │   │   │   └── Reemissao.jsx
    │   │   └── ui/                  # Componentes shadcn
    │   ├── services/
    │   │   ├── api.js               # Configuração Axios
    │   │   ├── auth.js              # Serviço de autenticação
    │   │   └── calculations.js      # Serviço de cálculos
    │   ├── utils/
    │   │   ├── gdsData.js           # Dicionários (aeroportos, cias)
    │   │   └── formatters.js        # Funções de formatação
    │   └── App.js
    └── package.json
```

## 🔧 Configuração e Instalação

### Pré-requisitos
- Python 3.11+
- Node.js 18+
- MongoDB
- Yarn

### Backend

```bash
cd backend
pip install -r requirements.txt

# Configurar .env
echo "MONGO_URL=mongodb://localhost:27017" > .env
echo "DB_NAME=calcula_facil" >> .env
echo "SECRET_KEY=your-secret-key-min-32-chars" >> .env

# Iniciar servidor
uvicorn server:app --reload --host 0.0.0.0 --port 8001
```

### Frontend

```bash
cd frontend
yarn install

# Configurar .env
echo "REACT_APP_BACKEND_URL=http://localhost:8001" > .env

# Iniciar desenvolvimento
yarn start
```

## 📝 Variáveis de Ambiente

### Backend (.env)
```env
MONGO_URL=mongodb://localhost:27017
DB_NAME=calcula_facil
SECRET_KEY=your-secret-key-change-in-production-min-32-chars-long
CORS_ORIGINS=*
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
```

### Frontend (.env)
```env
REACT_APP_BACKEND_URL=http://localhost:8001
```

## 🔐 Autenticação

### Registro
```bash
POST /api/auth/register
{
  "email": "user@example.com",
  "password": "senha123",
  "full_name": "Nome Completo"
}
```

### Login
```bash
POST /api/auth/login
{
  "email": "user@example.com",
  "password": "senha123"
}
```

### Usar Token
```bash
GET /api/calculations/
Authorization: Bearer {token}
```

## 📊 APIs Disponíveis

### Autenticação
- `POST /api/auth/register` - Registrar novo usuário
- `POST /api/auth/login` - Login
- `POST /api/auth/google` - Login com Google
- `GET /api/auth/me` - Dados do usuário logado

### Cálculos
- `POST /api/calculations/` - Salvar cálculo
- `GET /api/calculations/` - Listar cálculos
- `GET /api/calculations/?calculation_type=tarifa` - Filtrar por tipo
- `DELETE /api/calculations/{id}` - Deletar cálculo

## 💰 Modelo de Negócio

### Planos Sugeridos

| Plano | Preço | Recursos |
|-------|-------|----------|
| **Profissional** | R$ 39,90/mês | Todos GDS, cálculos ilimitados, histórico completo |
| **Empresarial** | R$ 149,90/mês | Multi-usuário (5-10), API access, suporte prioritário |

## 🧪 Testes

### Testar Backend
```bash
# Health check
curl http://localhost:8001/api/health

# Registrar usuário
curl -X POST http://localhost:8001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "teste@example.com",
    "password": "senha123",
    "full_name": "Teste User"
  }'
```

### Testar Frontend
```bash
# Acessar em navegador
http://localhost:3000
```

## 📈 Roadmap

### Fase 1 (Concluída) ✅
- [x] Sistema de autenticação
- [x] Cálculo de tarifas (3 GDS)
- [x] Conversor de itinerários
- [x] Reemissão Amadeus
- [x] Histórico de cálculos
- [x] Interface completa

### Fase 2 (Próxima)
- [ ] Reemissão Sabre e Galileo
- [ ] Suporte NDC
- [ ] Exportação PDF
- [ ] Dashboard com métricas
- [ ] Testes automatizados

### Fase 3 (Monetização)
- [ ] Integração Stripe
- [ ] Página de vendas profissional
- [ ] Sistema de assinatura
- [ ] Multi-tenancy
- [ ] Deploy em produção

## 🌍 Expansão Internacional

O sistema foi desenvolvido pensando em expansão:
- Estrutura preparada para multi-idioma
- GDS universais (funcionam no mundo todo)
- Fácil adaptação de moedas
- Interface traduzível

## 👥 Autor

**Geraldo** - Sistema criado para facilitar o trabalho de consolidadoras de viagens

## 📄 Licença

Propriedade privada - Uso comercial planejado

## 🆘 Suporte

Para dúvidas ou suporte:
- Email: [seu-email]
- WhatsApp: [seu-whatsapp]

---

**Status do Projeto:** ✅ MVP Completo e Funcional

**Última Atualização:** Janeiro 2025
