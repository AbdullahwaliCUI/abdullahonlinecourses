'use client'

export type ToastType = 'success' | 'error' | 'warning' | 'info'

export interface Toast {
  id: string
  type: ToastType
  title: string
  message?: string
  duration?: number
}

class ToastManager {
  private toasts: Toast[] = []
  private listeners: ((toasts: Toast[]) => void)[] = []

  subscribe(listener: (toasts: Toast[]) => void) {
    this.listeners.push(listener)
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener)
    }
  }

  private notify() {
    this.listeners.forEach(listener => listener([...this.toasts]))
  }

  show(toast: Omit<Toast, 'id'>) {
    const id = Math.random().toString(36).substr(2, 9)
    const newToast: Toast = {
      id,
      duration: 5000,
      ...toast
    }

    this.toasts.push(newToast)
    this.notify()

    // Auto remove after duration
    if (newToast.duration && newToast.duration > 0) {
      setTimeout(() => {
        this.remove(id)
      }, newToast.duration)
    }

    return id
  }

  remove(id: string) {
    this.toasts = this.toasts.filter(toast => toast.id !== id)
    this.notify()
  }

  clear() {
    this.toasts = []
    this.notify()
  }

  success(title: string, message?: string, duration?: number) {
    return this.show({ type: 'success', title, message, duration })
  }

  error(title: string, message?: string, duration?: number) {
    return this.show({ type: 'error', title, message, duration })
  }

  warning(title: string, message?: string, duration?: number) {
    return this.show({ type: 'warning', title, message, duration })
  }

  info(title: string, message?: string, duration?: number) {
    return this.show({ type: 'info', title, message, duration })
  }
}

export const toast = new ToastManager()