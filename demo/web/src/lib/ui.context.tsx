// app/context/UIContext.tsx
'use client';

import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import CircularProgress from '@mui/material/CircularProgress';
import Snackbar from '@mui/material/Snackbar';
import React, { createContext, useContext, useState, ReactNode, useMemo, useEffect } from 'react';

export interface UIContextType {
  setLoading: (value: boolean) => void;
  setError: (value) => void;
}

interface GlobalUIComponentsProps {
  loading: boolean;
  error: any;
  setError: (value) => void;
}

export function GlobalUIComponents(props:GlobalUIComponentsProps) {  
  const handleClose = () => props.setError(null);
  return (
    <>
      {props.loading && (
        <Box
          sx={{
            position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', zIndex: 1300,
            display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255, 255, 255, 0.7)'
          }}
        >
          <CircularProgress />
        </Box>
      )}
      <Snackbar open={!!props.error} autoHideDuration={4000} onClose={handleClose}>
        <Alert onClose={handleClose} severity="error" sx={{ width: '100%' }}>
          {'' + props.error}
        </Alert>
      </Snackbar>
    </>
  )
}

const UIContext = createContext<UIContextType | undefined>(undefined);

export const UIContextProvider = ({ children }: { children: ReactNode }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const value = useMemo(() => ({setLoading, setError}), [setLoading, setError]);

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
      <GlobalUIComponents loading={loading} error={error} setError={setError} />
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
