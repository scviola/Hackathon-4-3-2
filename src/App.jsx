import { useState, useEffect } from 'react';
import Contact from './pages/Contact';
import Feedback from './pages/Feedback';
import Hero from './pages/Hero';
import Results from './pages/Results';
import Favorites from './pages/Favorites';
import About from './pages/About';
import Footer from './pages/Footer';
import { SearchBar, Navigation, UpgradeModal, ErrorBoundary } from './components';

// Supabase configuration from environment variables
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;
const FREE_RECIPE_LIMIT = import.meta.env.PROD ? 3 : 10; // Set to 3 during production; 10 during development for easier testing

// Initialize Supabase client
const supabase = (SUPABASE_URL && SUPABASE_ANON_KEY && window.supabase?.createClient)
    ? window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
    : null;

// List of valid ingredients - extracted from mock recipes
const VALID_INGREDIENTS = [
    'egg', 'eggs', 'cheese', 'flour', 'milk', 'butter', 'sugar', 'salt', 'pepper',
    'chives', 'cream', 'nutmeg'
];

function isValidIngredient(ingredient) {
    const searchLower = ingredient.toLowerCase().trim();
    // Check if it's in our valid ingredients list
    if (VALID_INGREDIENTS.includes(searchLower)) {
        return true;
    }
    // Check if any valid ingredient is contained in the search
    return VALID_INGREDIENTS.some(valid => searchLower.includes(valid));
}

// Mock recipes fallback
const getMockRecipes = () => [
    {
        id: 'recipe_1',
        name: 'Fluffy Cheese Scrambled Eggs',
        description: 'Creamy, restaurant-quality scrambled eggs with a perfect cheese melt.',
        ingredients: ['4 large eggs', '1/4 cup shredded cheese', '2 tablespoons butter', '2 tablespoons heavy cream', 'Salt and pepper', 'Fresh chives'],
        instructions: ['Crack eggs into a bowl and whisk with cream, salt, and pepper.', 'Heat butter in a non-stick pan over medium-low heat.', 'Pour in egg mixture and let sit 20 seconds.', 'Gently push edges toward center.', 'Continue for 2-3 minutes until almost set.', 'Remove from heat, add cheese, fold gently.', 'Garnish with chives and serve.']
    },
    {
        id: 'recipe_2',
        name: 'Crispy Cheese Pancakes',
        description: 'Golden pancakes with cheese for a savory-sweet twist.',
        ingredients: ['1 cup flour', '2 eggs', '1 cup milk', '1/2 cup shredded cheese', '2 tbsp melted butter', '1 tbsp sugar', '1 tsp baking powder'],
        instructions: ['Mix flour, baking powder, sugar, and salt.', 'Beat eggs, add milk and butter.', 'Combine wet and dry ingredients.', 'Fold in cheese.', 'Cook on hot griddle until golden.']
    },
    {
        id: 'recipe_3',
        name: 'Simple Cheese Soufflé',
        description: 'An elegant, airy soufflé with incredible flavor.',
        ingredients: ['4 eggs separated', '1 cup grated cheese', '3 tbsp flour', '3 tbsp butter', '1 cup warm milk', '1/4 tsp nutmeg'],
        instructions: ['Make roux with butter and flour.', 'Add warm milk gradually.', 'Stir in cheese and nutmeg.', 'Beat in egg yolks.', 'Fold in stiff egg whites.', 'Bake at 375°F for 20-25 minutes.']
    }
];

// Test Supabase connection
async function testSupabaseConnection() {
    if (!supabase) return false;
    try {
        const { error } = await supabase.from('users').select('*').limit(1);
        if (error) return false;
        console.log('✅ Supabase connected');
        return true;
    } catch (err) {
        console.error('❌ Supabase failed:', err);
        return false;
    }
}

// Generate user ID
function generateUserID() {
    let userID = localStorage.getItem('savorai_user_id');
    if (!userID) {
        userID = 'user_' + Date.now() + '_' + Math.random().toString(36).slice(2, 11);
        localStorage.setItem('savorai_user_id', userID);
    }
    return userID;
}

function getUserRecipeCount() {
    return parseInt(localStorage.getItem('savorai_recipe_count') || '0', 10);
}

function incrementUserRecipeCount() {
    const count = getUserRecipeCount() + 1;
    localStorage.setItem('savorai_recipe_count', count);
    return count;
}

function App() {
    const [currentView, setCurrentView] = useState('search'); // 'search', 'results', 'favorites', 'about'
    const [recipes, setRecipes] = useState([]);
    const [favorites, setFavorites] = useState([]);
    const [ingredients, setIngredients] = useState('');
    const [dietaryFilters, setDietaryFilters] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [expandedRecipe, setExpandedRecipe] = useState(null);
    const [showUpgradeModal, setShowUpgradeModal] = useState(false);
    const [isProUser, setIsProUser] = useState(false);
    const [userID, setUserID] = useState(null);

    useEffect(() => {
        const init = async () => {
            await testSupabaseConnection();
            const id = generateUserID();
            setUserID(id);

            // Try to get user UUID from Supabase auth
            if (SUPABASE_URL && SUPABASE_ANON_KEY && window.supabase?.createClient) {
                const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
                const { data: { user } } = await supabaseClient.auth.getUser();
                if (user) {
                    // Store the Supabase user ID for authenticated requests
                    localStorage.setItem('savorai_user_uuid', user.id);
                }
            }

            // Load favorites and pro status from localStorage
            const savedFavorites = localStorage.getItem('savorai_favorites');
            if (savedFavorites) {
                setFavorites(JSON.parse(savedFavorites));
            }

            // Load pro user status from localStorage
            const savedProStatus = localStorage.getItem('savorai_is_pro_user');
            if (savedProStatus === 'true') {
                setIsProUser(true);
            }
        };
        init();
    }, []);

    const fetchRecipes = async (searchIngredients, filters = []) => {
        // Check for Supabase dynamically (in case CDN hasn't loaded yet)
        const supabaseClient = (SUPABASE_URL && SUPABASE_ANON_KEY && window.supabase?.createClient)
            ? window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
            : null;
        
        // If Supabase is available, call the Edge Function (OpenAI) - no validation needed
        if (supabaseClient) {
            try {
                console.log('Calling Supabase Edge Function with:', searchIngredients, 'filters:', filters);
                
                // Get auth token for authorization header
                const { data: { session } } = await supabaseClient.auth.getSession();
                const authToken = session?.access_token || SUPABASE_ANON_KEY;
                
                const { data, error } = await supabaseClient.functions.invoke('get-recipes', {
                    body: { 
                        ingredients: searchIngredients,
                        dietary_filters: filters
                    },
                    headers: {
                        'Authorization': `Bearer ${authToken}`
                    }
                });
                
                console.log('Edge Function response:', { data, error });
                
                if (error) {
                    console.error('Edge Function error:', error);
                    // Fall back to mock recipes on error
                    return getMockRecipesForIngredients(searchIngredients);
                }
                
                if (data?.recipes) {
                    console.log('OpenAI recipes:', data.recipes);
                    return data.recipes;
                }
                
                // If no recipes, fall back to mock
                return getMockRecipesForIngredients(searchIngredients);
            } catch (err) {
                console.error('Error calling Edge Function:', err);
                return getMockRecipesForIngredients(searchIngredients);
            }
        }
        
        // For mock recipes only: validate ingredients
        if (!isValidIngredient(searchIngredients)) {
            console.log('Invalid ingredient for mock recipes:', searchIngredients);
            return [];
        }
        
        // Fallback to mock recipes if no Supabase
        console.log('Using mock recipes (no Supabase)');
        return getMockRecipesForIngredients(searchIngredients);
    };

    // Helper function to filter mock recipes by ingredients
    const getMockRecipesForIngredients = (searchIngredients) => {
        const mockRecipes = getMockRecipes();
        const searchLower = searchIngredients.toLowerCase();
        const filteredRecipes = mockRecipes.filter(recipe => {
            const allIngredients = recipe.ingredients.join(' ').toLowerCase();
            return allIngredients.includes(searchLower);
        });
        return filteredRecipes.length > 0 ? filteredRecipes : mockRecipes;
    };

    const handleSearch = async (e) => {
        e.preventDefault();
        
        // Allow search if either ingredients OR dietary filters are provided
        if (!ingredients.trim() && dietaryFilters.length === 0) {
            setError('Please enter some ingredients or select a dietary preference!');
            return;
        }

        if (!isProUser) {
            const count = getUserRecipeCount();
            if (count >= FREE_RECIPE_LIMIT) {
                setShowUpgradeModal(true);
                return;
            }
            incrementUserRecipeCount();
        }

        setLoading(true);
        setError('');

        try {
            const results = await fetchRecipes(ingredients, dietaryFilters);
            console.log('Results from fetchRecipes:', results);
            
            if (results.length === 0) {
                setError(`No recipes found. Please try different ingredients or dietary preferences.`);
                setLoading(false);
                return;
            }
            
            setRecipes(results);
            setCurrentView('results');
        } catch (err) {
            setError('Failed to fetch recipes. Please try again.');
            console.error('Error in handleSearch:', err);
        } finally {
            setLoading(false);
        }
    };

    const toggleFavorite = (recipeId) => {
        const recipe = recipes.find(r => r.id === recipeId) || favorites.find(f => f.id === recipeId);
        if (!recipe) return;

        const isFavorited = favorites.some(f => f.id === recipeId);
        let newFavorites;
        if (isFavorited) {
            newFavorites = favorites.filter(f => f.id !== recipeId);
        } else {
            newFavorites = [...favorites, recipe];
        }
        setFavorites(newFavorites);
        localStorage.setItem('savorai_favorites', JSON.stringify(newFavorites));
    };

    const toggleRecipeDetails = (recipeId) => {
        console.log('toggleRecipeDetails called with:', recipeId, 'current expandedRecipe:', expandedRecipe);
        setExpandedRecipe(expandedRecipe === recipeId ? null : recipeId);
    };

    const handleUpgrade = async () => {
        try {
            // Get user UUID from localStorage (set during auth) or fall back to userID
            const storedUUID = localStorage.getItem('savorai_user_uuid');

            const res = await fetch(`${SUPABASE_URL}/functions/v1/create-checkout`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${SUPABASE_ANON_KEY}` },
                body: JSON.stringify({ user_id: storedUUID || userID, plan: 'pro' })
            });
            const { checkout_url } = await res.json();

            // Mark user as pro locally (will be confirmed after successful payment)
            setIsProUser(true);
            localStorage.setItem('savorai_is_pro_user', 'true');

            window.location.href = checkout_url;
        } catch (err) {
            alert('Payment failed to start. Please try again.');
            console.error('Upgrade error:', err);
        }
    };

    return (
        <ErrorBoundary>
        <div className="app">
            {/* Background */}
            <div className="bg-decoration">
                <div className="floating-element floating-element-1">🥘</div>
                <div className="floating-element floating-element-2">🍅</div>
                <div className="floating-element floating-element-3">🥬</div>
                <div className="floating-element floating-element-4">🧄</div>
                <div className="floating-element floating-element-5">🌿</div>
            </div>

            {/* Header Navigation */}
            <Navigation 
                currentView={currentView} 
                onNavigate={setCurrentView}
                onUpgradeClick={() => setShowUpgradeModal(true)}
            />

            {/* Main Content */}
            <main className="container">
                {/* Search View - Hero */}
                {currentView === 'search' && (
                    <Hero>
                        <SearchBar 
                            ingredients={ingredients}
                            onIngredientsChange={setIngredients}
                            onSubmit={handleSearch}
                            loading={loading}
                            error={error}
                            dietaryFilters={dietaryFilters}
                            onDietaryFilterChange={setDietaryFilters}
                        />
                    </Hero>
                )}

                {/* Results View */}
                {currentView === 'results' && (
                    <Results 
                        recipes={recipes}
                        loading={loading}
                        ingredients={ingredients}
                        favorites={favorites}
                        expandedRecipe={expandedRecipe}
                        onToggleDetails={toggleRecipeDetails}
                        onToggleFavorite={toggleFavorite}
                        onBackToSearch={() => setCurrentView('search')}
                    />
                )}

                    {/* Favorites View */}
                {currentView === 'favorites' && (
                    <Favorites 
                        favorites={favorites}
                        expandedRecipe={expandedRecipe}
                        onToggleDetails={toggleRecipeDetails}
                        onToggleFavorite={toggleFavorite}
                        onDiscoverRecipes={() => setCurrentView('search')}
                    />
                )}

                {/* About Page */}
                {currentView === 'about' && (
                    <About onNavigate={setCurrentView} />
                )}

                {/* Contact Page */}
                {currentView === 'contact' && (
                    <Contact onNavigate={setCurrentView} />
                )}

                {/* Feedback Page */}
                {currentView === 'feedback' && (
                    <Feedback onNavigate={setCurrentView} />
                )}
            </main>

            {/* Footer */}
            <Footer onNavigate={setCurrentView} />

            {/* Upgrade Modal */}
            <UpgradeModal
                isOpen={showUpgradeModal}
                onClose={() => setShowUpgradeModal(false)}
                onUpgrade={handleUpgrade}
                freeLimit={FREE_RECIPE_LIMIT}
            />

            {/* Cursor Trail */}
            <div className="cursor-trail" id="cursor-trail"></div>
        </div>
        </ErrorBoundary>
    );
}

export default App;
