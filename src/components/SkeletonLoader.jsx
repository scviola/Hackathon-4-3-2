/**
 * SkeletonLoader Component
 * Loading placeholder while recipes are being fetched
 */
function SkeletonLoader({ count = 3 }) {
  return (
    <div 
      className="recipes-grid" 
      role="status" 
      aria-label="Loading recipes"
    >
      {Array.from({ length: count }).map((_, index) => (
        <article 
          key={index} 
          className="recipe-card skeleton"
          aria-hidden="true"
        >
          <div className="skeleton-header">
            <div className="skeleton-title"></div>
            <div className="skeleton-description"></div>
            <div className="skeleton-description-short"></div>
          </div>
          
          <div className="skeleton-actions">
            <div className="skeleton-button"></div>
            <div className="skeleton-button"></div>
          </div>
        </article>
      ))}
      <span className="visually-hidden">
        Loading recipes, please wait...
      </span>
    </div>
  );
}

/**
 * PageSkeletonLoader Component
 * Full page loading state for initial load
 */
function PageSkeletonLoader() {
  return (
    <section className="hero" aria-label="Loading page">
      <div className="hero-background-glow"></div>
      <div className="hero-content">
        <div className="hero-badge skeleton-badge"></div>
        <div className="skeleton-title-large"></div>
        <div className="skeleton-title-medium"></div>
        <div className="skeleton-text"></div>
        <div className="skeleton-text-short"></div>
        
        <div className="search-section-skeleton">
          <div className="skeleton-input"></div>
          <div className="skeleton-button-large"></div>
        </div>
        
        <div className="feature-highlights-skeleton">
          <div className="skeleton-feature"></div>
          <div className="skeleton-feature"></div>
          <div className="skeleton-feature"></div>
        </div>
      </div>
    </section>
  );
}

export { SkeletonLoader, PageSkeletonLoader };
export default SkeletonLoader;
