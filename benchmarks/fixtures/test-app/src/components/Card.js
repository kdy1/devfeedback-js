export const Card = {
  render: (title, content) => {
    return `
      <div class="card">
        <h3>${title}</h3>
        <div class="card-content">${content}</div>
      </div>
    `;
  }
};
