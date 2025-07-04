# Account System Design for SaaS Transition

This document outlines the design for adding account-based authentication to support the transition to a SaaS model while preserving the existing PIN-based caretaker system.

## Overview

The account system introduces a new authentication layer that sits above the existing family structure, enabling:

1. **SaaS Account Management**: Email/password accounts that own families
2. **Preserved PIN Access**: Existing caretaker PIN system remains unchanged
3. **Streamlined UX**: Account holders get seamless access without PIN entry
4. **Simple Billing Integration**: Clear ownership model for future billing

## System Architecture

### Core Principle: Account = Family Owner

The design follows a simple ownership model where one account owns one family, avoiding complex multi-tenancy issues while enabling SaaS features.

```
┌─────────────────┐
│    ACCOUNTS     │  ← SaaS users (email/password)
│  - id           │
│  - email        │  
│  - password     │
│  - verified     │
│  - stripeId     │  (future billing)
└─────────────────┘
         │
         │ 1:1 (account owns family)
         ▼
┌─────────────────┐
│    FAMILIES     │  ← Existing family structure
│  - id           │
│  - accountId    │  ← NEW: Link to owning account
│  - slug         │
│  - name         │
└─────────────────┘
         │
         │ 1:M 
         ▼
┌─────────────────┐
│   CARETAKERS    │  ← Existing PIN system (unchanged)
│  - familyId     │
│  - accountId    │  ← NEW: Optional link to account
│  - loginId      │
│  - pin          │
│  - role         │  (USER/ADMIN)
└─────────────────┘
```

## Database Schema Changes

### 1. New Account Table

```prisma
model Account {
  id        String   @id @default(cuid())
  email     String   @unique
  password  String   // bcrypt hashed
  verified  Boolean  @default(false)
  stripeId  String?  // Future billing integration
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  
  // Relations
  family     Family?    @relation(fields: [familyId], references: [id])
  familyId   String?    @unique // One account owns one family
  caretaker  Caretaker? @relation(fields: [caretakerId], references: [id])
  caretakerId String?   @unique // Account linked to specific caretaker
  
  @@index([email])
}
```

### 2. Update Family Table

```prisma
model Family {
  // ... existing fields
  
  // Add account ownership
  account    Account? @relation
  accountId  String?  @unique // Family owned by account
  
  // ... existing relations
}
```

### 3. Update Caretaker Table

```prisma
model Caretaker {
  // ... existing fields
  
  // Add optional account link
  account    Account? @relation
  accountId  String?  @unique // Caretaker linked to account
  
  // ... existing relations
}
```

## Authentication Flows

### 1. Account Holder Authentication
```
Email/Password → Account → Linked Caretaker → Direct App Access
```

- No PIN required
- Seamless login experience
- Enhanced permissions as family owner

### 2. Regular Caretaker Authentication
```
Family Selection → PIN → Caretaker → App Access
```

- Existing flow unchanged
- PIN-based quick access preserved
- Standard family member permissions

### 3. System Administrator Authentication
```
Admin Password → System Access → Cross-Family Management
```

- Existing sysadmin system unchanged
- Separate from account authentication

## Enhanced Authentication Context

```typescript
interface AuthContext {
  familyId: string;
  role: 'USER' | 'ADMIN';
  
  // Authentication method
  authType: 'ACCOUNT' | 'CARETAKER' | 'SYSADMIN';
  
  // Identity (caretaker always set, account optional)
  caretakerId: string;     // Always present
  accountId?: string;      // Only for account holders
  isSysAdmin?: boolean;    // Only for system admins
  
  // Enhanced permissions for account holders
  isAccountOwner: boolean; // True if authenticated via account
}
```

## Account Setup Flow

### For New Families
1. User creates account (email/password)
2. Account creation automatically creates family
3. System creates linked caretaker for account holder
4. Account holder has immediate access to app

### For Existing Families
1. Account holder creates account
2. Account holder "claims" existing family
3. System links account to family and specific caretaker
4. Other caretakers continue using PIN system unchanged

## Special Permissions for Account Holders

Account holders get enhanced permissions beyond regular admins:

- **Billing Management**: Access to subscription and payment settings
- **Family Settings**: Core family configuration and branding
- **Data Export**: Full family data export capabilities
- **Account Management**: Invite/remove caretakers
- **Family Deletion**: Ability to permanently delete family

## API Endpoint Changes

### New Account Endpoints

```typescript
// Account management
POST /api/accounts/register
POST /api/accounts/login
POST /api/accounts/verify-email
POST /api/accounts/reset-password
GET  /api/accounts/profile
PUT  /api/accounts/profile

// Family claiming (for existing families)
POST /api/accounts/claim-family
GET  /api/accounts/claimable-families
```

### Enhanced Auth Endpoints

```typescript
// Updated authentication that supports both flows
POST /api/auth/login          // PIN-based (existing)
POST /api/auth/account-login  // Email/password (new)
POST /api/auth/logout         // Works for both
GET  /api/auth/me            // Returns enhanced auth context
```

## Migration Strategy

### Phase 1: Add Account Infrastructure
- Add Account table to schema
- Add accountId to Family and Caretaker tables
- Create account management APIs
- Build account registration/login UI

### Phase 2: Enable Account Creation
- Launch account registration for new users
- Existing families continue PIN-only operation
- Test account → family → caretaker linking

### Phase 3: Enable Family Claiming
- Add family claiming functionality
- Allow existing family admins to create accounts
- Link accounts to existing families and caretakers

### Phase 4: Enhanced Features
- Add billing integration (Stripe)
- Enable account-only features
- Add family ownership management

## Benefits of This Approach

### 1. Minimal Disruption
- Existing PIN system completely unchanged
- Current users can continue without any changes
- No forced migration required

### 2. Clear Ownership Model
- One account owns one family (simple billing)
- Clear data ownership for GDPR compliance
- Straightforward subscription management

### 3. Enhanced UX for Account Holders
- Skip PIN entry for seamless access
- Account-level settings and preferences
- Professional onboarding experience

### 4. Flexible Access Control
- Account holders get enhanced permissions
- PIN users maintain existing access patterns
- System admins retain cross-family access

### 5. SaaS Ready
- Clear subscription model (account = billing entity)
- Professional account management features
- Easy to add billing, limits, and features

## Future Enhancements

### Billing Integration
```prisma
model Account {
  // ... existing fields
  
  // Billing fields
  stripeCustomerId String?
  subscriptionId   String?
  planType         String?  // basic, premium, enterprise
  planExpires      DateTime?
  trialEnds        DateTime?
}
```

### Account-Level Features
- Custom family branding
- Enhanced data analytics
- Priority support
- Advanced export formats
- API access for integrations

### Family Limits by Plan
- Number of babies per family
- Data retention periods
- Advanced features (calendar, medicine tracking)
- Storage limits for photos/attachments

## Implementation Notes

### Security Considerations
- Account passwords use bcrypt with high cost factor
- Email verification required for account activation
- Rate limiting on account creation and login attempts
- Secure password reset flow with time-limited tokens

### Data Privacy
- Account holders own all family data
- Clear data deletion policies
- GDPR-compliant data export/deletion
- Audit trail for account actions

### Performance
- Indexes on email and account lookups
- Efficient account → caretaker → family queries
- Caching for account authentication
- Minimal impact on existing PIN authentication

This design provides a clean path to SaaS functionality while preserving the simplicity and speed of the existing PIN system, giving users the best of both worlds. 