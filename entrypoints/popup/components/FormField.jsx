function FormField({ label, type = 'text', name, value, onChange, placeholder, required = false }) {
  return (
    <div className="form-field" style={{ marginBottom: '12px' }}>
      <label
        htmlFor={name}
        style={{
          display: 'block',
          marginBottom: '4px',
          fontSize: '0.85rem',
          fontWeight: '500'
        }}
      >
        {label} {required && <span style={{ color: 'var(--medium-red)' }}>*</span>}
      </label>
      {type === 'textarea' ? (
        <textarea
          id={name}
          name={name}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          required={required}
          style={{
            width: '100%',
            padding: '8px',
            fontSize: '0.85rem',
            borderRadius: '4px',
            border: '1px solid #ddd',
            fontFamily: 'inherit',
            minHeight: '80px',
            resize: 'vertical'
          }}
        />
      ) : (
        <input
          type={type}
          id={name}
          name={name}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          required={required}
          style={{
            width: '100%',
            padding: '8px',
            fontSize: '0.85rem',
            borderRadius: '4px',
            border: '1px solid #ddd'
          }}
        />
      )}
    </div>
  );
}

export default FormField;
