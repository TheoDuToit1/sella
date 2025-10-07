# Sella - Premium SME Food Delivery Platform

A comprehensive South African food delivery platform designed for butcheries, restaurants, delis, and specialty food shops. Built with Next.js 14, Supabase, and integrated with South African payment providers.

## 🚀 Features

### Phase 1 (MVP)
- **Multi-tenant Architecture**: Role-based access for customers, merchants, drivers, and platform admins
- **Weight-based Pricing**: Unique pricing system for butcheries with estimate → final weight → delta settlement
- **South African Payments**: PayFast integration with support for cards, EFT, and COD
- **Zone-based Delivery**: Configurable delivery zones with flat fees
- **Real-time Order Management**: Live order queue for merchants
- **Reward System**: 1% cashback points system
- **PWA Support**: Mobile-first progressive web app

### Phase 2 (Planned)
- **Shopping Lists**: Customer list management and quick reordering
- **Combos & Bundles**: Merchant-curated product combinations
- **Driver PWA**: Dedicated driver app with live tracking
- **Advanced Payments**: Ozow and SnapScan integration
- **Enhanced Analytics**: Detailed merchant insights

## 🛠 Tech Stack

- **Frontend**: Next.js 14 (App Router), TypeScript, Tailwind CSS, shadcn/ui
- **Backend**: Supabase (PostgreSQL + Auth + RLS)
- **Payments**: PayFast (Phase 1), Ozow + SnapScan (Phase 2)
- **Maps**: Mapbox/Google Maps for delivery zones
- **Email**: Resend for transactional emails
- **Notifications**: Web Push (VAPID)

## 📋 Prerequisites

- Node.js 18+ and npm
- Supabase account and project
- PayFast merchant account (for payments)
- Mapbox or Google Maps API key (for maps)

## 🚀 Quick Start

### 1. Clone and Install

```bash
git clone <repository-url>
cd mini-sixty60
npm install
```

### 2. Environment Setup

Copy the example environment file:

```bash
cp .env.local.example .env.local
```

Fill in your environment variables:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# PayFast Configuration
PAYFAST_MERCHANT_ID=your_payfast_merchant_id
PAYFAST_MERCHANT_KEY=your_payfast_merchant_key
PAYFAST_PASSPHRASE=your_payfast_passphrase
PAYFAST_SANDBOX=true

# Maps Configuration
NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN=your_mapbox_token

# Email Configuration
RESEND_API_KEY=your_resend_api_key

# App Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 3. Database Setup

Run the Supabase migrations:

```bash
# Install Supabase CLI
npm install -g supabase

# Initialize Supabase (if not already done)
supabase init

# Link to your project
supabase link --project-ref your-project-ref

# Run migrations
supabase db push
```

### 4. Run Development Server

```bash
npm run dev
```

Visit `http://localhost:3000` to see the application.

## 🏗 Project Structure

```
src/
├── app/                    # Next.js 14 App Router
│   ├── (customer)/        # Customer-facing pages
│   ├── (merchant)/        # Merchant dashboard
│   ├── (driver)/          # Driver app (Phase 2)
│   ├── (admin)/           # Platform admin
│   ├── auth/              # Authentication pages
│   └── api/               # API routes
├── components/            # Reusable components
│   ├── ui/               # shadcn/ui components
│   ├── customer/         # Customer-specific components
│   ├── merchant/         # Merchant-specific components
│   └── shared/           # Shared components
├── lib/                  # Utility functions
│   ├── supabase.ts      # Supabase client
│   ├── payfast.ts       # PayFast integration
│   └── utils.ts         # Helper functions
└── types/               # TypeScript definitions
    └── supabase.ts      # Database types
```

## 🔐 Authentication & Roles

The platform supports four user roles:

1. **Customer**: Browse merchants, place orders, track deliveries
2. **Merchant Admin**: Manage catalog, process orders, view analytics
3. **Driver**: Manage deliveries, update status (Phase 2)
4. **Platform Admin**: System administration, merchant onboarding

## 💳 Payment Integration

### PayFast (Phase 1)
- Credit/Debit cards (Visa, Mastercard)
- Instant EFT
- SID Secure EFT
- Cash on Delivery (COD)

### Weight-based Pricing Flow
1. Customer selects estimated weight
2. Order placed with estimated total
3. Merchant weighs actual product
4. System calculates price difference
5. Delta payment processed (if needed)

## 🗄 Database Schema

Key tables:
- `profiles` - User profiles with roles
- `merchants` - Merchant information
- `products` - Product catalog with weight-based pricing
- `orders` - Order management with estimated/final totals
- `order_items` - Line items with weight tracking
- `deliveries` - Delivery tracking
- `reward_wallets` - Customer loyalty points

## 🚚 Delivery System

### Phase 1: Basic Delivery
- Zone-based flat fees
- Manual status updates
- Basic tracking

### Phase 2: Advanced Delivery
- Driver PWA with GPS tracking
- Real-time location updates
- Proof of delivery (signature/photo)

## 🎯 Key Features Deep Dive

### Weight-based Pricing
```typescript
// Example: Butchery product
{
  name: "Premium Ribeye Steak",
  is_weight_based: true,
  price_per_kg: 299.99,
  min_weight_g: 200,
  max_weight_g: 1000
}
```

### Multi-tenant RLS
Row Level Security ensures data isolation:
- Customers see only their data
- Merchants see only their merchant's data
- Drivers see only assigned deliveries
- Platform admins have full access

### South African Compliance
- VAT calculation (15%)
- Audit logging for all transactions
- Support for South African address formats
- Local payment methods

## 🧪 Testing

```bash
# Run tests
npm test

# Run with coverage
npm run test:coverage

# E2E tests
npm run test:e2e
```

## 🚀 Deployment

### Vercel (Recommended)
```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
vercel --prod
```

### Environment Variables
Ensure all production environment variables are set in your deployment platform.

## 📱 PWA Features

- Offline capability
- Push notifications
- App-like experience
- Install prompts

## 🔧 Development

### Adding New Components
```bash
# Generate shadcn/ui component
npx shadcn-ui@latest add button
```

### Database Changes
```bash
# Create new migration
supabase migration new your_migration_name

# Apply migrations
supabase db push
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

For support, email support@minisixty60.co.za or create an issue in the repository.

## 🗺 Roadmap

### Phase 1 (Current) - 8-10 weeks
- [x] Project setup and architecture
- [x] Authentication and role-based access
- [x] Database schema and RLS
- [x] Weight-based pricing system
- [x] PayFast payment integration
- [ ] Customer PWA completion
- [ ] Merchant dashboard completion
- [ ] Basic delivery system
- [ ] Testing and deployment

### Phase 2 - 6-8 weeks
- [ ] Shopping lists and favorites
- [ ] Combos and bundles
- [ ] Driver PWA with live tracking
- [ ] Ozow and SnapScan integration
- [ ] Advanced analytics
- [ ] Push notifications

### Phase 3 - Future
- [ ] AI-powered recommendations
- [ ] Subscription boxes
- [ ] Multi-city expansion
- [ ] WhatsApp ordering
- [ ] Advanced inventory management

---

Built with ❤️ for South African SMEs
