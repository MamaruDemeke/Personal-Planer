import { toast as sonner } from 'vue-sonner'

/**
 * Thin wrapper around vue-sonner so feature code has a stable, framework-free
 * toast API. The <Toaster /> host is mounted once in App.vue.
 *
 * @returns {{ toast: (title: string, description?: string) => string|number,
 *   success: (title: string, description?: string) => string|number,
 *   error: (title: string, description?: string) => string|number,
 *   info: (title: string, description?: string) => string|number,
 *   warning: (title: string, description?: string) => string|number,
 *   dismiss: (id?: string|number) => void }}
 */
export function useToast() {
  return {
    toast: (title, description) => sonner(title, { description }),
    success: (title, description) => sonner.success(title, { description }),
    error: (title, description) => sonner.error(title, { description }),
    info: (title, description) => sonner.info(title, { description }),
    warning: (title, description) => sonner.warning(title, { description }),
    dismiss: (id) => sonner.dismiss(id),
  }
}
