interface FormField {
  label: string;
  type: string;
  name: string;
}

export const Form = {
  render: (fields: FormField[]): string => {
    return `
      <form class="space-y-6 bg-white dark:bg-slate-800 p-6 rounded-lg shadow-md">
        ${fields.map(field => `
          <div class="form-field">
            <label for="${field.name}" class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              ${field.label}
            </label>
            <input
              type="${field.type}"
              name="${field.name}"
              id="${field.name}"
              class="mt-1 block w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm placeholder-slate-400 focus:outline-none focus:ring-primary-500 focus:border-primary-500 dark:bg-slate-700 dark:text-white sm:text-sm"
            />
          </div>
        `).join('')}
        <button type="submit" class="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500">
          Submit
        </button>
      </form>
    `;
  }
};
