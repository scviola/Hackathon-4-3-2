import { useState, useCallback } from 'react';

// Supabase configuration from environment variables
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Valid ingredients for mock recipes
const VALID_INGREDIENTS = [
    'egg', 'eggs', 'cheese', 'flour', 'milk', 'butter', 'sugar', 'salt', 'pepper',
    'chives', 'cream', 'nutmeg'
];

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

function isValidIngredient(ingredient) {
    const searchLower = ingredient.toLowerCase().trim();
    if (VALID_INGREDIENTS.includes(searchLower)) {
        return true;
    }
    return VALID_INGREDIENTS.some(valid => searchLower.includes(valid));
}

// Filter mock recipes by ingredients
const getMockRecipesForIngredients = (searchIngredients) => {
    const mockRecipes = getMockRecipes();
    const searchLower = searchIngredients.toLowerCase();
    const filteredRecipes = mockRecipes.filter(recipe => {
        const allIngredients = recipe.ingredients.join(' ').toLowerCase();
        return allIngredients.includes(searchLower);
    });
    return filteredRecipes.length > 0 ? filteredRecipes : mockRecipes;
};

/**
 * Custom hook for recipe management
 * Handles fetching recipes from API or mock data
 */
export function useRecipes() {
    const [recipes, setRecipes] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const fetchRecipes = useCallback(async (searchIngredients) => {
        setLoading(true);
        setError('');

        try {
            const supabaseClient = (SUPABASE_URL && SUPABASE_ANON_KEY && window.supabase?.createClient)
                ? window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
                : null;
            
            if (supabaseClient) {
                console.log('Calling Supabase Edge Function with:', searchIngredients);
                
                const { data: { session } } = await supabaseClient.auth.getSession();
                const authToken = session?.access_token || SUPABASE_ANON_KEY;
                
                const { data, error: fnError } = await supabaseClient.functions.invoke('get-recipes', {
                    body: { ingredients: searchIngredients },
                    headers: {
                        'Authorization': `Bearer ${authToken}`
                    }
                });
                
                console.log('Edge Function response:', { data, error: fnError });
                
                if (fnError) {
                    console.error('Edge Function error:', fnError);
                    return getMockRecipesForIngredients(searchIngredients);
                }
                
                if (data?.recipes) {
                    console.log('OpenAI recipes:', data.recipes);
                    return data.recipes;
                }
                
                return getMockRecipesForIngredients(searchIngredients);
            }
            
            // For mock recipes only: validate ingredients
            if (!isValidIngredient(searchIngredients)) {
                console.log('Invalid ingredient for mock recipes:', searchIngredients);
                return [];
            }
            
            console.log('Using mock recipes (no Supabase)');
            return getMockRecipesForIngredients(searchIngredients);
            
        } catch (err) {
            console.error('Error calling Edge Function:', err);
            return getMockRecipesForIngredients(searchIngredients);
        } finally {
            setLoading(false);
        }
    }, []);

    const clearRecipes = useCallback(() => {
        setRecipes([]);
        setError('');
    }, []);

    const setErrorMessage = useCallback((message) => {
        setError(message);
    }, []);

    return {
        recipes,
        setRecipes,
        loading,
        error,
        fetchRecipes,
        clearRecipes,
        setErrorMessage
    };
}

export default useRecipes;
