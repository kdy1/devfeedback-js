export function render(container, props) {
  container.innerHTML = `
    <div class="app">
      <h1>${props.title}</h1>
      <div class="content">
        ${props.items.map(item => `
          <div class="item">
            <span>${item.name}</span>
            <span>$${item.price}</span>
          </div>
        `).join('')}
      </div>
    </div>
  `;
}
