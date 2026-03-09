import PropTypes from 'prop-types';
import { RecipeCard } from '../components';

/**
 * Favorites Component - Display user's saved recipes
 */
function Favorites({ 
    favorites, 
    expandedRecipe, 
    onToggleDetails, 
    onToggleFavorite,
    onDiscoverRecipes 
}) {
    const isEmpty = favorites.length === 0;

    return (
        <section 
            className="favorites-section" 
            id="favorites-section"
            aria-label="My favorites"
        >
            <div className="favorites-header">
                <div className="favorites-header-content">
                    <h2 className="favorites-title">
                        <span className="favorites-icon" aria-hidden="true">💝</span>
                        My Favorite Recipes
                    </h2>
                    <p className="results-subtitle">Your saved culinary treasures</p>
                </div>
                <div className="favorites-decorative-element" aria-hidden="true"></div>
            </div>
            
            <div className="recipes-grid" id="favorites-grid" role="list">
                {isEmpty ? (
                    <div 
                        className="empty-favorites" 
                        id="empty-favorites"
                        role="status"
                    >
                        <div className="empty-favorites-animation" aria-hidden="true">
                            <div className="empty-favorites-icon">💝</div>
                            <div className="empty-favorites-sparkles">
                                <span className="sparkle sparkle-1">✨</span>
                                <span className="sparkle sparkle-2">✨</span>
                                <span className="sparkle sparkle-3">✨</span>
                            </div>
                        </div>
                        <h3>No favorites yet!</h3>
                        <p>Start discovering recipes and save your favorites here.</p>
                        <button 
                            className="discover-button" 
                            onClick={onDiscoverRecipes}
                        >
                            <span>Discover Recipes</span>
                            <span className="discover-arrow" aria-hidden="true">→</span>
                        </button>
                    </div>
                ) : (
                    favorites.map(recipe => (
                        <RecipeCard
                            key={recipe.id}
                            recipe={recipe}
                            isExpanded={expandedRecipe === recipe.id}
                            isFavorited={true}
                            onToggleDetails={() => onToggleDetails(recipe.id)}
                            onToggleFavorite={() => onToggleFavorite(recipe)}
                        />
                    ))
                )}
            </div>
        </section>
    );
}

Favorites.propTypes = {
    favorites: PropTypes.array.isRequired,
    expandedRecipe: PropTypes.string,
    onToggleDetails: PropTypes.func.isRequired,
    onToggleFavorite: PropTypes.func.isRequired,
    onDiscoverRecipes: PropTypes.func.isRequired
};

export default Favorites;