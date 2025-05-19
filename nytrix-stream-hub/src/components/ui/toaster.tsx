import { useToast } from "@/hooks/use-toast"
import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
} from "@/components/ui/toast"

export function Toaster() {
  const { toasts } = useToast()

  return (
    <ToastProvider>
      {toasts.map(function ({ id, title, description, action, ...props }) {
        return (
          <Toast key={id} {...props} className="p-3 sm:p-4 w-full max-w-[280px] mx-auto sm:max-w-sm data-[swipe=cancel]:translate-x-0 data-[swipe=end]:translate-x-[var(--radix-toast-swipe-end-x)] data-[swipe=move]:translate-x-[var(--radix-toast-swipe-move-x)] data-[state=closed]:animate-toast-hide data-[state=open]:animate-toast-slide-in-bottom data-[swipe=move]:transition-none sm:data-[state=open]:animate-toast-slide-in-right">
            <div className="grid gap-1">
              {title && <ToastTitle className="text-sm sm:text-base font-medium">{title}</ToastTitle>}
              {description && (
                <ToastDescription className="text-xs sm:text-sm">{description}</ToastDescription>
              )}
            </div>
            {action}
            <ToastClose />
          </Toast>
        )
      })}
      <ToastViewport className="p-2 sm:p-4 md:p-6 fixed bottom-0 z-[100] flex max-h-screen w-full flex-col-reverse sm:right-0 sm:flex-col md:max-w-[420px]" />
    </ToastProvider>
  )
}
