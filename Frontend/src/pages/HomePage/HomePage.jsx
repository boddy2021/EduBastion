import React from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../../components/Navbar/Navbar';
import Button from '../../components/UI/Button';
import styles from './HomePage.module.css';

function HomePage() {
    return (
        <div className={styles.container}>
            <Navbar />

            <main className={styles.mainContent}>
                <section className={styles.hero}>
                    <div className={styles.heroText}>
                        <h1 className={styles.title}>
                            Secure & Intelligent Academic Evaluation <br />
                            <span className={styles.highlight}></span>
                        </h1>
                        <p className={styles.subtitle}>
                             Platform for students and professors with automated student assessment and 
                            advanced fraud detection.
                        </p>
                        <div className={styles.ctaGroup}>
                            <Link to="/register" className={styles.inlineStyle}>
                                <Button>Start Now</Button>
                            </Link>
                        </div>
                    </div>

                </section>

                <section className={styles.features}>
                    <div className={styles.featureCard}>
                        <h3>AI Proctoring</h3>
                        <p>Real-time monitoring and behavioral analysis to ensure exam integrity.</p>
                    </div>
                    <div className={styles.featureCard}>
                        <h3>Instant Results</h3>
                        <p>Automated grading for tests with detailed feedback.</p>
                    </div>
                    <div className={styles.featureCard}>
                        <h3>Secure Browser</h3>
                        <p>Lockdown browser capabilities to prevent unauthorized tab switching.</p>
                    </div>
                </section>
            </main>
        </div>
    );
}

export default HomePage;