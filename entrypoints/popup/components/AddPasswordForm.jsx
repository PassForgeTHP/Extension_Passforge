import FormField from './FormField';

function AddPasswordForm({ onClose, onSubmit }) {
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

        <form>
          <FormField
            label="Title"
            name="title"
            placeholder="e.g., GitHub Account"
            required
          />
          <FormField
            label="Domain"
            name="domain"
            placeholder="e.g., github.com"
          />
          <FormField
            label="Username"
            name="username"
            placeholder="Enter username or email"
            required
          />
          <FormField
            label="Password"
            type="password"
            name="password"
            placeholder="Enter password"
            required
          />
        </form>
      </div>
    </div>
  );
}

export default AddPasswordForm;
