# 🚀 Guia Rápido - Calcula Fácil

## ✅ Status do Sistema

**Backend:** ✅ Rodando em http://localhost:8001  
**Frontend:** ✅ Rodando em http://localhost:3000  
**MongoDB:** ✅ Conectado  

## 📱 Como Usar

### 1. Acessar o Sistema

```
http://localhost:3000
```

Você verá a **Landing Page** com:
- Descrição do sistema
- Recursos principais
- Botão "Começar Agora"

### 2. Criar Conta

1. Clique em **"Cadastrar Grátis"** ou **"Começar Agora"**
2. Preencha:
   - Nome completo
   - Email
   - Senha (mínimo 6 caracteres)
3. Clique em **"Criar Conta"**

### 3. Fazer Login

1. Se já tiver conta, clique em **"Entrar"**
2. Digite email e senha
3. Clique em **"Entrar"**

### 4. Usar as Calculadoras

#### 🧮 Cálculo de Tarifas

1. No Dashboard, clique em **"Tarifas"** (sidebar)
2. Selecione o GDS (Amadeus, Galileo ou Sabre)
3. Cole a cotação do GDS no campo de texto
4. Preencha os dados:
   - Voo/Cia (ex: TAP)
   - Cabine (ex: ECONOMY STANDARD)
   - Bagagem (ex: No Bag)
   - FEE (em BRL)
   - RAV % (ex: 7)
   - Multas de reemissão e reembolso
   - Parcelamento
5. Clique em **"GERAR"**
6. O resultado aparece formatado abaixo
7. Clique em **"COPIAR"** para copiar para área de transferência

**Exemplo de entrada (Amadeus):**
```
FXP/R,U
01 FARE BASIS       BSAVER
      BRL    FARE      TAX     TOTAL
 01   795.00   921.44  1716.44
```

#### 🔄 Conversor de Itinerários

1. Clique em **"Conversor"** (sidebar)
2. Selecione o GDS
3. Cole as linhas de voo do GDS
4. Clique em **"DECODIFICAR"**
5. O resultado sai formatado para WhatsApp
6. Clique em **"COPIAR ZAP"**

**Exemplo de entrada:**
```
1  TP 085  Y 15MAR 2 GRUMAD HK1  2305  0845+1 
2  TP 084  Y 22MAR 2 MADGRU HK1  1450  2015
```

#### ↩️ Reemissão (Amadeus)

1. Clique em **"Reemissão"** (sidebar)
2. Cole o resumo ET* do Amadeus
3. Preencha:
   - Cotação do dólar
   - FEE (USD)
   - % RAV
   - RAV mínimo
   - Dados opcionais: ticket, passageiro, rota, data
4. Clique em **"CALCULAR"**
5. O sistema faz os cálculos e valida com GDS
6. Clique em **"COPIAR"** para copiar resultado

**Exemplo de entrada (ET*):**
```
OLD BASE FARE       USD       795.00
NEW BASE FARE       USD       795.00
FARE BALANCE        BRL         0.00
OLD TAX             BRL       921.44
NEW TAX             BRL       936.59
TAX BALANCE         BRL        55.15
RESIDUAL VALUE      BRL       -24.00
PENALTY             BRL      1771.20
TICKET DIFFERENCE   BRL        55.15
TOTAL ADD COLL      BRL      1850.35
```

## 🔐 Segurança

- Todos os cálculos são salvos automaticamente
- Apenas você pode ver seus cálculos
- Senha criptografada com bcrypt
- Tokens JWT seguros

## 💾 Histórico

Os cálculos são salvos automaticamente:
- Acesse a API: `GET /api/calculations/`
- Filtre por tipo: `?calculation_type=tarifa`
- Limite de resultados: `?limit=50`

## 🐛 Resolução de Problemas

### Frontend não carrega
```bash
sudo supervisorctl restart frontend
```

### Backend com erro
```bash
sudo supervisorctl restart backend
tail -f /var/log/supervisor/backend.err.log
```

### MongoDB desconectado
```bash
sudo supervisorctl restart mongodb
```

## 🎯 Testes Rápidos

### Testar Backend
```bash
# Health check
curl http://localhost:8001/api/health

# Criar usuário
curl -X POST http://localhost:8001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "teste@example.com",
    "password": "senha123",
    "full_name": "Teste User"
  }'
```

### Testar Frontend
Abra no navegador: `http://localhost:3000`

## 📊 Status dos Serviços

```bash
sudo supervisorctl status
```

## 🔄 Reiniciar Tudo

```bash
sudo supervisorctl restart all
```

## 📝 Logs Úteis

```bash
# Backend
tail -f /var/log/supervisor/backend.out.log
tail -f /var/log/supervisor/backend.err.log

# Frontend
tail -f /var/log/supervisor/frontend.out.log
tail -f /var/log/supervisor/frontend.err.log
```

## ✨ Features Implementadas

- ✅ Autenticação (Email/Senha)
- ✅ Google OAuth (preparado)
- ✅ Cálculo de Tarifas (Amadeus, Galileo, Sabre)
- ✅ Conversor de Itinerários
- ✅ Reemissão Amadeus
- ✅ Histórico de Cálculos
- ✅ Interface Responsiva
- ✅ Copiar para Clipboard
- ✅ Validação de Dados

## 🎨 Próximos Passos

1. **Testar todas as funcionalidades** no navegador
2. **Adicionar mais GDS** na reemissão (Sabre, Galileo)
3. **Implementar NDC** (Iberia, Air France, etc)
4. **Integrar Stripe** para pagamentos
5. **Deploy em produção** (Vercel + Railway/Heroku)

## 💡 Dicas de Uso

- Use Ctrl+C (Cmd+C) para copiar resultados
- Salve seus cálculos importantes
- Teste com dados reais do seu trabalho
- Reporte bugs ou sugestões

---

**Sistema pronto para uso!** 🎉

**Acesse agora:** http://localhost:3000
