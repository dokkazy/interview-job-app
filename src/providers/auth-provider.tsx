"use client";

import type React from "react";

import { createContext, useContext, useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import type { User } from "@/lib/types";
import Cookies from "js-cookie"

interface AuthContextType {
  user: User | null;
  loading: boolean;
  setAuthCookies: (user: User | null) => void;
}

export const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  setAuthCookies: () => {},
});

// Helper to ensure Stream user exists
async function ensureStreamUser(user: { id: string, displayName: string, photoURL?: string }) {
  try {
    const res = await fetch('/api/create-stream-user', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: user.id,
        name: user.displayName,
        image: user.photoURL,
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      console.error('Failed to ensure Stream user:', data.error);
    } else {
      console.log('Stream user ensured:', user.id, data);
    }
  } catch (error) {
    console.error('Failed to ensure Stream user:', error);
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Function to set authentication cookies
  const setAuthCookies = (user: User | null) => {
    if (user) {
      // Set auth cookies with expiration of 7 days
      Cookies.set("auth-token", "authenticated", { expires: 7 });
      Cookies.set("user-role", user.role, { expires: 7 });
      Cookies.set("user-id", user.id, { expires: 7 });
    } else {
      // Remove cookies on logout
      Cookies.remove("auth-token");
      Cookies.remove("user-role");
      Cookies.remove("user-id");
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      try {
        if (firebaseUser) {
          // Get additional user data from Firestore
          const userDoc = await getDoc(doc(db, "users", firebaseUser.uid));
          if (userDoc.exists()) {
            const userData = userDoc.data() as Omit<User, "id">;
            const fullUser = {
              ...userData,
              id: firebaseUser.uid,
              email: firebaseUser.email || "",
              displayName: firebaseUser.displayName || "",
              photoURL: firebaseUser.photoURL || "",
            };
            setUser(fullUser);

            // Set auth cookies when user is authenticated
            setAuthCookies(fullUser);

            // Ensure Stream user exists
            await ensureStreamUser(fullUser);
          } else {
            setUser(null);
            setAuthCookies(null);
          }
        } else {
          setUser(null);
          setAuthCookies(null);
        }
      } catch (error) {
        console.error("Auth state change error:", error);
        setUser(null);
        setAuthCookies(null);
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  return (
    <AuthContext.Provider
      value={{ user, loading, setAuthCookies }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
