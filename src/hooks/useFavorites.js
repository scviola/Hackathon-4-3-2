import { useState, useCallback } from 'react';

const STORAGE_KEY = 'savorai_favorites';

/**
 * Custom hook for managing favorites
 * Persists to localStorage
 */
export function useFavorites() {
    // Initialize state from localStorage using lazy initialization
    // This avoids calling setState within useEffect which can trigger cascading renders
    const [favorites, setFavorites] = useState(() => {
        try {
            const savedFavorites = localStorage.getItem(STORAGE_KEY);
            return savedFavorites ? JSON.parse(savedFavorites) : [];
        } catch (e) {
            console.error('Failed to parse favorites:', e);
            return [];
        }
    });

    // Save to localStorage whenever favorites change
    const saveToStorage = useCallback((newFavorites) => {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(newFavorites));
    }, []);

    const addFavorite = useCallback((recipe) => {
        if (!recipe || favorites.some(f => f.id === recipe.id)) {
            return favorites; // Already exists or invalid recipe
        }
        const newFavorites = [...favorites, recipe];
        setFavorites(newFavorites);
        saveToStorage(newFavorites);
        return newFavorites;
    }, [favorites, saveToStorage]);

    const removeFavorite = useCallback((recipeId) => {
        if (!recipeId) return favorites;
        const newFavorites = favorites.filter(f => f.id !== recipeId);
        setFavorites(newFavorites);
        saveToStorage(newFavorites);
        return newFavorites;
    }, [favorites, saveToStorage]);

    const toggleFavorite = useCallback((recipe) => {
        if (!recipe) return favorites;
        
        const isFavorited = favorites.some(f => f.id === recipe.id);
        if (isFavorited) {
            return removeFavorite(recipe.id);
        } else {
            return addFavorite(recipe);
        }
    }, [favorites, addFavorite, removeFavorite]);

    const isFavorite = useCallback((recipeId) => {
        return favorites.some(f => f.id === recipeId);
    }, [favorites]);

    const clearFavorites = useCallback(() => {
        localStorage.removeItem(STORAGE_KEY);
        setFavorites([]);
    }, []);

    return {
        favorites,
        addFavorite,
        removeFavorite,
        toggleFavorite,
        isFavorite,
        clearFavorites,
        favoritesCount: favorites.length
    };
}

export default useFavorites;