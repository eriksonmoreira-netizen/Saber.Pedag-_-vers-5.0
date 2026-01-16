import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { MercadoPagoConfig, Preference, Payment } from 'mercadopago';
// @ts-ignore
import { PrismaClient } from '@prisma/client';

// Configuração de ambiente
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PORT = process.env.PORT || 3000;
const ACCESS_TOKEN = process.env.MP_ACCESS_TOKEN || '';

const app = express();

// Inicialização do Prisma com Log para Debug na Hostinger
const prisma = new PrismaClient({
  log: ['query', 'info', 'warn', 'error'],
});

// Teste de conexão ao iniciar
prisma.$connect()
  .then(() => console.log('✅ Conectado ao MySQL (Hostinger) com sucesso.'))
  .catch((e: any) => console.error('❌ Erro ao conectar ao banco de dados:', e));

// Configuração Mercado Pago
const client = new MercadoPagoConfig({ accessToken: ACCESS_TOKEN });

// Middlewares
app.use(cors() as any);
app.use(express.json() as any);

// --- ROTAS DA API ---

// 1. Criar Preferência de Pagamento (Checkout)
app.post('/api/checkout', async (req, res) => {
  try {
    const { planId, title, price, userId, email } = req.body;

    const preference = new Preference(client);
    const result = await preference.create({
      body: {
        items: [
          {
            id: planId,
            title: title,
            quantity: 1,
            unit_price: Number(price),
            currency_id: 'BRL',
          },
        ],
        payer: {
          email: email || 'customer@email.com',
        },
        external_reference: userId, // Vincula o pagamento ao ID do usuário
        back_urls: {
          success: `${req.protocol}://${req.get('host')}/sucesso`,
          failure: `${req.protocol}://${req.get('host')}/erro`,
          pending: `${req.protocol}://${req.get('host')}/pendente`,
        },
        auto_return: 'approved',
        notification_url: `${req.protocol}://${req.get('host')}/api/webhook`, // URL pública necessária
      },
    });

    res.json({ init_point: result.init_point });
  } catch (error) {
    console.error('Erro MP:', error);
    res.status(500).json({ error: 'Erro ao criar pagamento' });
  }
});

// 2. Webhook (Receber notificação de pagamento)
app.post('/api/webhook', async (req, res) => {
  const { type, data } = req.body;

  try {
    if (type === 'payment') {
      const payment = new Payment(client);
      const paymentInfo = await payment.get({ id: data.id });

      if (paymentInfo.status === 'approved') {
        const userId = paymentInfo.external_reference;
        const items = paymentInfo.additional_info?.items;
        const planId = items && items.length > 0 ? items[0].id : 'MESTRE';

        if (userId) {
          console.log(`💰 Pagamento aprovado para User: ${userId}, Plano: ${planId}`);
          
          // Atualiza plano no banco
          await prisma.user.update({
            where: { id: userId },
            data: { plan: planId }
          });
        }
      }
    }
    res.sendStatus(200);
  } catch (error) {
    console.error('Webhook Error:', error);
    res.sendStatus(500);
  }
});

// 3. Sincronização de Usuário (Auth)
app.post('/api/auth/sync', async (req, res) => {
  try {
    const { email, full_name, photo_url, id } = req.body;
    
    // Regra de Super Admin Hardcoded
    const isMaster = email === 'erikson.moreira@gmail.com';

    const user = await prisma.user.upsert({
      where: { email },
      update: {
        last_login: new Date(),
        ...(isMaster ? { role: 'SUPER_ADM', plan: 'GESTOR' } : {})
      },
      create: {
        id: id || undefined,
        email,
        full_name,
        photo_url,
        role: isMaster ? 'SUPER_ADM' : 'TEACHER',
        plan: isMaster ? 'GESTOR' : 'SEMENTE'
      }
    });

    res.json(user);
  } catch (error) {
    console.error('Auth Sync Error:', error);
    res.status(500).json({ error: 'Database sync failed' });
  }
});

// --- SERVIR FRONTEND (VITE BUILD) ---
// Serve arquivos estáticos da pasta 'dist' (gerada pelo vite build)
// O cast para 'any' evita conflitos de tipagem estrita no setup híbrido
app.use(express.static(path.join(__dirname, '../dist')) as any);

// Fallback para SPA (React Router)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../dist', 'index.html'));
});

// Inicialização
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`💳 Mercado Pago Integration Active`);
});