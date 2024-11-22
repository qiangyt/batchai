"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';
import { SignInDetail } from './user.dto';
import * as userApi from '@/api/user.api';

export interface SessionState {
  detail: SignInDetail;
  //setSession: React.Dispatch<React.SetStateAction<SignInDetail | null>>;
  redirect: () => void;
  load: () => void;
  save: (signInDetail: SignInDetail)  => void;
  clear: () => void;
  has: () => boolean;
}

export interface Session {
  state: SessionState;
}

export const SessionContext = createContext<Session | undefined>(undefined);

interface SessionProviderProps {
  children: React.ReactNode; 
}

export const SessionProvider: React.FC<{children: React.ReactNode}> = ({ children }) => {
  const [detail, setDetail] = useState<SignInDetail | null>(null);
  
  const redirect = () => {
    const redirectUrl = encodeURIComponent(window.location.href);
    window.location.href = `/rest/v1/auth/github/redirect?redirect_url=${redirectUrl}`;
  };

  const load = async() => {
    const storedSession = localStorage.getItem('session');
    if (storedSession) {
      let d = SignInDetail.with(JSON.parse(storedSession));
      d = await userApi.renewUser(d.refreshToken);
      setDetail(d);
    }
  };

  const save = (signInDetail: SignInDetail) => {
    setDetail(signInDetail);
    localStorage.setItem("session", JSON.stringify(signInDetail, null, 4));
  };

  const clear = () => {
    setDetail(null);
    localStorage.removeItem("session");
  };

  const has = () => {
    return detail !== null && detail !== undefined;
  };

  useEffect(() => {
    const url = new URL(window.location.href);
    const encodedSignInDetail = url.searchParams.get("signInDetail");
    if (encodedSignInDetail) {
      const signInDetail = SignInDetail.with(JSON.parse(decodeURIComponent(encodedSignInDetail)));
      save(signInDetail);

      url.searchParams.delete("signInDetail");
      window.history.replaceState({}, document.title, url.toString());
    } else {
      load();
    }
  }, []);

  const session = { state: {detail, redirect, load, save, clear, has }};
  return (
    <SessionContext.Provider value={session}>
      {children}
    </SessionContext.Provider>
  );
};

export const useSession = () => {
  const context = useContext(SessionContext);
  if (context === undefined) {
    throw new Error('useSession must be used within a SessionProvider');
  }
  return context;
};

