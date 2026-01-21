export const List = {
  render: (items) => {
    return `
      <ul class="list">
        ${items.map(item => `<li>${item}</li>`).join('')}
      </ul>
    `;
  }
};
