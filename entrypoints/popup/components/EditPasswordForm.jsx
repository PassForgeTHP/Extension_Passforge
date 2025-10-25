import { useState, useEffect } from 'react';
import {
  HiX,
  HiKey,
  HiRefresh,
  HiChevronDown,
  HiChevronUp,
  HiPencil
} from 'react-icons/hi';
import FormField from './FormField';
import { generatePassword, calculatePasswordStrength } from '../../../services/passwordGenerator';

function EditPasswordForm({ password, onClose, onSubmit }) {
  const [formData, setFormData] = useState({
    name: password?.name || '',
    domain: password?.domain || '',
    username: password?.username || '',
    password: password?.password || '',
    notes: password?.notes || ''
  });

  const [errors, setErrors] = useState({});
  const [showGenerator, setShowGenerator] = useState(false);
  const [generatorOptions, setGeneratorOptions] = useState({
    length: 16,
    lowercase: true,
    uppercase: true,
    numbers: true,
    symbols: true
  });
  const [passwordStrength, setPasswordStrength] = useState({ score: 0, level: 'empty', percentage: 0 });

  useEffect(() => {
    const strength = calculatePasswordStrength(formData.password);
    setPasswordStrength(strength);
  }, [formData.password]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleGeneratePassword = () => {
    const newPassword = generatePassword(generatorOptions);
    setFormData(prev => ({ ...prev, password: newPassword }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    const newErrors = {};
    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }
    if (!formData.username.trim()) {
      newErrors.username = 'Username is required';
    }
    if (!formData.password.trim()) {
      newErrors.password = 'Password is required';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setErrors({});
    onSubmit(formData);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title-wrapper">
            <HiPencil className="modal-icon" />
            <h2 className="modal-title">Edit Password</h2>
          </div>
          <button onClick={onClose} className="modal-close-btn" title="Close">
            <HiX />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <FormField
            label="Name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            placeholder="e.g., GitHub Account"
            required
          />
          <FormField
            label="Domain"
            name="domain"
            value={formData.domain}
            onChange={handleChange}
            placeholder="e.g., github.com"
          />
          <FormField
            label="Username"
            name="username"
            value={formData.username}
            onChange={handleChange}
            placeholder="Enter username or email"
            required
          />
          <FormField
            label="Password"
            type="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            placeholder="Enter password"
            required
          />
          {formData.password && (
            <div className="password-strength">
              <div className="strength-bar">
                <div
                  className={`strength-fill strength-${passwordStrength.level}`}
                  style={{ width: `${passwordStrength.percentage}%` }}
                />
              </div>
              <div className={`strength-label strength-${passwordStrength.level}`}>
                {passwordStrength.level === 'weak' ? 'Weak password' :
                 passwordStrength.level === 'medium' ? 'Medium password' : 'Strong password'}
              </div>
            </div>
          )}
          <button
            type="button"
            onClick={() => setShowGenerator(!showGenerator)}
            className="generator-toggle-btn"
          >
            <HiKey />
            {showGenerator ? 'Hide Generator' : 'Generate Password'}
            {showGenerator ? <HiChevronUp /> : <HiChevronDown />}
          </button>

          {showGenerator && (
            <div className="password-generator">
              <div className="generator-option">
                <label className="generator-label">
                  Length: {generatorOptions.length}
                </label>
                <input
                  type="range"
                  min="8"
                  max="32"
                  value={generatorOptions.length}
                  onChange={(e) => setGeneratorOptions(prev => ({ ...prev, length: parseInt(e.target.value) }))}
                  className="generator-slider"
                />
              </div>
              <div className="generator-checkboxes">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={generatorOptions.lowercase}
                    onChange={(e) => setGeneratorOptions(prev => ({ ...prev, lowercase: e.target.checked }))}
                  />
                  <span>a-z</span>
                </label>
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={generatorOptions.uppercase}
                    onChange={(e) => setGeneratorOptions(prev => ({ ...prev, uppercase: e.target.checked }))}
                  />
                  <span>A-Z</span>
                </label>
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={generatorOptions.numbers}
                    onChange={(e) => setGeneratorOptions(prev => ({ ...prev, numbers: e.target.checked }))}
                  />
                  <span>0-9</span>
                </label>
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={generatorOptions.symbols}
                    onChange={(e) => setGeneratorOptions(prev => ({ ...prev, symbols: e.target.checked }))}
                  />
                  <span>!@#$</span>
                </label>
              </div>
              <button
                type="button"
                onClick={handleGeneratePassword}
                className="generate-btn"
              >
                <HiRefresh />
                Generate Password
              </button>
            </div>
          )}

          <FormField
            label="Notes"
            type="textarea"
            name="notes"
            value={formData.notes}
            onChange={handleChange}
            placeholder="Add any additional notes (optional)"
          />

          {Object.keys(errors).length > 0 && (
            <div className="form-errors">
              {Object.values(errors).map((error, idx) => (
                <div key={idx} className="form-error-item">{error}</div>
              ))}
            </div>
          )}

          <div className="modal-footer">
            <button
              type="button"
              onClick={onClose}
              className="btn-cancel"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-submit"
            >
              <HiPencil />
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default EditPasswordForm;
