interface Item {
  id: number;
  name: string;
  price: number;
}

interface RenderProps {
  title: string;
  items: Item[];
  [key: string]: any;
}

export function render(container: HTMLElement, props: RenderProps): void {
  container.innerHTML = `
    <div class="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      <div class="container mx-auto px-4 py-8">
        <header class="mb-8">
          <h1 class="text-4xl font-bold text-gradient mb-2">${props.title}</h1>
          <p class="text-slate-600 dark:text-slate-400">A modern benchmark application</p>
        </header>

        <main class="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          ${props.items.map(item => `
            <div class="bg-white dark:bg-slate-800 rounded-lg shadow-lg p-6 hover:shadow-xl transition-shadow duration-300">
              <div class="flex items-center justify-between mb-4">
                <h3 class="text-xl font-semibold text-slate-900 dark:text-white">${item.name}</h3>
                <span class="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-primary-100 text-primary-800 dark:bg-primary-900 dark:text-primary-200">
                  $${item.price.toFixed(2)}
                </span>
              </div>
              <p class="text-slate-600 dark:text-slate-300 text-sm">Product ID: ${item.id}</p>
              <button class="mt-4 w-full bg-primary-600 hover:bg-primary-700 text-white font-medium py-2 px-4 rounded-md transition-colors duration-200">
                Add to Cart
              </button>
            </div>
          `).join('')}
        </main>

        <footer class="mt-12 text-center text-slate-600 dark:text-slate-400 text-sm">
          <p>Built with modern bundlers and Tailwind CSS</p>
        </footer>
      </div>
    </div>
  `;
}
