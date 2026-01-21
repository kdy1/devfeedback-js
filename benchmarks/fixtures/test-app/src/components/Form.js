export const Form = {
  render: (fields) => {
    return `
      <form>
        ${fields.map(field => `
          <div class="form-field">
            <label>${field.label}</label>
            <input type="${field.type}" name="${field.name}" />
          </div>
        `).join('')}
      </form>
    `;
  }
};
