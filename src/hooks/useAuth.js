import { useState, useEffect, useCallback } from 'react';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

const USER_ID_KEY = 'savorai_user_id';
const PRO_STATUS_KEY = 'savorai_is_pro_user';
const USER_UUID_KEY = 'savorai_user_uuid';

// Generate user ID
function generateUserID() {
    let userID = localStorage.getItem(USER_ID_KEY);
    if (!userID) {
        userID = 'user_' + Date.now() + '_' + Math.random().toString(36).slice(2, 11);
        localStorage.setItem(USER_ID_KEY, userID);
    }
    return userID;
}

// Get recipe count
export function getUserRecipeCount() {
    return parseInt(localStorage.getItem('savorai_recipe_count') || '0', 10);
}

// Increment recipe count
export function incrementUserRecipeCount() {
    const count = getUserRecipeCount() + 1;
    localStorage.setItem('savorai_recipe_count', count);
    return count;
}

// Check if user can search (within free limit)
export function canSearch(freeLimit) {
    return getUserRecipeCount() < freeLimit;
}

/**
 * Custom hook for user authentication and state
 */
export function useAuth() {
    const [userID, setUserID] = useState(null);
    const [userUUID, setUserUUID] = useState(null);
    const [isProUser, setIsProUser] = useState(false);
    const [recipeCount, setRecipeCount] = useState(0);

    useEffect(() => {
        const init = async () => {
            // Generate/set user ID
            const id = generateUserID();
            setUserID(id);
            setRecipeCount(getUserRecipeCount());

            // Load pro status
            const savedProStatus = localStorage.getItem(PRO_STATUS_KEY);
            if (savedProStatus === 'true') {
                setIsProUser(true);
            }

            // Try to get user UUID from Supabase auth
            if (SUPABASE_URL && SUPABASE_ANON_KEY && window.supabase?.createClient) {
                try {
                    const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
                    const { data: { user } } = await supabaseClient.auth.getUser();
                    if (user) {
                        localStorage.setItem(USER_UUID_KEY, user.id);
                        setUserUUID(user.id);
                    }
                } catch (e) {
                    console.log('Auth check skipped:', e);
                }
            }
        };

        init();
    }, []);

    const upgradeToPro = useCallback(() => {
        setIsProUser(true);
        localStorage.setItem(PRO_STATUS_KEY, 'true');
    }, []);

    const incrementRecipeCount = useCallback(() => {
        const newCount = incrementUserRecipeCount();
        setRecipeCount(newCount);
        return newCount;
    }, []);

    const resetRecipeCount = useCallback(() => {
        localStorage.setItem('savorai_recipe_count', '0');
        setRecipeCount(0);
    }, []);

    return {
        userID,
        userUUID,
        isProUser,
        recipeCount,
        upgradeToPro,
        incrementRecipeCount,
        resetRecipeCount,
        canSearch: (limit) => recipeCount < limit
    };
}

// Test Supabase connection
export async function testSupabaseConnection() {
    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) return false;
    
    const supabase = window.supabase?.createClient?.(SUPABASE_URL, SUPABASE_ANON_KEY);
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

export default useAuth;