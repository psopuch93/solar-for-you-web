// frontend/src/components/ConfirmDialog.js
import React from 'react';
import { AlertTriangle, HelpCircle, Info, X } from 'lucide-react';

// Typy dialogów
export const DIALOG_TYPES = {
  CONFIRM: 'confirm',
  DELETE: 'delete',
  INFO: 'info',
  WARNING: 'warning'
};

const ConfirmDialog = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = "OK",
  cancelText = "Anuluj",
  type = DIALOG_TYPES.CONFIRM
}) => {
  if (!isOpen) return null;

  // Definicje kolorów i ikon dla różnych typów dialogów
  const dialogConfig = {
    [DIALOG_TYPES.CONFIRM]: {
      icon: <HelpCircle size={24} className="text-blue-500" />,
      confirmButtonClass: "bg-blue-500 hover:bg-blue-600",
      title: title || "Potwierdzenie"
    },
    [DIALOG_TYPES.DELETE]: {
      icon: <AlertTriangle size={24} className="text-red-500" />,
      confirmButtonClass: "bg-red-500 hover:bg-red-600",
      title: title || "Usunąć element?"
    },
    [DIALOG_TYPES.INFO]: {
      icon: <Info size={24} className="text-green-500" />,
      confirmButtonClass: "bg-green-500 hover:bg-green-600",
      title: title || "Informacja"
    },
    [DIALOG_TYPES.WARNING]: {
      icon: <AlertTriangle size={24} className="text-yellow-500" />,
      confirmButtonClass: "bg-yellow-500 hover:bg-yellow-600",
      title: title || "Ostrzeżenie"
    }
  };

  const { icon, confirmButtonClass, title: defaultTitle } = dialogConfig[type];

  const handleOverlayClick = (e) => {
    // Zamknij dialog tylko gdy kliknięto w tło, a nie sam dialog
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4"
      onClick={handleOverlayClick}
    >
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md overflow-hidden transform transition-all">
        {/* Nagłówek */}
        <div className="flex justify-between items-center p-4 border-b">
          <div className="flex items-center">
            {icon}
            <h3 className="ml-2 text-lg font-medium text-gray-700">{title || defaultTitle}</h3>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 focus:outline-none"
          >
            <X size={20} />
          </button>
        </div>

        {/* Treść */}
        <div className="p-6">
          <p className="text-gray-600">{message}</p>
        </div>

        {/* Przyciski */}
        <div className="px-6 py-4 bg-gray-50 flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
          >
            {cancelText}
          </button>
          <button
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className={`px-4 py-2 border border-transparent rounded-md text-white ${confirmButtonClass} focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmDialog;