import { toast as sonner } from 'vue-sonner'

/**
 * Thin wrapper around vue-sonner so feature code has a stable, framework-free
 * toast API. The <Toaster /> host is mounted once in App.vue.
 *
 * @returns {{ toast: (title: string, description?: string, options?: object) => string|number,
 *   success: (title: string, description?: string, options?: object) => string|number,
 *   error: (title: string, description?: string, options?: object) => string|number,
 *   info: (title: string, description?: string, options?: object) => string|number,
 *   warning: (title: string, description?: string, options?: object) => string|number,
 *   dismiss: (id?: string|number) => void }}
 */
export function useToast() {
  return {
    toast: (title, description, options) => sonner(title, { description, ...options }),
    success: (title, description, options) => sonner.success(title, { description, ...options }),
    error: (title, description, options) => sonner.error(title, { description, ...options }),
    info: (title, description, options) => sonner.info(title, { description, ...options }),
    warning: (title, description, options) => sonner.warning(title, { description, ...options }),
    dismiss: (id) => sonner.dismiss(id),
  }
}
