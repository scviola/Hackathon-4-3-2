import { useState } from 'react';

function Contact({ onNavigate }) {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        message: ''
    });
    const [submitted, setSubmitted] = useState(false);

    const handleSubmit = (e) => {
        e.preventDefault();
        // send to your backend if there is one; just log for now
        console.log('Contact form submitted:', formData);
        setSubmitted(true);
    };

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    if (submitted) {
        return (
            <section className="contact-section" id="contact">
                <div className="contact-success">
                    <div className="success-icon">✅</div>
                    <h2>Message Sent!</h2>
                    <p>Thank you for reaching out. We'll get back to you soon.</p>
                    <button className="discover-button" onClick={() => onNavigate('search')}>
                        <span>Back to Home</span>
                        <span className="discover-arrow">→</span>
                    </button>
                </div>
            </section>
        );
    }

    return (
        <section className="contact-section" id="contact">
            <div className="contact-hero">
                <h1>Contact Us</h1>
                <p className="contact-tagline">We'd love to hear from you!</p>
            </div>
            <div className="contact-content">
                <div className="contact-card">
                    <form className="contact-form" onSubmit={handleSubmit}>
                        <div className="form-group">
                            <label htmlFor="name">Name</label>
                            <input
                                type="text"
                                id="name"
                                name="name"
                                value={formData.name}
                                onChange={handleChange}
                                required
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
                                required
                                placeholder="your@email.com"
                            />
                        </div>
                        <div className="form-group">
                            <label htmlFor="message">Message</label>
                            <textarea
                                id="message"
                                name="message"
                                value={formData.message}
                                onChange={handleChange}
                                required
                                placeholder="How can we help you?"
                                rows="5"
                            ></textarea>
                        </div>
                        <button type="submit" className="discover-button">
                            <span>Send Message</span>
                            <span className="discover-arrow">→</span>
                        </button>
                    </form>
                </div>
                <div className="contact-info">
                    <div className="info-card">
                        <div className="info-icon">📧</div>
                        <h3>Email</h3>
                        <p>hello@savorai.com</p>
                    </div>
                    <div className="info-card">
                        <div className="info-icon">💬</div>
                        <h3>Social</h3>
                        <p>Follow us on social media</p>
                    </div>
                    <div className="info-card">
                        <div className="info-icon">⏰</div>
                        <h3>Response Time</h3>
                        <p>Within 24 hours</p>
                    </div>
                </div>
            </div>
        </section>
    );
}

export default Contact;
