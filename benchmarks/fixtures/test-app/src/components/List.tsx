export const List = {
  render: (items: string[]): string => {
    return `
      <ul class="space-y-2 bg-white dark:bg-slate-800 p-4 rounded-lg shadow-md">
        ${items.map(item => `
          <li class="flex items-center space-x-3 p-3 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-md transition-colors duration-150">
            <svg class="flex-shrink-0 w-5 h-5 text-primary-500" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"></path>
            </svg>
            <span class="text-slate-700 dark:text-slate-300">${item}</span>
          </li>
        `).join('')}
      </ul>
    `;
  }
};
