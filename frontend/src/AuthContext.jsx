// Keeps track of the logged in user (session) and their profile
// (username + is_admin) and shares it with the whole app.
import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from './supabaseClient';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [sessionLoading, setSessionLoading] = useState(true);
  // Which user id we have finished loading a profile for
  const [profileLoadedFor, setProfileLoadedFor] = useState(null);

  // Get the current session and listen for login/logout
  useEffect(() => {
    supabase.auth.getSession().then(function (result) {
      setSession(result.data.session);
      setSessionLoading(false);
    });

    const listener = supabase.auth.onAuthStateChange(function (event, newSession) {
      setSession(newSession);
    });

    return function () {
      listener.data.subscription.unsubscribe();
    };
  }, []);

  // Load the profile every time the logged in user changes
  const userId = session ? session.user.id : null;

  useEffect(() => {
    if (!userId) {
      setProfile(null);
      setProfileLoadedFor(null);
      return;
    }

    async function loadProfile() {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, username, is_admin')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('Could not load profile:', error.message);
        setProfile(null);
      } else {
        setProfile(data);
      }
      setProfileLoadedFor(userId);
    }

    loadProfile();
  }, [userId]);

  // We are loading if we don't know the session yet,
  // or if we have a user but their profile isn't loaded yet.
  let loading = false;
  if (sessionLoading) {
    loading = true;
  } else if (userId && profileLoadedFor !== userId) {
    loading = true;
  }

  async function logout() {
    await supabase.auth.signOut();
  }

  const value = {
    session: session,
    user: session ? session.user : null,
    profile: profile,
    isAdmin: profile ? profile.is_admin === true : false,
    loading: loading,
    logout: logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// Use this in components: const { user, profile } = useAuth();
export function useAuth() {
  return useContext(AuthContext);
}
