// frontend/src/contexts/DialogContext.js
import React, { createContext, useContext, useState, useCallback } from 'react';
import ConfirmDialog, { DIALOG_TYPES } from '../components/ConfirmDialog';

const DialogContext = createContext();

export const useDialog = () => useContext(DialogContext);

export const DialogProvider = ({ children }) => {
  const [dialogState, setDialogState] = useState({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
    confirmText: 'OK',
    cancelText: 'Anuluj',
    type: DIALOG_TYPES.CONFIRM
  });

  const openDialog = useCallback((options) => {
    setDialogState({
      isOpen: true,
      title: options.title || '',
      message: options.message || '',
      onConfirm: options.onConfirm || (() => {}),
      confirmText: options.confirmText || 'OK',
      cancelText: options.cancelText || 'Anuluj',
      type: options.type || DIALOG_TYPES.CONFIRM
    });
  }, []);

  const closeDialog = useCallback(() => {
    setDialogState(prev => ({
      ...prev,
      isOpen: false
    }));
  }, []);

  // Helper functions for common dialog types
  const confirm = useCallback((message, onConfirm, options = {}) => {
    openDialog({
      message,
      onConfirm,
      type: DIALOG_TYPES.CONFIRM,
      ...options
    });
  }, [openDialog]);

  const confirmDelete = useCallback((message, onConfirm, options = {}) => {
    openDialog({
      message,
      onConfirm,
      type: DIALOG_TYPES.DELETE,
      confirmText: options.confirmText || 'Usuń',
      ...options
    });
  }, [openDialog]);

  const showInfo = useCallback((message, options = {}) => {
    openDialog({
      message,
      type: DIALOG_TYPES.INFO,
      ...options
    });
  }, [openDialog]);

  const showWarning = useCallback((message, options = {}) => {
    openDialog({
      message,
      type: DIALOG_TYPES.WARNING,
      ...options
    });
  }, [openDialog]);

  return (
    <DialogContext.Provider
      value={{
        openDialog,
        closeDialog,
        confirm,
        confirmDelete,
        showInfo,
        showWarning
      }}
    >
      {children}
      <ConfirmDialog
        isOpen={dialogState.isOpen}
        onClose={closeDialog}
        onConfirm={dialogState.onConfirm}
        title={dialogState.title}
        message={dialogState.message}
        confirmText={dialogState.confirmText}
        cancelText={dialogState.cancelText}
        type={dialogState.type}
      />
    </DialogContext.Provider>
  );
};