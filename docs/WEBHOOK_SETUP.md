# Configuração de Webhooks - Mercado Pago

## O que são Webhooks?

Webhooks são notificações automáticas que o Mercado Pago envia para seu sistema quando o status de um pagamento muda. Isso permite que você seja notificado instantaneamente sobre aprovações, rejeições ou cancelamentos.

## Por que usar Webhooks?

- **Tempo Real**: Receba notificações instantâneas
- **Confiabilidade**: Não dependa apenas de polling
- **Eficiência**: Reduza consultas desnecessárias à API
- **Experiência**: Melhore a experiência do usuário

## Configuração

### 1. Endpoint no Servidor

Você precisará criar um endpoint em seu servidor para receber as notificações:

```javascript
// Exemplo em Node.js/Express
app.post('/webhook/mercadopago', (req, res) => {
  const { type, data } = req.body
  
  if (type === 'payment') {
    const paymentId = data.id
    
    // Processar notificação de pagamento
    processPaymentNotification(paymentId)
  }
  
  res.status(200).send('OK')
})
```

### 2. Configuração no Mercado Pago

1. Acesse o [Painel do Desenvolvedor](https://www.mercadopago.com.br/developers/panel)
2. Vá em sua aplicação
3. Configure o webhook:
   - **URL**: `https://seudominio.com/webhook/mercadopago`
   - **Eventos**: `payment`

### 3. Configuração no Sistema

No painel administrativo:
1. Vá em Configurações → Mercado Pago
2. Configure a "Webhook URL"
3. Salve as configurações

## Estrutura da Notificação

```json
{
  "id": 12345,
  "live_mode": true,
  "type": "payment",
  "date_created": "2023-01-01T10:00:00.000-04:00",
  "application_id": 123456789,
  "user_id": 987654321,
  "version": 1,
  "api_version": "v1",
  "action": "payment.updated",
  "data": {
    "id": "1234567890"
  }
}
```

## Validação de Segurança

Para garantir que a notificação veio realmente do Mercado Pago:

```javascript
const crypto = require('crypto')

function validateWebhook(req) {
  const signature = req.headers['x-signature']
  const requestId = req.headers['x-request-id']
  
  // Validar assinatura
  const expectedSignature = crypto
    .createHmac('sha256', 'seu_webhook_secret')
    .update(JSON.stringify(req.body))
    .digest('hex')
  
  return signature === expectedSignature
}
```

## Processamento Recomendado

```javascript
async function processPaymentNotification(paymentId) {
  try {
    // 1. Buscar detalhes do pagamento na API
    const payment = await mercadoPagoAPI.getPayment(paymentId)
    
    // 2. Encontrar pedido no sistema
    const order = await findOrderByPaymentId(paymentId)
    
    if (order) {
      // 3. Atualizar status do pedido
      await updateOrderStatus(order.id, payment.status)
      
      // 4. Notificar cliente (email, SMS, etc.)
      if (payment.status === 'approved') {
        await notifyCustomer(order.customer, 'payment_approved')
      }
    }
  } catch (error) {
    console.error('Error processing webhook:', error)
  }
}
```

## Retry e Idempotência

O Mercado Pago pode enviar a mesma notificação múltiplas vezes. Implemente idempotência:

```javascript
const processedNotifications = new Set()

app.post('/webhook/mercadopago', (req, res) => {
  const notificationId = req.body.id
  
  // Verificar se já foi processada
  if (processedNotifications.has(notificationId)) {
    return res.status(200).send('Already processed')
  }
  
  // Processar notificação
  processPaymentNotification(req.body.data.id)
  
  // Marcar como processada
  processedNotifications.add(notificationId)
  
  res.status(200).send('OK')
})
```

## Monitoramento

### Logs Recomendados:
- Todas as notificações recebidas
- Tempo de processamento
- Erros de validação
- Falhas de processamento

### Métricas:
- Taxa de sucesso de webhooks
- Tempo médio de processamento
- Notificações duplicadas
- Falhas de validação

## Troubleshooting

### Webhook não está sendo recebido:
1. Verifique se a URL está acessível publicamente
2. Confirme que retorna status 200
3. Verifique logs do servidor
4. Teste com ferramentas como ngrok (desenvolvimento)

### Notificações duplicadas:
1. Implemente idempotência
2. Use cache para IDs processados
3. Verifique timeout do endpoint

### Falhas de validação:
1. Verifique assinatura do webhook
2. Confirme formato JSON válido
3. Valide headers obrigatórios

## Exemplo Completo

```javascript
const express = require('express')
const crypto = require('crypto')
const app = express()

app.use(express.json())

// Cache para evitar processamento duplicado
const processedNotifications = new Map()

app.post('/webhook/mercadopago', async (req, res) => {
  try {
    const { id, type, data } = req.body
    
    // Validar assinatura (recomendado)
    if (!validateWebhookSignature(req)) {
      return res.status(401).send('Invalid signature')
    }
    
    // Verificar se já foi processada
    if (processedNotifications.has(id)) {
      return res.status(200).send('Already processed')
    }
    
    // Processar apenas notificações de pagamento
    if (type === 'payment') {
      await processPaymentNotification(data.id)
      
      // Marcar como processada
      processedNotifications.set(id, Date.now())
      
      // Limpar cache antigo (opcional)
      cleanOldNotifications()
    }
    
    res.status(200).send('OK')
  } catch (error) {
    console.error('Webhook error:', error)
    res.status(500).send('Internal error')
  }
})

function validateWebhookSignature(req) {
  // Implementar validação de assinatura
  return true // Simplificado para exemplo
}

async function processPaymentNotification(paymentId) {
  // Implementar processamento da notificação
  console.log(`Processing payment ${paymentId}`)
}

function cleanOldNotifications() {
  const oneHourAgo = Date.now() - (60 * 60 * 1000)
  
  for (const [id, timestamp] of processedNotifications) {
    if (timestamp < oneHourAgo) {
      processedNotifications.delete(id)
    }
  }
}

app.listen(3000, () => {
  console.log('Webhook server running on port 3000')
})
```

## URLs de Teste

Para desenvolvimento, você pode usar:
- **ngrok**: Para expor localhost publicamente
- **webhook.site**: Para testar recebimento de webhooks
- **requestbin**: Para debug de requisições

---

**💡 Dica**: Configure webhooks mesmo que não implemente processamento imediato. Você pode usar os logs para debug e implementar o processamento posteriormente.