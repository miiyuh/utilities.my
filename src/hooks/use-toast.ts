
"use client"

import { toast as sonnerToast } from 'sonner';

type ToastProps = {
  title?: string;
  description?: string;
  variant?: 'default' | 'destructive' | 'success';
  duration?: number;
};

function toast({ title, description, variant = 'default', duration }: ToastProps) {
  const options = {
    description,
    duration,
  };

  switch (variant) {
    case 'destructive':
      return sonnerToast.error(title, options);
    case 'success':
      return sonnerToast.success(title, options);
    default:
      return sonnerToast(title, options);
  }
}

function useToast() {
  return {
    toast,
    dismiss: sonnerToast.dismiss,
  };
}

export { useToast, toast };
