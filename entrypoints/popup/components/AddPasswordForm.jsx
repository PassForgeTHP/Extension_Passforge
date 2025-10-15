import { useState } from 'react';
import FormField from './FormField';

function AddPasswordForm({ onClose, onSubmit }) {
  const [formData, setFormData] = useState({
    name: '',
    domain: '',
    username: '',
    password: '',
    notes: ''
  });

  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
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
    setFormData({
      name: '',
      domain: '',
      username: '',
      password: '',
      notes: ''
    });
  };
  return (
    <div className="add-password-form" style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000
    }}>
      <div style={{
        background: 'white',
        padding: '20px',
        borderRadius: '8px',
        width: '90%',
        maxWidth: '400px',
        maxHeight: '80vh',
        overflow: 'auto'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h2 style={{ margin: 0, fontSize: '1.2rem' }}>Add Password</h2>
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              fontSize: '1.5rem',
              cursor: 'pointer',
              color: '#666'
            }}
          >
            ×
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
          <FormField
            label="Notes"
            type="textarea"
            name="notes"
            value={formData.notes}
            onChange={handleChange}
            placeholder="Add any additional notes (optional)"
          />

          {Object.keys(errors).length > 0 && (
            <div style={{
              padding: '8px 12px',
              background: '#fee',
              border: '1px solid #fcc',
              borderRadius: '4px',
              marginTop: '12px'
            }}>
              {Object.values(errors).map((error, idx) => (
                <div key={idx} style={{ color: '#c33', fontSize: '0.8rem' }}>{error}</div>
              ))}
            </div>
          )}

          <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', marginTop: '16px' }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                background: 'transparent',
                border: '1px solid #ddd',
                color: '#666',
                cursor: 'pointer',
                fontSize: '0.85rem',
                padding: '8px 16px',
                borderRadius: '4px'
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              style={{
                background: 'var(--medium-red)',
                border: 'none',
                color: 'white',
                cursor: 'pointer',
                fontSize: '0.85rem',
                padding: '8px 16px',
                borderRadius: '4px'
              }}
            >
              Add Password
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default AddPasswordForm;
