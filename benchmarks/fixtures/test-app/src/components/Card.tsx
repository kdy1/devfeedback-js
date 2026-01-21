export const Card = {
  render: (title: string, content: string): string => {
    return `
      <div class="bg-white dark:bg-slate-800 overflow-hidden shadow-lg rounded-lg border border-slate-200 dark:border-slate-700">
        <div class="px-6 py-4 border-b border-slate-200 dark:border-slate-700">
          <h3 class="text-lg font-semibold text-slate-900 dark:text-white">${title}</h3>
        </div>
        <div class="px-6 py-4">
          <div class="text-slate-700 dark:text-slate-300">${content}</div>
        </div>
      </div>
    `;
  }
};
