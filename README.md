# Bloedlemoen Campaign Engine

A campaign engine built with Next.js that allows users to log in and earn points by uploading receipt images that are processed using OCR (Tesseract.js).

## Features

### Authentication

- **Email/Password Login**: Users can log in with their email and password
- **Social Login**: Support for Google, Facebook, and Apple sign-in
- **Session Management**: Secure session handling with NextAuth.js

### Dashboard

- **Points Display**: Users can view their accumulated points
- **Progress Bar**: Visual indicator showing progress to next reward
- **Recent Activity**: History of point earnings

### Image Upload & OCR

- **Receipt Upload**: Users can upload images of receipts
- **OCR Processing**: Uses Tesseract.js to extract text from uploaded images
- **Point Verification**: Awards points based on OCR text validation
- **Real-time Feedback**: Shows processing status and OCR results

## Tech Stack

- **Frontend**: Next.js 15 with React 19
- **Styling**: Tailwind CSS with custom UI components
- **Authentication**: NextAuth.js with multiple providers
- **OCR**: Tesseract.js for text extraction
- **TypeScript**: Full type safety
- **Icons**: Lucide React

## Getting Started

1. **Install Dependencies**

   ```bash
   pnpm install
   ```

2. **Environment Setup**
   Copy `.env.local.example` to `.env.local` and fill in your OAuth credentials:

   ```bash
   cp .env.local.example .env.local
   ```

3. **OAuth Setup** (Optional)

   - Google: Create credentials at [Google Cloud Console](https://console.cloud.google.com/)
   - Facebook: Create app at [Facebook Developers](https://developers.facebook.com/)
   - Apple: Configure at [Apple Developer](https://developer.apple.com/)

4. **Run Development Server**

   ```bash
   pnpm dev
   ```

5. **Open Browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## Usage

1. **Login**: Visit the app and use email/password or social login
2. **Dashboard**: View your points and recent activity
3. **Upload Receipt**: Click "Browse" to select a receipt image
4. **Earn Points**: Valid receipts containing "bloedlemoen" or "receipt" will award 50 points
5. **Track Progress**: Monitor your progress toward the next reward (200 points)

## Project Structure

```
app/
├── api/auth/[...nextauth]/route.ts    # NextAuth API routes
├── dashboard/page.tsx                  # Main dashboard page
├── login/page.tsx                     # Login page
├── layout.tsx                         # Root layout with providers
└── page.tsx                          # Home page with redirects

components/
├── login-form.tsx                     # Login form with social auth
├── providers.tsx                      # NextAuth session provider
└── ui/                               # Reusable UI components

lib/
└── auth.ts                           # NextAuth configuration

types/
└── next-auth.d.ts                    # NextAuth type extensions
```

## Features in Detail

### Authentication Flow

1. User visits the app
2. Redirected to login page if not authenticated
3. Can login with credentials or social providers
4. Successful login redirects to dashboard
5. Middleware protects dashboard routes

### OCR Processing

1. User selects an image file
2. Tesseract.js processes the image
3. Extracted text is displayed
4. Points awarded based on text content validation
5. Points total is updated in real-time

### Point System

- Welcome bonus: 100 points (mock data)
- Valid receipt: 50 points per upload
- Progress tracking toward 200-point rewards
- Activity history with timestamps

## Customization

### Adding New OCR Validation Rules

Edit the `handleImageUpload` function in `app/dashboard/page.tsx`:

```typescript
if (text.toLowerCase().includes("your-keyword")) {
  // Award points for specific keywords
}
```

### Modifying Point Values

Update point values in the dashboard component:

```typescript
const newPoints = points + 50; // Change this value
```

### Styling

The app uses Tailwind CSS with custom components in the `components/ui` folder. Modify these components to change the visual design.

## Security Notes

- All authentication is handled by NextAuth.js
- Dashboard routes are protected by middleware
- Environment variables store sensitive OAuth credentials
- CSRF protection is built into NextAuth.js

## Future Enhancements

- Database integration for persistent point storage
- Advanced OCR validation with receipt line items
- Reward redemption system
- User profiles and preferences
- Admin dashboard for campaign management
- Push notifications for point earnings
- Referral system
- Social sharing features

## Troubleshooting

### OAuth Issues

- Ensure your OAuth app URLs match your deployment URL
- Check that all required environment variables are set
- Verify OAuth app permissions and scopes

### OCR Issues

- Ensure images are clear and well-lit
- Supported formats: JPG, PNG, WebP
- Large files may take longer to process

### Port Conflicts

If port 3000 is in use, Next.js will automatically use the next available port (3001, 3002, etc.).
