import { useState } from 'react';
import { HiShieldCheck, HiKey, HiLockClosed, HiExclamation, HiArrowRight, HiArrowLeft } from 'react-icons/hi';
import './styles/explainer.css';

/**
 * MasterPasswordExplainerView Component
 *
 * Educational carousel that explains Zero-Knowledge encryption and Master Password
 * before asking users to create one. This reduces confusion and improves security
 * awareness.
 *
 * Flow:
 * 1. Slide 1: What is a Master Password?
 * 2. Slide 2: Why is it important?
 * 3. Slide 3: Zero-Knowledge = Maximum Security
 * 4. Slide 4: Warning about password loss
 *
 * @param {Function} onComplete - Callback when user finishes reading and clicks "Continue"
 */
function MasterPasswordExplainerView({ onComplete }) {
  const [currentSlide, setCurrentSlide] = useState(0);

  const slides = [
    {
      icon: <HiKey className="slide-icon" />,
      title: "What is a Master Password?",
      content: (
        <>
          <p>
            Your <strong>Master Password</strong> is the single password that protects
            all your other passwords in the vault.
          </p>
          <p>
            Think of it as the key to a safe that contains all your other keys.
          </p>
          <ul>
            <li>One password to remember</li>
            <li>Protects all your stored passwords</li>
            <li>Never stored on our servers</li>
          </ul>
        </>
      ),
      color: "#2196f3"
    },
    {
      icon: <HiShieldCheck className="slide-icon" />,
      title: "Why is it Important?",
      content: (
        <>
          <p>
            Your Master Password is used to <strong>encrypt and decrypt</strong> your
            vault locally on your device.
          </p>
          <p>
            Without it, nobody can access your passwords - not even PassForge servers.
          </p>
          <ul>
            <li>Encrypts your vault with military-grade AES-256</li>
            <li>Uses 600,000 PBKDF2 iterations</li>
            <li>Makes brute-force attacks virtually impossible</li>
          </ul>
        </>
      ),
      color: "#4caf50"
    },
    {
      icon: <HiLockClosed className="slide-icon" />,
      title: "Zero-Knowledge Security",
      content: (
        <>
          <p>
            PassForge uses <strong>Zero-Knowledge</strong> encryption, which means:
          </p>
          <ul>
            <li><strong>We cannot see your passwords</strong> - Ever.</li>
            <li><strong>We cannot decrypt your vault</strong> - Even if we wanted to.</li>
            <li><strong>You are in complete control</strong> - Total privacy.</li>
          </ul>
          <p>
            Your Master Password <strong>never leaves your device</strong>. It's only
            used locally to encrypt/decrypt your data.
          </p>
        </>
      ),
      color: "#9c27b0"
    },
    {
      icon: <HiExclamation className="slide-icon warning" />,
      title: "Important Warning",
      content: (
        <>
          <p className="warning-text">
            <strong>If you forget your Master Password, your data is lost forever.</strong>
          </p>
          <p>
            Because of Zero-Knowledge encryption, there is no "reset password" button.
            We cannot recover your data without your Master Password.
          </p>
          <div className="tip-box">
            <strong>Tips for a strong Master Password:</strong>
            <ul>
              <li>Use at least 12 characters</li>
              <li>Mix uppercase, lowercase, numbers, and symbols</li>
              <li>Make it memorable but unique</li>
              <li>Consider using a passphrase (e.g., "Coffee!Morning@2024")</li>
            </ul>
          </div>
          <p className="recovery-note">
            You will receive a <strong>Recovery Key</strong> in the next step to backup
            your Master Password securely.
          </p>
        </>
      ),
      color: "#ff9800"
    }
  ];

  const handleNext = () => {
    if (currentSlide < slides.length - 1) {
      setCurrentSlide(currentSlide + 1);
    }
  };

  const handlePrevious = () => {
    if (currentSlide > 0) {
      setCurrentSlide(currentSlide - 1);
    }
  };

  const handleComplete = () => {
    onComplete();
  };

  const currentSlideData = slides[currentSlide];

  return (
    <div className="explainer-container">
      <div className="explainer-content">
        {/* Progress indicators */}
        <div className="progress-dots">
          {slides.map((_, index) => (
            <div
              key={index}
              className={`dot ${index === currentSlide ? 'active' : ''} ${index < currentSlide ? 'completed' : ''}`}
              onClick={() => setCurrentSlide(index)}
            />
          ))}
        </div>

        {/* Current slide */}
        <div
          className="slide"
          style={{ borderTopColor: currentSlideData.color }}
        >
          <div className="slide-header" style={{ color: currentSlideData.color }}>
            {currentSlideData.icon}
            <h2>{currentSlideData.title}</h2>
          </div>

          <div className="slide-body">
            {currentSlideData.content}
          </div>
        </div>

        {/* Navigation */}
        <div className="navigation-buttons">
          <button
            onClick={handlePrevious}
            disabled={currentSlide === 0}
            className="btn-nav btn-previous"
          >
            <HiArrowLeft />
            Previous
          </button>

          {currentSlide === slides.length - 1 ? (
            <button
              onClick={handleComplete}
              className="btn-nav btn-complete"
            >
              I Understand
              <HiShieldCheck />
            </button>
          ) : (
            <button
              onClick={handleNext}
              className="btn-nav btn-next"
            >
              Next
              <HiArrowRight />
            </button>
          )}
        </div>

        {/* Skip option (not recommended) */}
        {currentSlide < slides.length - 1 && (
          <button
            onClick={handleComplete}
            className="btn-skip"
          >
            Skip introduction
          </button>
        )}
      </div>
    </div>
  );
}

export default MasterPasswordExplainerView;
