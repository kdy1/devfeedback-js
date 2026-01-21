export const Modal = {
  render: (isOpen, content) => {
    if (!isOpen) return '';
    return `
      <div class="modal">
        <div class="modal-backdrop"></div>
        <div class="modal-content">${content}</div>
      </div>
    `;
  }
};
