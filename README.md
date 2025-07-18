# PDV Auto Atendimento - Sistema de Ponto de Venda

Sistema de Ponto de Venda (PDV) para mercadinho de auto atendimento, otimizado para tablets com design mobile-first e funcionalidade PWA.

## 🚀 Funcionalidades Implementadas

### Fase 1 - Core MVP ✅
- ✅ Interface principal com produtos e categorias
- ✅ Carrinho de compras funcional
- ✅ Design responsivo e PWA
- ✅ Checkout básico

### Fase 2 - Pagamentos ✅
- ✅ Integração com Mercado Pago
- ✅ Pagamentos via PIX (Checkout Transparente)
- ✅ Pagamentos via Cartão (Mercado Point)
- ✅ Validação de usuários com desconto
- ✅ Sistema de confirmação de pedidos

## 🛠️ Tecnologias Utilizadas

- **Frontend**: React 18 + TypeScript
- **Estado**: Zustand
- **Estilização**: Tailwind CSS
- **PWA**: Vite PWA Plugin
- **Pagamentos**: Mercado Pago API
- **Ícones**: Lucide React

## 📱 Funcionalidades de Pagamento

### PIX
- QR Code gerado automaticamente
- Código PIX copiável
- Polling automático para verificar status
- Timer de expiração (5 minutos)

### Cartão (Crédito/Débito)
- Integração com terminal Mercado Point
- Processamento em tempo real
- Instruções visuais para o usuário
- Verificação automática de status

### Sistema de Descontos
- Validação automática por telefone
- Funcionários: até 20% de desconto
- Moradores: até 10% de desconto
- Aplicação automática no checkout

## 🔧 Configuração

### 1. Variáveis de Ambiente

Copie o arquivo `.env.example` para `.env` e configure:

```env
# Mercado Pago - Credenciais PIX
VITE_MERCADO_PAGO_ACCESS_TOKEN=seu_access_token_aqui
VITE_MERCADO_PAGO_PUBLIC_KEY=sua_public_key_aqui

# Mercado Pago - Terminal Point (Cartão)
VITE_MERCADO_PAGO_DEVICE_ID=seu_device_id_aqui
VITE_MERCADO_PAGO_USER_ID=seu_user_id_aqui

# Ambiente (sandbox/production)
VITE_MERCADO_PAGO_ENV=sandbox
```

### 2. Credenciais Mercado Pago

#### Para PIX (Checkout Transparente):
1. Acesse o [Dashboard do Mercado Pago](https://www.mercadopago.com.br/developers/panel)
2. Vá em "Suas integrações" > "Checkout Transparente"
3. Copie o **Access Token**

#### Para Cartão (Mercado Point):
1. Configure um terminal Point físico
2. Obtenha o **Device ID** do terminal
3. Configure o **User ID** da conta

### 3. Instalação

```bash
# Instalar dependências
npm install

# Executar em desenvolvimento
npm run dev

# Build para produção
npm run build
```

## 📊 Fluxo de Pagamento

### PIX
1. Cliente finaliza pedido
2. Sistema gera QR Code via API Mercado Pago
3. Cliente escaneia ou copia código PIX
4. Sistema monitora status automaticamente
5. Confirmação instantânea

### Cartão
1. Cliente escolhe cartão (crédito/débito)
2. Sistema cria intenção de pagamento no Point
3. Terminal Point processa transação
4. Sistema verifica status via polling
5. Confirmação automática

## 🔒 Segurança

- Todas as transações via HTTPS
- Tokens de acesso seguros
- Validação de dados no frontend e backend
- Logs de transações para auditoria

## 📱 PWA Features

- Instalável como app nativo
- Funciona offline (produtos em cache)
- Otimizado para tablets
- Interface touch-friendly

## 🎨 Design System

- **Cores**: Gradientes azuis com glassmorphism
- **Tipografia**: Inter font
- **Componentes**: Cards translúcidos, botões com hover
- **Responsividade**: Mobile-first design

## 📈 Próximas Fases

### Fase 3 - Admin Panel
- [ ] Painel administrativo
- [ ] CRUD de produtos e categorias
- [ ] Gestão de usuários
- [ ] Relatórios de vendas

### Fase 4 - Melhorias
- [ ] Relatórios avançados
- [ ] Notificações push
- [ ] Backup automático
- [ ] Analytics detalhados

## 🤝 Contribuição

1. Fork o projeto
2. Crie uma branch para sua feature
3. Commit suas mudanças
4. Push para a branch
5. Abra um Pull Request

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.

## 📞 Suporte

Para dúvidas ou suporte:
- Email: suporte@o2digital.com.br
- WhatsApp: (48) 99904-3764

---

**Desenvolvido com ❤️ para facilitar o auto atendimento em mercadinhos**
