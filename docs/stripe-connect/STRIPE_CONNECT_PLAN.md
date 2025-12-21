# Stripe Connect Implementation Plan

## Objetivo
Permitir que cada host reciba pagos directamente en su cuenta de Stripe, en lugar de que todo caiga en la cuenta principal de BondVibe.

## Arquitectura Actual vs. Nueva

### Actual (Problema)
```
Usuario paga ticket ($100 MXN)
    ↓
Stripe procesa pago
    ↓
Dinero va a cuenta de BondVibe (Carlos)
    ↓
BondVibe toma 5% comisión
    ↓
❌ Host NO recibe dinero automáticamente
```

### Nueva (Con Stripe Connect)
```
Usuario paga ticket ($100 MXN)
    ↓
Stripe procesa pago
    ↓
Stripe automáticamente hace split:
  - 95% ($95 MXN) → Cuenta del Host
  - 5% ($5 MXN) → Cuenta de BondVibe (platform fee)
    ↓
✅ Host recibe su dinero INMEDIATAMENTE
✅ BondVibe recibe comisión AUTOMÁTICAMENTE
```

## Stripe Connect - Tipos de Cuentas

Stripe Connect ofrece 3 tipos de cuentas:

### 1. Standard Accounts (✅ RECOMENDADO para BondVibe)
**Ventajas**:
- El host crea su propia cuenta de Stripe completa
- Host tiene acceso total a su dashboard de Stripe
- Host maneja sus propios refunds
- Host ve todo el historial de transacciones
- Menos responsabilidad legal para BondVibe

**Desventajas**:
- El host debe completar onboarding de Stripe
- Proceso de verificación puede tardar 1-2 días

**Flujo de pago**:
```
Usuario → Stripe → [95% al Host] + [5% a BondVibe]
```

### 2. Express Accounts
**Ventajas**:
- Onboarding más rápido
- Dashboard simplificado de Stripe

**Desventajas**:
- Menos control para el host
- BondVibe tiene más responsabilidad

### 3. Custom Accounts
**Ventajas**:
- Control total desde BondVibe

**Desventajas**:
- BondVibe es responsable de TODO (compliance, refunds, etc.)
- No recomendado para tu caso

## Recomendación: Standard Accounts

**Por qué Standard es mejor para BondVibe**:
1. El host maneja sus propios refunds (tú no tienes que intermediar)
2. Menos riesgo legal para ti
3. Host tiene transparencia total de sus ingresos
4. Stripe maneja la verificación de identidad del host

## Implementación - Fases

### Fase 1: Configuración de Stripe Connect
- [ ] Activar Stripe Connect en tu cuenta de Stripe
- [ ] Configurar aplicación Connect
- [ ] Obtener client_id de Connect

### Fase 2: Backend - Onboarding de Hosts
- [ ] Crear Cloud Function: `createConnectAccount`
  - Crea cuenta Connect para nuevo host
  - Guarda `stripeAccountId` en Firestore
- [ ] Crear Cloud Function: `createAccountLink`
  - Genera URL de onboarding para el host
  - Host completa verificación en Stripe
- [ ] Webhook para escuchar `account.updated`
  - Actualiza status del host en Firestore

### Fase 3: Backend - Pagos con Connect
- [ ] Modificar `createEventPaymentIntent`
  - Usar `transfer_data` para enviar dinero al host
  - O usar `application_fee` para cobrar comisión
- [ ] Modificar `createTipPaymentIntent`
  - Tips van 100% al host (sin comisión)

### Fase 4: Frontend - UI para Hosts
- [ ] Pantalla de "Conectar Stripe" en perfil de host
- [ ] Mostrar status de verificación
- [ ] Dashboard de ganancias del host
- [ ] Botón para re-onboarding si caduca el link

### Fase 5: Testing
- [ ] Modo test de Stripe Connect
- [ ] Probar flujo completo de onboarding
- [ ] Probar pago con split automático
- [ ] Probar refunds desde cuenta del host

## Modelo de Datos (Firestore)

### users collection (hosts)
```javascript
{
  userId: "abc123",
  role: "host",
  stripeConnect: {
    accountId: "acct_XXXXXXXXXX", // Stripe Connect Account ID
    status: "pending" | "active" | "rejected",
    onboardingCompleted: true/false,
    chargesEnabled: true/false,
    payoutsEnabled: true/false,
    lastUpdated: timestamp
  }
}
```

## Flujo de Usuario (Host)

### 1. Host aplica para ser host en BondVibe
```
Host completa aplicación → Admin aprueba → role = "host"
```

### 2. Host conecta su Stripe
```
Host va a "Configuración" → "Conectar Stripe"
    ↓
BondVibe llama createAccountLink()
    ↓
Host es redirigido a Stripe Onboarding
    ↓
Host completa verificación (ID, cuenta bancaria)
    ↓
Stripe webhook → BondVibe actualiza status
    ↓
✅ Host puede crear eventos pagados
```

### 3. Usuario compra ticket del evento del host
```
Usuario paga $100 MXN
    ↓
Stripe automáticamente:
  - Deposita $95 MXN en cuenta del host
  - Deposita $5 MXN en cuenta de BondVibe
    ↓
✅ Host ve el dinero en su Stripe Dashboard
```

### 4. Host necesita hacer refund
```
Host cancela evento
    ↓
Host hace refund desde SU Stripe Dashboard
    ↓
O BondVibe puede hacer refund programático
```

## Precios y Fees

### Stripe Fees (pagados por quien recibe el dinero)
- **Transacción estándar**: 3.6% + $3 MXN
- **Stripe Connect**: Sin costo adicional

### BondVibe Platform Fee
- **Eventos**: 5% del precio del ticket
- **Tips**: 0% (host recibe 100%)

### Ejemplo de cálculo:
```
Ticket: $100 MXN
Stripe fee: $6.6 MXN (3.6% + $3)
BondVibe fee: $5 MXN (5%)

Host recibe: $100 - $6.6 - $5 = $88.4 MXN
BondVibe recibe: $5 MXN
```

## Consideraciones de Seguridad

1. **Validación de hosts**
   - Solo hosts verificados pueden conectar Stripe
   - Verificar que `stripeAccountId` pertenece al host correcto

2. **Webhooks**
   - Verificar firma de webhooks de Stripe
   - Manejar eventos de cuenta suspendida/rechazada

3. **Refunds**
   - Solo el host puede hacer refund de sus eventos
   - O BondVibe con permiso del host

## Recursos

- [Stripe Connect Docs](https://stripe.com/docs/connect)
- [Standard Accounts Guide](https://stripe.com/docs/connect/standard-accounts)
- [Node.js Stripe Connect](https://stripe.com/docs/connect/enable-payment-acceptance-guide?platform=web&lang=node)

## Timeline Estimado

- Fase 1: Configuración (1 día)
- Fase 2: Backend Onboarding (2-3 días)
- Fase 3: Backend Pagos (1-2 días)
- Fase 4: Frontend UI (2-3 días)
- Fase 5: Testing (1-2 días)

**Total**: ~8-11 días de desarrollo

## Next Steps

1. ✅ Crear branch `feature/stripe-connect`
2. Activar Stripe Connect en dashboard
3. Implementar Fase 1 y 2
4. Testing con cuenta de prueba
5. Implementar UI
6. Testing end-to-end
7. Merge a main

