# Database Setup Instructions

## Prisma Configuration Complete ✅

The Bloedlemoen Campaign platform has been configured with Prisma for database integration. Here's what has been set up:

### 📊 Database Schema

The Prisma schema includes:

#### NextAuth.js Tables

- **User**: Stores user information (email-based, works with all login methods)
- **Account**: OAuth provider accounts (Google, Facebook)
- **Session**: User sessions
- **VerificationToken**: Email verification tokens

#### Campaign-Specific Tables

- **Receipt**: OCR-processed receipt data with points calculation
- **Reward**: Available rewards in the campaign
- **Redemption**: User reward redemptions with status tracking
- **CampaignEvent**: Analytics and event tracking

### 🔧 Setup Instructions

1. **Create your PostgreSQL database** (e.g., on Railway, PlanetScale, Supabase, or local)

2. **Update your .env file** with your actual database URL:

   ```env
   DATABASE_URL="postgresql://username:password@host:port/database_name"
   ```

3. **Run the initial migration**:

   ```bash
   npx prisma migrate dev --name init
   ```

4. **Generate the Prisma client**:
   ```bash
   npx prisma generate
   ```

### 🚀 Key Features

- **Email-based user identification**: Users are tracked by email regardless of login method
- **NextAuth.js integration**: Seamless authentication with database persistence
- **Points system**: Automatic points tracking and calculation
- **Receipt processing**: OCR results stored with validation status
- **Reward management**: Complete redemption workflow

### 🔐 Authentication Flow

1. User logs in via Google, Facebook, or credentials
2. NextAuth.js creates/updates user record based on email
3. User data persists across all login methods
4. Points and campaign data linked to user email

### 📁 Generated Files

- `prisma/schema.prisma` - Database schema
- `lib/prisma.ts` - Prisma client configuration
- `lib/auth.ts` - Updated NextAuth configuration with Prisma adapter
- `types/next-auth.d.ts` - Updated TypeScript types

The system is now ready for database connection and will automatically handle user registration and login persistence across all authentication methods!
