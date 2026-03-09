import PropTypes from 'prop-types';

/**
 * SearchBar Component
 * Ingredient search input with accessibility features and dietary filters
 */
function SearchBar({ 
  ingredients, 
  onIngredientsChange, 
  onSubmit, 
  loading, 
  error,
  dietaryFilters = [],
  onDietaryFilterChange 
}) {
  const DIETARY_OPTIONS = [
    { id: 'vegan', label: 'Vegan', emoji: '🥬' },
    { id: 'vegetarian', label: 'Vegetarian', emoji: '🥕' },
    { id: 'gluten-free', label: 'Gluten-Free', emoji: '🌾' },
    { id: 'keto', label: 'Keto', emoji: '🥑' },
    { id: 'dairy-free', label: 'Dairy-Free', emoji: '🥛' },
    { id: 'nut-free', label: 'Nut-Free', emoji: '🥜' },
  ];

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      onSubmit(e);
    }
  };

  const handleFilterToggle = (filterId) => {
    if (onDietaryFilterChange) {
      const newFilters = dietaryFilters.includes(filterId)
        ? dietaryFilters.filter(f => f !== filterId)
        : [...dietaryFilters, filterId];
      onDietaryFilterChange(newFilters);
    }
  };

  // Allow submission if either ingredients OR dietary filters are provided
  const canSubmit = loading || (!ingredients.trim() && dietaryFilters.length === 0);

  return (
    <section className="search-section" aria-label="Recipe search">
      <form 
        className="search-form" 
        id="recipe-search-form" 
        onSubmit={onSubmit}
        role="search"
      >
        <div className="input-group">
          <div className="input-wrapper">
            <label htmlFor="ingredients-input" className="visually-hidden">
              Enter ingredients
            </label>
            <input 
              type="text" 
              id="ingredients-input" 
              className="ingredients-input"
              placeholder="Enter ingredients... (e.g., eggs, flour, cheese)"
              value={ingredients}
              onChange={(e) => onIngredientsChange(e.target.value)}
              onKeyDown={handleKeyDown}
              aria-describedby="search-hint"
              aria-invalid={!!error}
              disabled={loading}
              autoComplete="off"
              autoFocus
            />
            <div className="input-glow" aria-hidden="true"></div>
          </div>
        </div>

        {/* Dietary Filters */}
        <fieldset className="dietary-filters" aria-label="Dietary preferences">
          <legend className="visually-hidden">Dietary Preferences</legend>
          <div className="filter-options">
            {DIETARY_OPTIONS.map((option) => (
              <label 
                key={option.id}
                className={`filter-chip ${dietaryFilters.includes(option.id) ? 'active' : ''}`}
                htmlFor={`filter-${option.id}`}
              >
                <input
                  type="checkbox"
                  id={`filter-${option.id}`}
                  checked={dietaryFilters.includes(option.id)}
                  onChange={() => handleFilterToggle(option.id)}
                  disabled={loading}
                />
                <span className="filter-emoji" aria-hidden="true">{option.emoji}</span>
                <span className="filter-label">{option.label}</span>
              </label>
            ))}
          </div>
        </fieldset>
        
        <button 
          type="submit" 
          className="find-recipes-btn" 
          id="find-recipes-btn"
          disabled={canSubmit}
          aria-busy={loading}
        >
          {loading && <span className="btn-spinner" aria-hidden="true"></span>}
          <span className="btn-text">
            {loading ? 'Finding Recipes...' : 'Find Recipes'}
          </span>
          <div className="btn-glow" aria-hidden="true"></div>
        </button>
      </form>
      
      <p id="search-hint" className="limit-notice">
        <span>You get <strong>3 free recipe generations</strong>. Upgrade to Pro for unlimited delicious ideas!</span>
      </p>
      
      {error && (
        <div 
          className="error-message" 
          role="alert"
          aria-live="polite"
        >
          <strong>Oops!</strong> {error}
        </div>
      )}
    </section>
  );
}

SearchBar.propTypes = {
  ingredients: PropTypes.string.isRequired,
  onIngredientsChange: PropTypes.func.isRequired,
  onSubmit: PropTypes.func.isRequired,
  loading: PropTypes.bool.isRequired,
  error: PropTypes.string,
  dietaryFilters: PropTypes.arrayOf(PropTypes.string),
  onDietaryFilterChange: PropTypes.func
};

SearchBar.defaultProps = {
  dietaryFilters: [],
  onDietaryFilterChange: () => {}
};

export default SearchBar;
