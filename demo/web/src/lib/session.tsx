"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';
import { SignInDetail } from './user.dto';

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

  const load = () => {
    const storedSession = localStorage.getItem('session');
    if (storedSession) {
      const d = SignInDetail.with(JSON.parse(storedSession));
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
    /*const t = {
      "user": {
        "id": 1,
        "name": "qiangyt",
        "email": "qiangyt@wxcount.com",
        "displayName": "Yiting Qiang",
        "avatarUrl": "https://avatars.githubusercontent.com/u/30411408?v=4",
        "githubProfileUrl": "https://github.com/qiangyt",
        "admin": true,
        "createdAt": "2024-10-28T07:46:56.000Z",
        "updatedAt": "2024-10-28T07:54:06.000Z",
        "grantLevel": "Full",
        "creater": null,
        "updater": null
      },
      "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOjEsImlhdCI6MTczMDQ3ODUzNCwiZXhwIjoxNzM0MDc4NTM0fQ.tXdcGb5KMXP7_8B268kK1XXiiBt5Abn1lF7KkTaYCpU",
      "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOjEsImlhdCI6MTczMDQ3ODUzNCwiZXhwIjo0MzIyNDc4NTM0fQ.WkFYeRFDe06SfTbqvalbLvTI1E5YCnjbxABKzi3Do3s",
      "githubAccessToken": null,
      "githubRefreshToken": null
    };
    localStorage.setItem("session", JSON.stringify(t, null, 4));*/

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

