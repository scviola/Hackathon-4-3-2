import PropTypes from 'prop-types';

/**
 * Hero Component - Search view with feature highlights
 */
function Hero({ children }) {
    return (
        <section className="hero" id="search">
            <div className="hero-background-glow"></div>
            <div className="hero-content">
                <div className="hero-badge">
                    <span className="badge-icon">✨</span>
                    <span>AI-Powered Recipe Discovery</span>
                </div>
                <h1 className="hero-title">
                    Turn Your Ingredients Into
                    <span className="gradient-text"> Culinary Magic</span>
                </h1>
                <p className="hero-subtitle">
                    Tell us what you have in your kitchen, and let AI craft personalized recipes just for you.
                    From simple snacks to gourmet meals - discover endless possibilities!
                </p>

                {children}

                <div className="feature-highlights">
                    <div className="feature-item">
                        <div className="feature-icon" aria-hidden="true">🤖</div>
                        <span>AI-Generated</span>
                    </div>
                    <div className="feature-item">
                        <div className="feature-icon" aria-hidden="true">⚡</div>
                        <span>Instant Results</span>
                    </div>
                    <div className="feature-item">
                        <div className="feature-icon" aria-hidden="true">🎯</div>
                        <span>Personalized</span>
                    </div>
                </div>
            </div>
        </section>
    );
}

Hero.propTypes = {
    children: PropTypes.node
};

export default Hero;