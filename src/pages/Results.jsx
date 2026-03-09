import PropTypes from 'prop-types';
import { RecipeCard, SkeletonLoader } from '../components';

/**
 * Results Component - Display recipe search results
 */
function Results({ 
    recipes, 
    loading, 
    ingredients, 
    favorites, 
    expandedRecipe, 
    onToggleDetails, 
    onToggleFavorite,
    onBackToSearch 
}) {
    return (
        <section 
            className={`results-section${loading ? '' : ' show'}`} 
            id="results-section"
            aria-label="Recipe results"
        >
            <div className="results-header">
                <div className="results-header-content">
                    <h2 className="results-title">Recipe Suggestions</h2>
                    <p className="results-subtitle">
                        Here are some delicious recipes using: <strong>{ingredients}</strong>
                    </p>
                </div>
                <div className="results-decorative-element" aria-hidden="true"></div>
            </div>
            
            <button 
                className={`back-button${loading ? '' : ' show'}`} 
                id="back-button" 
                onClick={onBackToSearch}
                aria-label="Back to search"
            >
                <span className="back-arrow" aria-hidden="true">←</span>
                <span>Back to Search</span>
                <div className="back-button-ripple" aria-hidden="true"></div>
            </button>
            
            <div className="recipes-grid" id="recipes-grid" role="list">
                {loading ? (
                    <SkeletonLoader count={3} />
                ) : recipes && recipes.length > 0 ? (
                    recipes.map(recipe => (
                        <RecipeCard
                            key={recipe.id}
                            recipe={recipe}
                            isExpanded={expandedRecipe === recipe.id}
                            isFavorited={favorites.some(f => f.id === recipe.id)}
                            onToggleDetails={() => onToggleDetails(recipe.id)}
                            onToggleFavorite={() => onToggleFavorite(recipe)}
                        />
                    ))
                ) : null}
            </div>
        </section>
    );
}

Results.propTypes = {
    recipes: PropTypes.array,
    loading: PropTypes.bool,
    ingredients: PropTypes.string,
    favorites: PropTypes.array.isRequired,
    expandedRecipe: PropTypes.string,
    onToggleDetails: PropTypes.func.isRequired,
    onToggleFavorite: PropTypes.func.isRequired,
    onBackToSearch: PropTypes.func.isRequired
};

export default Results;