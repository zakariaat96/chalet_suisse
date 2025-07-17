import React, { useState } from 'react';
import { FiMapPin, FiMail, FiPhone } from 'react-icons/fi';
import '../styles/ContactCTA.css';

const ContactSection = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    message: ''
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState('');
  const [submitStatus, setSubmitStatus] = useState(''); // 'success' or 'error'

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Basic validation
    if (!formData.name.trim() || !formData.email.trim() || !formData.message.trim()) {
      setSubmitMessage('Please fill in all required fields.');
      setSubmitStatus('error');
      return;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setSubmitMessage('Please enter a valid email address.');
      setSubmitStatus('error');
      return;
    }

    setIsSubmitting(true);
    setSubmitMessage('');
    setSubmitStatus('');

    try {
      const response = await fetch(`${process.env.REACT_APP_API_BASE_URL}/contact_form.php`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          ...formData,
          formType: 'general' // Specify this is a general contact form
        })
      });

      const data = await response.json();

      if (data.success) {
        setSubmitMessage(data.message);
        setSubmitStatus('success');
        // Reset form
        setFormData({
          name: '',
          email: '',
          phone: '',
          message: ''
        });
      } else {
        setSubmitMessage(data.message || 'Failed to send message. Please try again.');
        setSubmitStatus('error');
      }
    } catch (error) {
      console.error('Contact form error:', error);
      setSubmitMessage('Network error. Please check your connection and try again.');
      setSubmitStatus('error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="contact-section">
      <div className="contact-container">
        <div className="contact-header">
          <h2 className="contact-title">Get In Touch</h2>
          <p className="contact-subtitle">We'd love to hear from you about your Swiss chalet needs</p>
        </div>
        
        <div className="contact-content">
          <div className="contact-info">
            <div className="contact-info-card">
              <h3>Contact Information</h3>
              <div className="contact-detail">
                <FiMapPin className="contact-icon" size={24} />
                <div>
                  <h4>Our Office</h4>
                  <p>Pl. Numa-Droz 2000 Neuchâtel Switzerland</p>
                </div>
              </div>
              <div className="contact-detail">
                <FiMail className="contact-icon" size={24} />
                <div>
                  <h4>Email Us</h4>
                  <p>senent@orbi.network</p>
                </div>
              </div>
              <div className="contact-detail">
                <FiPhone className="contact-icon" size={24} />
                <div>
                  <h4>Call Us</h4>
                  <p>+41 79 123 45 67</p>
                </div>
              </div>
            </div>
            
            <div className="contact-form">
              <h3>Send Us a Message</h3>
              
              {submitMessage && (
                <div className={`submit-message ${submitStatus}`}>
                  {submitMessage}
                </div>
              )}
              
              <form onSubmit={handleSubmit}>
                <div className="form-group">
                  <input 
                    type="text" 
                    name="name"
                    placeholder="Your Name *" 
                    value={formData.name}
                    onChange={handleInputChange}
                    required 
                    disabled={isSubmitting}
                  />
                </div>
                <div className="form-group">
                  <input 
                    type="email" 
                    name="email"
                    placeholder="Your Email *" 
                    value={formData.email}
                    onChange={handleInputChange}
                    required 
                    disabled={isSubmitting}
                  />
                </div>
                <div className="form-group">
                  <input 
                    type="tel" 
                    name="phone"
                    placeholder="Phone Number" 
                    value={formData.phone}
                    onChange={handleInputChange}
                    disabled={isSubmitting}
                  />
                </div>
                <div className="form-group">
                  <textarea 
                    name="message"
                    placeholder="Your Message *" 
                    rows="5" 
                    value={formData.message}
                    onChange={handleInputChange}
                    required
                    disabled={isSubmitting}
                  ></textarea>
                </div>
                <button 
                  type="submit" 
                  className="submit-btn"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <span className="spinner"></span>
                      Sending...
                    </>
                  ) : (
                    'Send Message'
                  )}
                </button>
              </form>
            </div>
          </div>
          
          <div className="contact-map">
            <iframe 
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2734.5234!2d6.9327!3d46.9956!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x478e0c0a8a0a0a0a%3A0x0a0a0a0a0a0a0a0a!2sPl.%20Numa-Droz%2C%202000%20Neuch%C3%A2tel%2C%20Switzerland!5e0!3m2!1sen!2sus!4v1620000000000!5m2!1sen!2sus" 
              width="100%" 
              height="100%" 
              style={{border:0}} 
              allowFullScreen="" 
              loading="lazy"
              title="Our Location in Neuchâtel"
            ></iframe>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ContactSection;