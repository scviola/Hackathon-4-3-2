# 🍳 SavorAI – AI Recipe Recommender

SavorAI is a recipe search web app with a **free tier** and **Pro upgrade** using **IntaSend payments**.  
Built with **React** + **Vite** for the frontend, **Supabase** for backend + database, **Edge Functions** for business logic, and **OpenAI** for AI-powered recipe generation.

## 🛠️ Tech Stack

- **Frontend**: React 19 + Vite
- **Hosting**: Netlify (serves static frontend)
- **Backend**: Supabase (cloud-hosted Postgres database + backend services)
  - **Postgres Database** (stores users, recipes, favorites, & payment status)
  - **Edge Functions** (custom backend logic with Deno/TypeScript)
- **AI**: OpenAI API (recipe generation from ingredients)
- **Payments**: IntaSend API (checkout links)

## 🌐 Hosting & Integration

- The **frontend** is deployed on **Netlify**.
- The **backend** (database + edge functions) is fully managed by **Supabase**.
- The frontend connects directly to Supabase using environment variables `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`.
- Supabase **Row Level Security (RLS)** ensures users only access their own data.
- **Edge Functions** bridge external services:
  - Recipe generation (OpenAI)
  - Payment checkout (IntaSend)

## 💳 Payments (IntaSend Integration)

- Free tier: **3 recipe searches per user** (10 during development)
- On exceeding the limit, user is prompted with an **upgrade modal**
- The `create-checkout` Edge Function generates an **IntaSend payment link**
- Users are redirected to the IntaSend checkout page

## 🚀 Live Deployment

- Netlify Deployment: https://savorai.netlify.app
- Backend: Hosted on Supabase (database + edge functions)

## 🏗️ System Architecture

```mermaid
flowchart TD
    U[User] --> N[Netlify (React Frontend)]
    N --> S[Supabase Database]
    N --> F[Supabase Edge Functions]
    F --> O[OpenAI (AI Recipes)]
    F --> P[Intasend (Payments)]
    S -->|Stores| SF[Users and Favorites]
    U -->|Free (3 recipes)| N
    U -->|Upgrade (Pro)| P
```

- User opens app via Netlify
- Frontend connects to Supabase Database (for users and favorites)
- Frontend calls Edge Functions which talk to OpenAI (recipes) and IntaSend (payments)
- Free users get 3 recipes then can upgrade via IntaSend

## ⚡ Supabase Edge Functions

- `get-recipes`: Uses **OpenAI** to generate recipes based on user input (ingredients).
- `create-checkout`: Generates **IntaSend** payment checkout links.
- `payment-webhook`: Handles IntaSend payment callbacks to verify payments.

## 🔐 Database Security (RLS Policies)

Row Level Security (RLS) is enabled on all tables to ensure data safety:

- **recipes**
  - Publicly readable so anyone can search recipes.
  - Writes are restricted to system/Edge Functions (for AI-generated recipes).

- **favorites**
  - Fully protected with RLS.
  - Users can only `SELECT`, `INSERT`, `UPDATE`, or `DELETE` their **own favorites** (`auth.uid() = user_id`).

- **users**
  - Each user can only view or update **their own profile row** (`auth.uid() = id`).
  - Prevents unauthorized access to other users' data.

## 🗂️ Project Structure

```
├── src/                      # React frontend source
│   ├── components/           # React components
│   │   ├── SearchBar.jsx
│   │   ├── Navigation.jsx
│   │   ├── RecipeCard.jsx
│   │   ├── UpgradeModal.jsx
│   │   └── ...
│   ├── pages/                # Page components
│   │   ├── Hero.jsx
│   │   ├── Results.jsx
│   │   ├── Favorites.jsx
│   │   └── ...
│   ├── hooks/                # Custom React hooks
│   │   ├── useAuth.js
│   │   ├── useRecipes.js
│   │   └── useFavorites.js
│   ├── App.jsx              # Main App component
│   └── main.jsx              # Entry point
├── supabase/                 # Supabase backend
│   └── functions/
│       ├── get-recipes/      # Fetch recipes (Edge Function)
│       ├── create-checkout/  # IntaSend checkout (Edge Function)
│       └── payment-webhook/  # Payment verification
├── public/                   # Static assets
├── index.html                # HTML entry point
├── style.css                 # Global styles
├── vite.config.js            # Vite configuration
├── package.json              # Dependencies
└── README.md
```

## 🛠️ Development Setup

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Deploy to Netlify
netlify deploy --prod
```

## 📌 Environment Variables

Create a `.env` file with:

```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

**Note:** Additional variables are required for Edge Functions (set in Supabase dashboard):

- `OPENAI_API_KEY` - For AI recipe generation
- `INTASEND_SECRET_KEY` - For payment processing
- `INTASEND_WEBHOOK_SECRET` - For payment verification
- `SUPABASE_SERVICE_ROLE_KEY` - For backend database access

## 📌 Roadmap

- [x] React frontend with Vite
- [x] AI-powered recipe generation (OpenAI)
- [x] Free tier enforcement
- [x] Pro upgrade modal with IntaSend checkout
- [x] Edge Functions for recipes and payments
- [x] Payment webhook handling
- [x] Recipe caching
