# Guia de Migração para Produção - Mercado Pago

## 📋 Checklist de Migração

### 1. Conta Mercado Pago
- [ ] Conta Mercado Pago verificada e aprovada
- [ ] Documentos empresariais enviados e aprovados
- [ ] Conta bancária vinculada e verificada
- [ ] Limites de transação adequados para seu negócio

### 2. Credenciais de Produção

#### Checkout Transparente (PIX)
1. Acesse o [Painel do Desenvolvedor](https://www.mercadopago.com.br/developers/panel)
2. Vá em "Suas integrações" → "Checkout Transparente"
3. **IMPORTANTE**: Mude para o ambiente "Produção" (não Sandbox)
4. Obtenha as credenciais:
   - **Access Token**: Começará com `APP_USR-` (não `TEST-`)
   - **Public Key**: Começará com `APP_USR-` (não `TEST-`)
   - **Client ID**: Número da aplicação
   - **Client Secret**: String alfanumérica

#### Point Terminal (Cartões)
1. Configure fisicamente o terminal Point
2. Vincule o terminal à sua conta no [Painel Point](https://www.mercadopago.com.br/point)
3. Obtenha as credenciais de produção:
   - **Access Token**: Específico para Point (começará com `APP_USR-`)
   - **Device ID**: ID único do seu terminal físico
   - **User ID**: ID do usuário proprietário do terminal
   - **Store ID**: ID da loja (opcional)

### 3. Configuração no Sistema

#### Passo 1: Acesse o Painel Administrativo
```
https://seudominio.com/admin
```

#### Passo 2: Vá para Configurações → Mercado Pago

#### Passo 3: Configure Checkout Transparente (PIX)
1. **Desative** a integração atual (botão "Desativar")
2. **Altere o ambiente** para "Production"
3. **Substitua as credenciais**:
   - Access Token: `APP_USR-xxxxxxxx-xxxxxxxx-xxxxxxxx-xxxxxxxx-xxxxxxxx`
   - Public Key: `APP_USR-xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx`
   - Client ID: `1234567890123456`
   - Client Secret: `xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`
4. **Salve** as configurações
5. **Teste** a conexão (botão "Testar")
6. **Ative** a integração (botão "Ativar")

#### Passo 4: Configure Point Terminal (Cartões)
1. **Desative** a integração atual (botão "Desativar")
2. **Altere o ambiente** para "Production"
3. **Substitua as credenciais**:
   - Access Token: `APP_USR-xxxxxxxx-xxxxxxxx-xxxxxxxx-xxxxxxxx-xxxxxxxx`
   - Device ID: `PAX_A910__SMARTPOS1234567890` (exemplo)
   - User ID: `987654321`
   - Store ID: `store_123456` (opcional)
4. **Salve** as configurações
5. **Teste** a conexão (botão "Testar")
6. **Ative** a integração (botão "Ativar")

### 4. Configuração de Webhooks (Recomendado)

#### Para receber notificações automáticas de pagamento:
1. Configure um endpoint em seu servidor: `https://seudominio.com/webhook/mercadopago`
2. No painel do Mercado Pago, configure o webhook para este endpoint
3. Adicione a URL no sistema: Configurações → Mercado Pago → Webhook URL

### 5. Testes de Produção

#### Teste PIX:
1. Faça um pedido real com valor baixo (R$ 0,01)
2. Pague via PIX usando seu próprio celular
3. Verifique se o pagamento é aprovado automaticamente
4. Confirme que o pedido muda para "aprovado" no sistema

#### Teste Cartão:
1. Use o terminal Point físico
2. Faça uma transação de teste com cartão real
3. Verifique se o pagamento é processado corretamente
4. Confirme a aprovação no sistema

### 6. Monitoramento

#### Logs de Transação:
- Todas as transações são registradas automaticamente
- Acesse via: Painel Admin → Configurações → Mercado Pago → Ver Logs

#### Verificações Diárias:
- [ ] Status das integrações (ativas/inativas)
- [ ] Últimos testes de conexão
- [ ] Transações pendentes
- [ ] Erros de pagamento

### 7. Backup e Segurança

#### Credenciais:
- **NUNCA** compartilhe suas credenciais de produção
- Mantenha backup seguro das credenciais
- Monitore acessos não autorizados

#### Dados:
- Configure backup automático dos dados de transação
- Mantenha logs de auditoria
- Monitore tentativas de fraude

## 🚨 Pontos Críticos

### Diferenças entre Sandbox e Produção:

| Aspecto | Sandbox | Produção |
|---------|---------|----------|
| Access Token | `TEST-xxxx` | `APP_USR-xxxx` |
| Public Key | `TEST-xxxx` | `APP_USR-xxxx` |
| Pagamentos | Simulados | Reais |
| Dinheiro | Fictício | Real |
| Webhooks | Opcionais | Recomendados |
| Monitoramento | Básico | Crítico |

### Validações Automáticas:
- O sistema valida automaticamente se as credenciais são de produção
- Tokens de sandbox não funcionarão em ambiente de produção
- Testes de conexão verificam a validade das credenciais

## 📞 Suporte

### Em caso de problemas:

1. **Verifique os logs** no painel administrativo
2. **Teste as conexões** usando os botões de teste
3. **Consulte a documentação** do Mercado Pago
4. **Entre em contato** com o suporte do Mercado Pago

### Links Úteis:
- [Documentação Mercado Pago](https://www.mercadopago.com.br/developers/pt/docs)
- [Painel do Desenvolvedor](https://www.mercadopago.com.br/developers/panel)
- [Suporte Mercado Pago](https://www.mercadopago.com.br/ajuda)
- [Status da API](https://status.mercadopago.com/)

## ✅ Checklist Final

Antes de colocar em produção, verifique:

- [ ] Credenciais de produção configuradas
- [ ] Ambiente alterado para "Production"
- [ ] Testes de conexão bem-sucedidos
- [ ] Integrações ativadas
- [ ] Transação de teste PIX realizada
- [ ] Transação de teste cartão realizada
- [ ] Webhooks configurados (se aplicável)
- [ ] Monitoramento ativo
- [ ] Backup das credenciais realizado
- [ ] Equipe treinada para operação

---

**⚠️ IMPORTANTE**: Após a migração para produção, todas as transações serão reais e envolverão dinheiro real. Certifique-se de que todos os testes foram realizados adequadamente no ambiente sandbox antes da migração.