import PropTypes from 'prop-types';

/**
 * About Component - About page section
 */
function About({ onNavigate }) {
    const handleDiscover = () => {
        onNavigate('search');
    };

    return (
        <section 
            className="about-section" 
            id="about"
            aria-label="About SavorAI"
        >
            <div className="about-hero">
                <h1>About SavorAI</h1>
                <p className="about-tagline">Transforming your kitchen into a culinary playground</p>
            </div>
            
            <div className="about-content">
                <article className="about-card">
                    <div className="about-icon" aria-hidden="true">🤖</div>
                    <h3>AI-Powered Recipes</h3>
                    <p>Our advanced AI analyzes your available ingredients and generates personalized recipes tailored to your taste preferences and cooking skill level.</p>
                </article>
                
                <article className="about-card">
                    <div className="about-icon" aria-hidden="true">⚡</div>
                    <h3>Instant Results</h3>
                    <p>Get recipe suggestions in seconds. No more scrolling through endless pages - just enter your ingredients and let us do the rest.</p>
                </article>
                
                <article className="about-card">
                    <div className="about-icon" aria-hidden="true">💝</div>
                    <h3>Save Your Favorites</h3>
                    <p>Build your personal collection of favorite recipes. Access them anytime, anywhere, across all your devices.</p>
                </article>
                
                <article className="about-card">
                    <div className="about-icon" aria-hidden="true">🚀</div>
                    <h3>Upgrade to Pro</h3>
                    <p>Unlock unlimited recipe generations, exclusive pro recipes, and support the continued development of SavorAI.</p>
                </article>
            </div>
            
            <div className="about-cta">
                <h2>Ready to Start Cooking?</h2>
                <button 
                    className="discover-button" 
                    onClick={handleDiscover}
                >
                    <span>Discover Recipes</span>
                    <span className="discover-arrow" aria-hidden="true">→</span>
                </button>
            </div>
        </section>
    );
}

About.propTypes = {
    onNavigate: PropTypes.func.isRequired
};

export default About;