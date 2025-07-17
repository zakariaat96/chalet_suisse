import React, { useEffect, useRef } from 'react';
import Navbar from '../components/Navbar';
import Hero from '../components/Hero';
import PropertyListings from '../components/PropertyListings';
import AboutUs from '../components/AboutUs';
import ContactCTA from '../components/ContactCTA';
import Footer from '../components/Footer';

const Home = ({ scrollTo }) => {
  const aboutRef = useRef(null);
  const contactRef = useRef(null);

  useEffect(() => {
    // Wait for all elements to be rendered
    setTimeout(() => {
      if (scrollTo === 'about' && aboutRef.current) {
        window.scrollTo({
          top: aboutRef.current.offsetTop - 80, // Adjust for navbar height
          behavior: 'smooth'
        });
      }
      else if (scrollTo === 'contact' && contactRef.current) {
        window.scrollTo({
          top: contactRef.current.offsetTop - 80, 
          behavior: 'smooth'
        });
      }
    }, 100); 
  }, [scrollTo]);

  return (
    <div className="home-page">
      <Navbar />
      <Hero />
      <PropertyListings />
      <section ref={aboutRef} id="about-section">
        <AboutUs />
      </section>
      <section ref={contactRef} id="contact-section">
        <ContactCTA />
      </section>
      <Footer />
    </div>
  );
};

export default Home;