# Stripe Connect Implementation - Updated Plan

## Host Types Overview

BondVibe tendrá dos tipos de hosts:

### 1. Free Host (Host Gratuito)
- ✅ Puede crear eventos **sin costo** solamente
- ✅ No necesita conectar Stripe
- ✅ No paga comisión a BondVibe (eventos gratis)
- ✅ Puede **actualizar a Paid Host** cuando quiera

### 2. Paid Host (Host Pagado)
- ✅ Puede crear eventos **con costo**
- ✅ También puede crear eventos gratis si quiere
- ✅ **Debe** conectar cuenta de Stripe
- ✅ BondVibe cobra 5% de comisión en eventos pagados
- ✅ Recibe pagos directamente en su cuenta

---

## User Flow Actualizado

### Escenario 1: Usuario quiere ser Free Host

```
1. Usuario aplica para ser host
   ↓
2. Admin aprueba aplicación
   ↓
3. Pantalla: "¿Qué tipo de eventos crearás?"
   [  ] Solo eventos gratuitos (No necesitas Stripe)
   [✓] Eventos con costo (Requiere conectar Stripe)
   ↓
4. Usuario selecciona "Solo eventos gratuitos"
   ↓
5. ✅ Ya puede crear eventos gratis
   ↓
6. (Más tarde) Usuario quiere crear evento pagado
   ↓
7. App le muestra: "Para crear eventos pagados, conecta tu Stripe"
   ↓
8. Usuario conecta Stripe → Se convierte en Paid Host
```

### Escenario 2: Usuario quiere ser Paid Host desde inicio

```
1. Usuario aplica para ser host
   ↓
2. Admin aprueba aplicación
   ↓
3. Pantalla: "¿Qué tipo de eventos crearás?"
   [  ] Solo eventos gratuitos
   [✓] Eventos con costo (Requiere conectar Stripe)
   ↓
4. Usuario selecciona "Eventos con costo"
   ↓
5. Redirigido a Stripe Onboarding inmediatamente
   ↓
6. Completa verificación en Stripe
   ↓
7. ✅ Ya puede crear eventos pagados y gratis
```

---

## Modelo de Datos (Firestore)

### users collection - Host Document

```javascript
{
  userId: "abc123",
  email: "host@example.com",
  fullName: "Juan Pérez",
  role: "host",
  
  // NEW: Host configuration
  hostConfig: {
    type: "free" | "paid",  // Tipo de host
    canCreatePaidEvents: false,  // true solo si type="paid" Y Stripe conectado
    createdAt: "2025-12-21T...",
    updatedAt: "2025-12-21T..."
  },
  
  // Stripe Connect info (solo si type="paid")
  stripeConnect: {
    accountId: "acct_XXXXXXXXXX",
    status: "pending" | "active" | "rejected" | "restricted",
    onboardingCompleted: true,
    chargesEnabled: true,
    payoutsEnabled: true,
    detailsSubmitted: true,
    lastUpdated: "2025-12-21T...",
    // URLs de onboarding
    onboardingUrl: null,  // Se genera cuando lo necesita
    dashboardUrl: "https://dashboard.stripe.com/..."
  }
}
```

---

## Reglas de Negocio

### Creación de Eventos

| Host Type | Evento Gratis | Evento Pagado |
|-----------|---------------|---------------|
| Free Host | ✅ Permitido | ❌ Bloqueado (mostrar modal "Conecta Stripe") |
| Paid Host (Stripe no conectado) | ✅ Permitido | ❌ Bloqueado (mostrar "Completa verificación") |
| Paid Host (Stripe conectado) | ✅ Permitido | ✅ Permitido |

### Validaciones

```javascript
// Al crear evento
const canCreatePaidEvent = (host, eventPrice) => {
  // Evento gratis → Cualquier host puede
  if (eventPrice === 0) return true;
  
  // Evento pagado → Requiere Paid Host con Stripe activo
  if (eventPrice > 0) {
    return host.hostConfig?.type === 'paid' 
      && host.stripeConnect?.status === 'active'
      && host.stripeConnect?.chargesEnabled === true;
  }
};
```

---

## Implementación por Fases

### Fase 0: Actualizar modelo de datos ✅
**Duración**: 0.5 día

**Backend**:
1. Agregar campo `hostConfig` al documento de usuario
2. Migración de hosts existentes:
   ```javascript
   // Migration script
   const migrateExistingHosts = async () => {
     const hosts = await db.collection('users')
       .where('role', '==', 'host')
       .get();
     
     for (const doc of hosts.docs) {
       await doc.ref.update({
         hostConfig: {
           type: 'free',  // Por defecto, hosts existentes son free
           canCreatePaidEvents: false,
           createdAt: new Date().toISOString(),
           updatedAt: new Date().toISOString()
         }
       });
     }
   };
   ```

**Frontend**:
1. Actualizar interfaces TypeScript
2. Actualizar validaciones de creación de eventos

---

### Fase 1: Configuración de Stripe Connect
**Duración**: 1 día

**Tareas**:
1. [ ] Ir a Stripe Dashboard → Settings → Connect
2. [ ] Activar Stripe Connect
3. [ ] Configurar aplicación:
   - Brand name: "BondVibe"
   - Brand logo
   - Support email
4. [ ] Obtener `client_id` de Connect (empieza con `ca_`)
5. [ ] Configurar Redirect URLs:
   - Success: `https://bondvibe.app/stripe/connect/success`
   - Failure: `https://bondvibe.app/stripe/connect/failure`
   - Refresh: `https://bondvibe.app/stripe/connect/refresh`
6. [ ] Guardar `client_id` en Firebase Functions secrets:
   ```bash
   firebase functions:secrets:set STRIPE_CONNECT_CLIENT_ID
   ```

---

### Fase 2: Backend - Onboarding de Hosts
**Duración**: 2-3 días

#### 2.1 Cloud Function: `createConnectAccount`

```javascript
/**
 * Creates a Stripe Connect Standard Account for a host
 * Called when host selects "Paid Events" option
 */
exports.createConnectAccount = onRequest(
  {cors: true, secrets: [stripeSecretKey]},
  async (req, res) => {
    // Verify user is authenticated
    const userId = req.body.userId;
    const email = req.body.email;
    
    // Check if already has account
    const userDoc = await db.collection('users').doc(userId).get();
    if (userDoc.data().stripeConnect?.accountId) {
      return res.status(400).json({
        error: 'User already has a Stripe Connect account'
      });
    }
    
    // Create Stripe Connect Account (Standard)
    const stripe = require('stripe')(stripeSecretKey.value());
    const account = await stripe.accounts.create({
      type: 'standard',
      email: email,
      metadata: {
        userId: userId,
        platform: 'bondvibe'
      }
    });
    
    // Save to Firestore
    await db.collection('users').doc(userId).update({
      'hostConfig.type': 'paid',
      'hostConfig.canCreatePaidEvents': false,  // Still needs onboarding
      'hostConfig.updatedAt': new Date().toISOString(),
      stripeConnect: {
        accountId: account.id,
        status: 'pending',
        onboardingCompleted: false,
        chargesEnabled: false,
        payoutsEnabled: false,
        detailsSubmitted: false,
        lastUpdated: new Date().toISOString()
      }
    });
    
    res.json({
      success: true,
      accountId: account.id
    });
  }
);
```

#### 2.2 Cloud Function: `createAccountLink`

```javascript
/**
 * Generates Stripe onboarding URL for host
 */
exports.createAccountLink = onRequest(
  {cors: true, secrets: [stripeSecretKey]},
  async (req, res) => {
    const userId = req.body.userId;
    
    // Get user's Stripe account
    const userDoc = await db.collection('users').doc(userId).get();
    const accountId = userDoc.data().stripeConnect?.accountId;
    
    if (!accountId) {
      return res.status(400).json({error: 'No Stripe account found'});
    }
    
    const stripe = require('stripe')(stripeSecretKey.value());
    
    // Create account link
    const accountLink = await stripe.accountLinks.create({
      account: accountId,
      refresh_url: 'https://bondvibe.app/stripe/connect/refresh',
      return_url: 'https://bondvibe.app/stripe/connect/success',
      type: 'account_onboarding',
    });
    
    // Save URL to Firestore (expires in 5 minutes)
    await db.collection('users').doc(userId).update({
      'stripeConnect.onboardingUrl': accountLink.url,
      'stripeConnect.lastUpdated': new Date().toISOString()
    });
    
    res.json({
      url: accountLink.url
    });
  }
);
```

#### 2.3 Cloud Function: `getAccountStatus`

```javascript
/**
 * Check Stripe account status
 */
exports.getAccountStatus = onRequest(
  {cors: true, secrets: [stripeSecretKey]},
  async (req, res) => {
    const userId = req.body.userId;
    
    const userDoc = await db.collection('users').doc(userId).get();
    const accountId = userDoc.data().stripeConnect?.accountId;
    
    if (!accountId) {
      return res.status(404).json({error: 'No Stripe account'});
    }
    
    const stripe = require('stripe')(stripeSecretKey.value());
    const account = await stripe.accounts.retrieve(accountId);
    
    // Update Firestore
    const canCreatePaidEvents = 
      account.charges_enabled && 
      account.payouts_enabled && 
      account.details_submitted;
    
    await db.collection('users').doc(userId).update({
      'hostConfig.canCreatePaidEvents': canCreatePaidEvents,
      'stripeConnect.status': account.charges_enabled ? 'active' : 'pending',
      'stripeConnect.chargesEnabled': account.charges_enabled,
      'stripeConnect.payoutsEnabled': account.payouts_enabled,
      'stripeConnect.detailsSubmitted': account.details_submitted,
      'stripeConnect.onboardingCompleted': account.details_submitted,
      'stripeConnect.lastUpdated': new Date().toISOString()
    });
    
    res.json({
      status: account.charges_enabled ? 'active' : 'pending',
      chargesEnabled: account.charges_enabled,
      payoutsEnabled: account.payouts_enabled,
      canCreatePaidEvents: canCreatePaidEvents
    });
  }
);
```

#### 2.4 Webhook Handler: `account.updated`

```javascript
/**
 * Stripe webhook for account updates
 */
exports.stripeWebhook = onRequest(
  {cors: true, secrets: [stripeSecretKey, stripeWebhookSecret]},
  async (req, res) => {
    const stripe = require('stripe')(stripeSecretKey.value());
    const sig = req.headers['stripe-signature'];
    
    let event;
    try {
      event = stripe.webhooks.constructEvent(
        req.rawBody,
        sig,
        stripeWebhookSecret.value()
      );
    } catch (err) {
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }
    
    // Handle account.updated event
    if (event.type === 'account.updated') {
      const account = event.data.object;
      
      // Find user with this account
      const usersSnapshot = await db.collection('users')
        .where('stripeConnect.accountId', '==', account.id)
        .get();
      
      if (usersSnapshot.empty) {
        return res.status(404).send('User not found');
      }
      
      const userDoc = usersSnapshot.docs[0];
      const canCreatePaidEvents = 
        account.charges_enabled && 
        account.payouts_enabled && 
        account.details_submitted;
      
      await userDoc.ref.update({
        'hostConfig.canCreatePaidEvents': canCreatePaidEvents,
        'stripeConnect.status': account.charges_enabled ? 'active' : 'pending',
        'stripeConnect.chargesEnabled': account.charges_enabled,
        'stripeConnect.payoutsEnabled': account.payouts_enabled,
        'stripeConnect.detailsSubmitted': account.details_submitted,
        'stripeConnect.onboardingCompleted': account.details_submitted,
        'stripeConnect.lastUpdated': new Date().toISOString()
      });
      
      console.log(`✅ Updated account status for user: ${userDoc.id}`);
    }
    
    res.json({received: true});
  }
);
```

---

### Fase 3: Backend - Pagos con Connect
**Duración**: 1-2 días

#### 3.1 Modificar `createEventPaymentIntent`

```javascript
/**
 * Create Payment Intent with Stripe Connect
 */
exports.createEventPaymentIntent = onRequest(
  {cors: true, secrets: [stripeSecretKey]},
  async (req, res) => {
    const {eventId, userId, amount} = req.body;
    
    // Get event and host info
    const eventDoc = await db.collection('events').doc(eventId).get();
    const eventData = eventDoc.data();
    const hostId = eventData.createdBy;
    
    // Get host's Stripe account
    const hostDoc = await db.collection('users').doc(hostId).get();
    const stripeAccountId = hostDoc.data().stripeConnect?.accountId;
    
    if (!stripeAccountId) {
      return res.status(400).json({
        error: 'Host has not connected Stripe account'
      });
    }
    
    const split = calculateEventSplit(amount);
    const stripe = require('stripe')(stripeSecretKey.value());
    
    // Create Payment Intent with application_fee
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amount,
      currency: 'mxn',
      application_fee_amount: split.platformFee,  // 5% goes to BondVibe
      transfer_data: {
        destination: stripeAccountId,  // 95% goes to host
      },
      metadata: {
        type: 'event_ticket',
        eventId: eventId,
        eventTitle: eventData.title,
        userId: userId,
        hostId: hostId,
        platformFee: split.platformFee,
        hostReceives: split.hostReceives,
      },
      description: `Ticket for ${eventData.title}`,
    });
    
    console.log('✅ Payment Intent created with Connect:', paymentIntent.id);
    
    res.json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
      split: split,
    });
  }
);
```

#### 3.2 Modificar `createTipPaymentIntent`

```javascript
/**
 * Create Tip Payment Intent (100% to host)
 */
exports.createTipPaymentIntent = onRequest(
  {cors: true, secrets: [stripeSecretKey]},
  async (req, res) => {
    const {hostId, eventId, amount, message, userId} = req.body;
    
    // Get host's Stripe account
    const hostDoc = await db.collection('users').doc(hostId).get();
    const stripeAccountId = hostDoc.data().stripeConnect?.accountId;
    
    if (!stripeAccountId) {
      return res.status(400).json({
        error: 'Host has not connected Stripe account'
      });
    }
    
    const stripe = require('stripe')(stripeSecretKey.value());
    
    // Tip goes 100% to host (no platform fee)
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amount,
      currency: 'mxn',
      application_fee_amount: 0,  // No fee on tips
      transfer_data: {
        destination: stripeAccountId,  // 100% to host
      },
      metadata: {
        type: 'tip',
        hostId: hostId,
        eventId: eventId || '',
        userId: userId,
        message: message || '',
      },
      description: 'Tip for host',
    });
    
    res.json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
    });
  }
);
```

---

### Fase 4: Frontend - UI para Hosts
**Duración**: 2-3 días

#### 4.1 Pantalla de Selección de Tipo de Host

**Ubicación**: Después de que admin aprueba al host

```typescript
// screens/HostTypeSelection.tsx

const HostTypeSelectionScreen = () => {
  const [selectedType, setSelectedType] = useState<'free' | 'paid'>(null);
  
  const handleContinue = async () => {
    if (selectedType === 'free') {
      // Update user to free host
      await updateDoc(userRef, {
        'hostConfig.type': 'free',
        'hostConfig.canCreatePaidEvents': false
      });
      navigation.navigate('Home');
    } else if (selectedType === 'paid') {
      // Create Stripe Connect account and redirect to onboarding
      const response = await createConnectAccount(userId, email);
      const linkResponse = await createAccountLink(userId);
      Linking.openURL(linkResponse.url);
    }
  };
  
  return (
    <View>
      <Text>¿Qué tipo de eventos crearás?</Text>
      
      <TouchableOpacity 
        onPress={() => setSelectedType('free')}
        style={selectedType === 'free' ? styles.selected : styles.option}
      >
        <Text>Solo eventos gratuitos</Text>
        <Text>No necesitas conectar Stripe</Text>
      </TouchableOpacity>
      
      <TouchableOpacity 
        onPress={() => setSelectedType('paid')}
        style={selectedType === 'paid' ? styles.selected : styles.option}
      >
        <Text>Eventos con costo</Text>
        <Text>Requiere conectar cuenta de Stripe</Text>
      </TouchableOpacity>
      
      <Button onPress={handleContinue} disabled={!selectedType}>
        Continuar
      </Button>
    </View>
  );
};
```

#### 4.2 Validación al Crear Evento

```typescript
// screens/CreateEvent.tsx

const CreateEventScreen = () => {
  const [eventPrice, setEventPrice] = useState(0);
  const user = useUser();
  
  const canCreatePaidEvent = 
    user.hostConfig?.type === 'paid' &&
    user.hostConfig?.canCreatePaidEvents === true;
  
  const handlePriceChange = (price: number) => {
    if (price > 0 && !canCreatePaidEvent) {
      // Show modal to connect Stripe
      Alert.alert(
        'Conecta tu cuenta de Stripe',
        'Para crear eventos con costo, necesitas conectar tu cuenta de Stripe.',
        [
          {text: 'Cancelar'},
          {text: 'Conectar Stripe', onPress: () => navigateToStripeConnect()}
        ]
      );
      return;
    }
    setEventPrice(price);
  };
  
  return (
    <View>
      <TextInput
        placeholder="Precio del evento (0 = gratis)"
        keyboardType="numeric"
        onChangeText={(text) => handlePriceChange(parseInt(text))}
      />
      {/* Rest of form */}
    </View>
  );
};
```

#### 4.3 Pantalla de Status de Stripe

```typescript
// screens/StripeStatus.tsx

const StripeStatusScreen = () => {
  const user = useUser();
  const stripeStatus = user.stripeConnect?.status;
  
  const handleRefreshStatus = async () => {
    await getAccountStatus(user.uid);
    // Refresh user data
  };
  
  const handleReconnect = async () => {
    const response = await createAccountLink(user.uid);
    Linking.openURL(response.url);
  };
  
  return (
    <View>
      {stripeStatus === 'active' ? (
        <>
          <Icon name="check-circle" color="green" />
          <Text>Cuenta de Stripe conectada</Text>
          <Text>Puedes crear eventos con costo</Text>
        </>
      ) : stripeStatus === 'pending' ? (
        <>
          <Icon name="clock" color="orange" />
          <Text>Verificación pendiente</Text>
          <Text>Completa tu verificación en Stripe</Text>
          <Button onPress={handleReconnect}>
            Completar verificación
          </Button>
        </>
      ) : (
        <>
          <Icon name="alert-circle" color="red" />
          <Text>Stripe no conectado</Text>
          <Button onPress={handleReconnect}>
            Conectar Stripe
          </Button>
        </>
      )}
      
      <Button onPress={handleRefreshStatus}>
        Actualizar estado
      </Button>
    </View>
  );
};
```

---

### Fase 5: Testing
**Duración**: 1-2 días

#### Test Cases

1. **Free Host Flow**
   - [ ] Usuario se hace Free Host
   - [ ] Puede crear evento gratis
   - [ ] NO puede crear evento pagado (muestra modal)
   - [ ] Puede actualizar a Paid Host
   
2. **Paid Host Flow**
   - [ ] Usuario se hace Paid Host
   - [ ] Redirige a Stripe onboarding
   - [ ] Completa verificación
   - [ ] Status se actualiza a "active"
   - [ ] Puede crear eventos pagados
   
3. **Payment Flow**
   - [ ] Usuario compra ticket de evento pagado
   - [ ] Host recibe 95% en su Stripe
   - [ ] BondVibe recibe 5% platform fee
   - [ ] Payment Intent tiene `transfer_data`

4. **Edge Cases**
   - [ ] Host intenta crear evento pagado sin Stripe
   - [ ] Onboarding link expira (refresh)
   - [ ] Stripe rechaza cuenta del host
   - [ ] Usuario cancela onboarding

---

## Deployment Checklist

### Secrets to Configure
```bash
firebase functions:secrets:set STRIPE_SECRET_KEY
firebase functions:secrets:set STRIPE_CONNECT_CLIENT_ID
firebase functions:secrets:set STRIPE_WEBHOOK_SECRET
```

### Stripe Dashboard Setup
1. Enable Stripe Connect
2. Configure branding
3. Set redirect URLs
4. Configure webhooks:
   - `account.updated`
   - `account.application.deauthorized`

### Firestore Security Rules
```javascript
match /users/{userId} {
  // Only user can update their own hostConfig
  allow update: if request.auth.uid == userId 
    && (!request.resource.data.diff(resource.data).affectedKeys()
        .hasAny(['role', 'email', 'stripeConnect.accountId']));
}
```

---

## Next Steps

1. ✅ Review this plan
2. Activate Stripe Connect in dashboard
3. Implement Fase 0 (data model migration)
4. Implement Fase 1 (Stripe config)
5. Implement Fase 2 (Backend onboarding)
6. Test with Stripe test mode
7. Implement Fase 3 (Payments)
8. Implement Fase 4 (UI)
9. End-to-end testing
10. Merge to main

---

**¿Listo para empezar con Fase 0 (migración de datos)?** 🚀
