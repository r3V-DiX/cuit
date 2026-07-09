'use client';

// admin-ui/components/ui/ConfirmModal.tsx
// A simplified wrapper around useModal for quick confirmations.

import { useModal, type ModalOptions } from './Modal';
import Button from './Button';

interface ConfirmButtonProps {
  label: string;
  options: ModalOptions;
  buttonVariant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  buttonSize?: 'sm' | 'md' | 'lg';
  className?: string;
  disabled?: boolean;
}

export default function ConfirmButton({
  label,
  options,
  buttonVariant = 'danger',
  buttonSize = 'sm',
  className = '',
  disabled = false,
}: ConfirmButtonProps) {
  const { openModal } = useModal();

  return (
    <Button
      variant={buttonVariant}
      size={buttonSize}
      onClick={() => openModal(options)}
      className={className}
      disabled={disabled}
    >
      {label}
    </Button>
  );
}
