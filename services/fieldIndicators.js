/**
 * Field indicators service for content script
 * Adds visual indicators (outline and icon) to detected form fields
 */

/**
 * Add visual indicator to a detected form field
 * Shows a red outline and lock icon when the field is focused
 * @param {HTMLInputElement} field - The input field to add indicator to
 */
export function addVisualIndicator(field) {
  // Skip if already marked
  if (field.dataset.passforgeDetected) return;

  field.dataset.passforgeDetected = 'true';

  // Create icon using SVG (LockClosedIcon from Heroicons)
  const icon = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  icon.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
  icon.setAttribute('viewBox', '0 0 20 20');
  icon.setAttribute('fill', 'currentColor');
  icon.classList.add('passforge-field-icon');

  const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  path.setAttribute('fill-rule', 'evenodd');
  path.setAttribute('d', 'M10 1a4.5 4.5 0 00-4.5 4.5V9H5a2 2 0 00-2 2v6a2 2 0 002 2h10a2 2 0 002-2v-6a2 2 0 00-2-2h-.5V5.5A4.5 4.5 0 0010 1zm3 8V5.5a3 3 0 10-6 0V9h6z');
  path.setAttribute('clip-rule', 'evenodd');
  icon.appendChild(path);

  // Wrap field in a relative container to properly position icon
  const wrapper = document.createElement('div');
  wrapper.style.cssText = `
    position: relative;
    display: inline-block;
    width: 100%;
  `;

  // Insert wrapper before field
  field.parentNode.insertBefore(wrapper, field);
  // Move field into wrapper
  wrapper.appendChild(field);
  // Add icon to wrapper
  wrapper.appendChild(icon);

  // Function to position icon based on field height
  const updateIconPosition = () => {
    const fieldHeight = field.offsetHeight;
    const iconSize = 16;

    // Calculate vertical center position
    const topPosition = (fieldHeight - iconSize) / 2;

    icon.style.cssText = `
      position: absolute;
      right: 10px;
      top: ${topPosition}px;
      pointer-events: none;
      width: ${iconSize}px;
      height: ${iconSize}px;
      color: #af0024;
      opacity: 0;
      transition: opacity 0.2s ease;
      z-index: 10000;
    `;
  };

  // Position icon initially
  updateIconPosition();

  // Update position if field size changes
  window.addEventListener('resize', updateIconPosition);

  // Show indicator only when field is focused
  field.addEventListener('focus', () => {
    // Add outline
    field.style.outline = '2px solid #af0024';
    field.style.outlineOffset = '2px';
    // Show icon
    icon.style.opacity = '1';
  });

  field.addEventListener('blur', () => {
    // Remove outline
    field.style.outline = '';
    field.style.outlineOffset = '';
    // Hide icon
    icon.style.opacity = '0';
  });
}
