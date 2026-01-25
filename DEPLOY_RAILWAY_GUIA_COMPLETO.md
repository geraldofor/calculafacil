# 🚂 DEPLOY BACKEND NO RAILWAY - GUIA COMPLETO

## PASSO 1: CRIAR CONTA RAILWAY

1. Acesse: https://railway.app
2. Clique em "Start a New Project"
3. Login com GitHub
4. Autorize Railway

---

## PASSO 2: CRIAR PROJETO

1. No Dashboard Railway, clique em **"New Project"**
2. Selecione **"Deploy from GitHub repo"**
3. Escolha o repositório: **calcula-facil**
4. Railway detecta automaticamente Python

---

## PASSO 3: CONFIGURAR ROOT DIRECTORY

⚠️ **IMPORTANTE:** Seu backend está em `/backend`, não na raiz!

**No Railway:**
1. Vá em **Settings**
2. Em **"Root Directory"**, coloque:
   ```
   backend
   ```
3. Salve

---

## PASSO 4: ADICIONAR MONGODB

1. No Dashboard Railway, clique em **"New"**
2. Selecione **"Database"**
3. Escolha **"Add MongoDB"**
4. Railway cria automaticamente!

**MongoDB será criado com variáveis:**
- `MONGO_URL` (auto-gerada)
- Ou use variáveis individuais: `MONGO_INITDB_ROOT_USERNAME`, etc.

---

## PASSO 5: CONFIGURAR VARIÁVEIS DE AMBIENTE

No Railway → Seu Projeto Backend → **Variables**

Adicione:

```bash
# Database (Railway gera automaticamente quando você adiciona MongoDB)
MONGO_URL=${{MongoDB.MONGO_URL}}  # Referência ao MongoDB do Railway

# Se não funcionar automaticamente, use:
MONGO_URL=mongodb://mongo:SENHA@containers-us-west-XXX.railway.app:7XXX

# Security
SECRET_KEY=calcula-facil-production-secret-key-change-this-min-32-chars

# CORS - URL do Vercel
CORS_ORIGINS=https://calculafacil.vercel.app,http://localhost:3000

# Database Name
DB_NAME=calcula_facil

# Google OAuth (opcional por enquanto)
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=

# Port (Railway injeta automaticamente)
PORT=8001
```

---

## PASSO 6: CONFIGURAR START COMMAND

**No Railway → Settings → Deploy:**

**Start Command:**
```bash
uvicorn server:app --host 0.0.0.0 --port $PORT
```

**Build Command (opcional):**
```bash
pip install -r requirements.txt
```

---

## PASSO 7: DEPLOY!

1. Clique em **"Deploy"**
2. Aguarde build (2-5 minutos)
3. Railway gera URL automaticamente:
   ```
   https://calcula-facil-production.up.railway.app
   ```

---

## PASSO 8: TESTAR BACKEND

**Health Check:**
```bash
curl https://SEU-BACKEND.railway.app/api/health
```

**Resposta esperada:**
```json
{
  "status": "healthy",
  "service": "calcula-facil"
}
```

---

## PASSO 9: CONECTAR FRONTEND (VERCEL) COM BACKEND (RAILWAY)

### **No Vercel:**

1. Vá em **Settings → Environment Variables**
2. Adicione:

```
REACT_APP_BACKEND_URL=https://SEU-BACKEND.railway.app
```

3. **Importante:** Redeploy do frontend!
   - Vercel → Deployments → último deploy → **"Redeploy"**

---

## PASSO 10: ATUALIZAR CORS NO BACKEND

**No Railway → Variables:**

```bash
CORS_ORIGINS=https://calculafacil.vercel.app,http://localhost:3000
```

Isso permite que o frontend (Vercel) chame o backend (Railway).

---

## ✅ CHECKLIST FINAL

- [ ] Railway projeto criado
- [ ] Root Directory = `backend`
- [ ] MongoDB adicionado
- [ ] Variáveis de ambiente configuradas
- [ ] Start command configurado
- [ ] Deploy realizado com sucesso
- [ ] URL do backend funcionando
- [ ] Vercel tem variável REACT_APP_BACKEND_URL
- [ ] Vercel redeployado
- [ ] CORS configurado
- [ ] Teste de login funcionando

---

## 🎯 RESULTADO FINAL

**Frontend:**
- URL: https://calculafacil.vercel.app
- Hospedado: Vercel
- Atualiza automaticamente: Sim (GitHub push)

**Backend:**
- URL: https://calcula-facil-production.up.railway.app
- Hospedado: Railway
- MongoDB: Incluído
- Atualiza automaticamente: Sim (GitHub push)

---

## 🐛 TROUBLESHOOTING

### Backend não inicia:

```bash
# Ver logs no Railway
Railway Dashboard → Deployments → View Logs

# Erros comuns:
- MONGO_URL não configurado
- requirements.txt faltando dependência
- server.py com erro
```

### Frontend não conecta:

```bash
# Verificar no Browser Console (F12)
Network → XHR → Verificar chamadas API

# Erro CORS:
- Adicionar URL do Vercel no CORS_ORIGINS do backend
```

### MongoDB não conecta:

```bash
# Verificar variável
echo $MONGO_URL

# Deve ter formato:
mongodb://usuario:senha@host:porta/database
```

---

## 💰 CUSTO

**Vercel:**
- Grátis (Hobby plan)
- Sem cartão de crédito necessário

**Railway:**
- $5 grátis/mês (trial)
- Depois: ~$10-20/mês (Pay as you go)
- MongoDB incluído

**Total:** $0 no primeiro mês, $10-20 depois

---

## 🚀 ALTERNATIVAS AO RAILWAY

Se preferir outras opções:

### **Render.com:**
- Similar ao Railway
- $0/mês (free tier com limitações)
- MongoDB não incluído (usar MongoDB Atlas)

### **Fly.io:**
- Bom para Python
- $0/mês (free tier)
- PostgreSQL grátis (MongoDB precisa Atlas)

### **Heroku:**
- Clássico, mas não tem mais free tier
- ~$7/mês

---

**Pronto para começar?** 🚀

Me avise quando:
1. Criar conta no Railway
2. Precisar de ajuda em algum passo
3. Quiser que eu configure algo

Estou aqui para te guiar! 💪
