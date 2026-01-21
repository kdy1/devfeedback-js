export const Button = {
  render: (text, onClick) => {
    return `<button onclick="${onClick}">${text}</button>`;
  }
};
