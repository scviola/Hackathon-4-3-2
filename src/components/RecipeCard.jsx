import PropTypes from 'prop-types';

/**
 * RecipeCard Component
 * Displays a single recipe with expandable details
 */
function RecipeCard({ 
  recipe, 
  isExpanded, 
  isFavorited, 
  onToggleDetails, 
  onToggleFavorite 
}) {
  const escapeHTML = (str) => String(str).replace(/&/g, '&').replace(/</g, '<').replace(/>/g, '>');

  return (
    <article 
      className="recipe-card" 
      data-recipe-id={recipe.id}
      aria-label={`Recipe: ${escapeHTML(recipe.name)}`}
    >
      <header className="recipe-card-header">
        <h3 className="recipe-title">{escapeHTML(recipe.name)}</h3>
        <p className="recipe-description">{escapeHTML(recipe.description || '')}</p>
      </header>
      
      <div className="recipe-card-actions">
        <button 
          type="button" 
          className="expand-btn"
          onClick={onToggleDetails}
          aria-expanded={isExpanded}
          aria-controls={`details-${recipe.id}`}
        >
          {isExpanded ? 'Hide Recipe' : 'View Recipe'}
        </button>
        
        <button 
          className={`favorite-btn ${isFavorited ? 'favorited' : ''}`}
          data-recipe-id={recipe.id}
          onClick={onToggleFavorite}
          aria-pressed={isFavorited}
          aria-label={isFavorited ? `Remove ${escapeHTML(recipe.name)} from favorites` : `Add ${escapeHTML(recipe.name)} to favorites`}
        >
          <span aria-hidden="true">♥</span>
          <span>{isFavorited ? 'Favorited' : 'Save Favorite'}</span>
        </button>
      </div>
      
      {isExpanded && (
        <div 
          className="recipe-details" 
          style={{ display: 'block' }} 
          id={`details-${recipe.id}`}
          role="region"
          aria-label="Recipe details"
        >
          <div className="ingredients-section">
            <h4 className="section-title">Ingredients</h4>
            <ul className="ingredients-list" aria-label="Recipe ingredients">
              {recipe.ingredients?.map((ing, i) => (
                <li key={i}>{escapeHTML(ing)}</li>
              ))}
            </ul>
          </div>
          <div className="instructions-section">
            <h4 className="section-title">Instructions</h4>
            <ol className="instructions-list" aria-label="Cooking instructions">
              {recipe.instructions?.map((inst, i) => (
                <li key={i}>{escapeHTML(inst)}</li>
              ))}
            </ol>
          </div>
        </div>
      )}
    </article>
  );
}

RecipeCard.propTypes = {
  recipe: PropTypes.shape({
    id: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
    description: PropTypes.string,
    ingredients: PropTypes.arrayOf(PropTypes.string),
    instructions: PropTypes.arrayOf(PropTypes.string)
  }).isRequired,
  isExpanded: PropTypes.bool.isRequired,
  isFavorited: PropTypes.bool.isRequired,
  onToggleDetails: PropTypes.func.isRequired,
  onToggleFavorite: PropTypes.func.isRequired
};

export default RecipeCard;
