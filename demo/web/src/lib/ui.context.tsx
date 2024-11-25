// app/context/UIContext.tsx
'use client';

import Alert from '@mui/material/Alert';
import CircularProgress from '@mui/material/CircularProgress';
import Snackbar from '@mui/material/Snackbar';
import React, { createContext, useContext, useState, ReactNode, useMemo, useEffect } from 'react';
import { ConfirmDialog, ConfirmDialogMessage, ConfirmDialogProps } from '../components/confirm-dialog';
import Backdrop from '@mui/material/Backdrop';
import { SignInDialog, SignInDialogMessage, SignInDialogProps } from '@/components/signin-dialog';
import { RequestStarDialog, RequestStarDialogProps } from '@/components/request-star-dialog';

export interface UIContextType {
  setLoading: (value: boolean) => void;
  setError: (value) => void;
  
  confirm: (message: ConfirmDialogMessage, onConfirmed: () => void) => void;
  signIn: (message: SignInDialogMessage) => void;
  requestStar: () => void;
}

const UIContext = createContext<UIContextType | undefined>(undefined);

export const UIContextProvider = ({ children }: { children: ReactNode }) => {

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [confirmDialogProps, setConfirmDialogProps] = useState<ConfirmDialogProps>(null);  
  const [signInDialogProps, setSignInDialogProps] = useState<SignInDialogProps>(null);
  const [RequestStarDialogProps, setRequestStarDialogProps] = useState<RequestStarDialogProps>(null);
  const handleCloseError = () => setError(null);

  const value = useMemo(() => {
    const confirm = (message: ConfirmDialogMessage, onConfirmed: () => void) => {
      setConfirmDialogProps({...message, open: true, onConfirmed, closeFunc: () => setConfirmDialogProps(null)});
    };

    const signIn = (message: SignInDialogMessage) => {
      setSignInDialogProps({...message, open: true, closeFunc: () => setSignInDialogProps(null)});
    };    

    const requestStar = () => {
      setRequestStarDialogProps({open: true, closeFunc: () => setRequestStarDialogProps(null)});
    };

    return { setLoading, setError, confirm, signIn, requestStar };
  }, []);


  useEffect(() => {
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      event.stopPropagation();
      event.preventDefault();
      console.error("----------------> Unhandled promise rejection:", event.reason);
    };

    const handleError = (event: ErrorEvent) => {
      console.error("########################> Global error caught:", event.message);
    };

    window.addEventListener('unhandledrejection', handleUnhandledRejection);
    window.addEventListener('error', handleError);

    return () => {
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
      window.removeEventListener('error', handleError);
    };
  }, []);
  
  return (
    <>
      <UIContext.Provider value={value}>
        {children}
      </UIContext.Provider>

      {loading && (
        <Backdrop sx={(theme) => ({ color: '#fff', zIndex: theme.zIndex.drawer + 1 })} open={true}>
          <CircularProgress color="inherit" />
        </Backdrop>
      )}

      <Snackbar open={!!error} autoHideDuration={4000} onClose={handleCloseError}>
        <Alert onClose={handleCloseError} severity="error" sx={{ width: '100%' }}>
          {'' + error}
        </Alert>
      </Snackbar>

      <ConfirmDialog {...confirmDialogProps} />
      <SignInDialog {...signInDialogProps}/>
      <RequestStarDialog {...RequestStarDialogProps}/>
    </>
  );
};

export const useUIContext = () => {
  const context = useContext(UIContext);
  if (!context) {
    throw new Error('useUI must be used within a UIProvider');
  }
  return context;
};
