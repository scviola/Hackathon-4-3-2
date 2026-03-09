import { useState } from 'react';

function Feedback({ onNavigate }) {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        rating: 5,
        feedback: ''
    });
    const [submitted, setSubmitted] = useState(false);

    const handleSubmit = (e) => {
        e.preventDefault();
        // send to your backend if there is one; just log for now
        console.log('Feedback submitted:', formData);
        setSubmitted(true);
    };

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    if (submitted) {
        return (
            <section className="feedback-section" id="feedback">
                <div className="feedback-success">
                    <div className="success-icon">💝</div>
                    <h2>Thank You!</h2>
                    <p>Your feedback helps us improve SavorAI.</p>
                    <button className="discover-button" onClick={() => onNavigate('search')}>
                        <span>Back to Home</span>
                        <span className="discover-arrow">→</span>
                    </button>
                </div>
            </section>
        );
    }

    return (
        <section className="feedback-section" id="feedback">
            <div className="feedback-hero">
                <h1>Feedback</h1>
                <p className="feedback-tagline">Help us make SavorAI better!</p>
            </div>
            <div className="feedback-content">
                <div className="feedback-card">
                    <form className="feedback-form" onSubmit={handleSubmit}>
                        <div className="form-group">
                            <label htmlFor="name">Name</label>
                            <input
                                type="text"
                                id="name"
                                name="name"
                                value={formData.name}
                                onChange={handleChange}
                                placeholder="Your name"
                            />
                        </div>
                        <div className="form-group">
                            <label htmlFor="email">Email</label>
                            <input
                                type="email"
                                id="email"
                                name="email"
                                value={formData.email}
                                onChange={handleChange}
                                placeholder="your@email.com"
                            />
                        </div>
                        <div className="form-group">
                            <label>How would you rate your experience?</label>
                            <div className="rating-container">
                                {[1, 2, 3, 4, 5].map((star) => (
                                    <button
                                        key={star}
                                        type="button"
                                        className={`star-btn ${formData.rating >= star ? 'active' : ''}`}
                                        onClick={() => setFormData({ ...formData, rating: star })}
                                    >
                                        ⭐
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div className="form-group">
                            <label htmlFor="feedback">Your Feedback</label>
                            <textarea
                                id="feedback"
                                name="feedback"
                                value={formData.feedback}
                                onChange={handleChange}
                                required
                                placeholder="What did you like? What can we improve?"
                                rows="5"
                            ></textarea>
                        </div>
                        <button type="submit" className="discover-button">
                            <span>Submit Feedback</span>
                            <span className="discover-arrow">→</span>
                        </button>
                    </form>
                </div>
            </div>
        </section>
    );
}

export default Feedback;
