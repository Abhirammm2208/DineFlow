import React from 'react';
import { FiX, FiAlertCircle, FiCheckCircle, FiInfo } from 'react-icons/fi';

interface AlertProps {
  type: 'error' | 'success' | 'info' | 'warning';
  message: string;
  onClose?: () => void;
}

const typeStyles = {
  error: 'bg-red-50 border border-red-200 text-red-700',
  success: 'bg-green-50 border border-green-200 text-green-700',
  info: 'bg-blue-50 border border-blue-200 text-blue-700',
  warning: 'bg-yellow-50 border border-yellow-200 text-yellow-700',
};

const icons = {
  error: FiAlertCircle,
  success: FiCheckCircle,
  info: FiInfo,
  warning: FiAlertCircle,
};

export const Alert: React.FC<AlertProps> = ({ type, message, onClose }) => {
  const Icon = icons[type];

  return (
    <div className={`${typeStyles[type]} rounded-lg p-4 flex items-start gap-3 animate-slideUp`}>
      <Icon className="flex-shrink-0 mt-0.5" />
      <p className="flex-1 text-sm font-medium">{message}</p>
      {onClose && (
        <button
          onClick={onClose}
          className="flex-shrink-0 hover:opacity-70 transition-opacity"
        >
          <FiX />
        </button>
      )}
    </div>
  );
};

interface LoaderProps {
  message?: string;
}

export const Loader: React.FC<LoaderProps> = ({ message = 'Loading...' }) => {
  return (
    <div className="flex flex-col items-center justify-center py-12">
      <div className="w-8 h-8 border-4 border-orange-200 border-t-orange-600 rounded-full animate-spin" />
      {message && <p className="mt-4 text-gray-600">{message}</p>}
    </div>
  );
};

interface ModalProps {
  isOpen: boolean;
  title?: string;
  children: React.ReactNode;
  onClose?: () => void;
  actions?: React.ReactNode;
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  title,
  children,
  onClose: _onClose,
  actions,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 animate-fadeIn">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 animate-slideUp">
        {title && (
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-bold text-gray-900">{title}</h2>
          </div>
        )}
        <div className="px-6 py-4">{children}</div>
        {actions && (
          <div className="px-6 py-4 border-t border-gray-200 flex gap-3 justify-end">
            {actions}
          </div>
        )}
      </div>
    </div>
  );
};
