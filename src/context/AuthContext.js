/**
 * AuthContext - Authentication and Authorization Context for PMP
 *
 * Provides:
 * - User authentication state
 * - User roles and permissions
 * - Sign in/out functions
 * - Role checking helpers
 */

import { createContext, useContext, useState, useEffect, useMemo, useCallback } from "react";
import PropTypes from "prop-types";
import { supabase } from "supabaseClient";

// Create the Auth context
const AuthContext = createContext(null);

// Custom hook to use the auth context
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

// Auth Provider component
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch user profile and roles
  const fetchUserData = useCallback(async (authUser) => {
    if (!authUser) {
      setUser(null);
      setProfile(null);
      setRoles([]);
      return;
    }

    try {
      // Get user's roles using the RPC function
      const { data: rolesData, error: rolesError } = await supabase.rpc("get_user_roles", {
        p_user_id: authUser.id,
      });

      if (rolesError) {
        console.error("Error fetching roles:", rolesError);
      }

      // Get user's profile
      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", authUser.id)
        .single();

      if (profileError && profileError.code !== "PGRST116") {
        // PGRST116 = no rows returned
        console.error("Error fetching profile:", profileError);
      }

      setUser(authUser);
      setProfile(profileData || null);
      setRoles(rolesData || []);
    } catch (err) {
      console.error("Error fetching user data:", err);
      setError(err.message);
    }
  }, []);

  // Initialize auth state
  useEffect(() => {
    let mounted = true;

    const initAuth = async () => {
      try {
        // Get current session
        const {
          data: { session },
          error: sessionError,
        } = await supabase.auth.getSession();

        if (sessionError) throw sessionError;

        if (mounted) {
          if (session?.user) {
            await fetchUserData(session.user);
          }
          setLoading(false);
        }
      } catch (err) {
        console.error("Error initializing auth:", err);
        if (mounted) {
          setError(err.message);
          setLoading(false);
        }
      }
    };

    initAuth();

    // Listen for auth state changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return;

      if (event === "SIGNED_IN" && session?.user) {
        await fetchUserData(session.user);
      } else if (event === "SIGNED_OUT") {
        setUser(null);
        setProfile(null);
        setRoles([]);
      } else if (event === "TOKEN_REFRESHED" && session?.user) {
        // Optionally refresh user data on token refresh
        await fetchUserData(session.user);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [fetchUserData]);

  // Sign in with email and password
  const signIn = useCallback(async (email, password) => {
    setError(null);

    const { data, error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (signInError) {
      // Don't reveal if user exists - always show generic error
      throw new Error("Invalid email or password");
    }

    return data;
  }, []);

  // Sign out
  const signOut = useCallback(async () => {
    setError(null);

    const { error: signOutError } = await supabase.auth.signOut();

    if (signOutError) {
      throw signOutError;
    }

    setUser(null);
    setProfile(null);
    setRoles([]);
  }, []);

  // Check if user has a specific role
  const hasRole = useCallback(
    (roleName) => {
      return roles.some((r) => r.role_name === roleName);
    },
    [roles]
  );

  // Check if user has any of the specified roles
  const hasAnyRole = useCallback(
    (roleNames) => {
      return roleNames.some((roleName) => hasRole(roleName));
    },
    [hasRole]
  );

  // Computed role booleans
  const isPlatformAdmin = useMemo(() => hasRole("platform_admin"), [hasRole]);
  const isProductEditor = useMemo(() => hasRole("product_editor"), [hasRole]);
  const isProductsViewer = useMemo(() => hasRole("products_viewer"), [hasRole]);

  // Can edit products (admin or editor)
  const canEditProducts = useMemo(
    () => isPlatformAdmin || isProductEditor,
    [isPlatformAdmin, isProductEditor]
  );

  // Can view products (any PMP role)
  const canViewProducts = useMemo(
    () => isPlatformAdmin || isProductEditor || isProductsViewer,
    [isPlatformAdmin, isProductEditor, isProductsViewer]
  );

  // Check if user is authenticated
  const isAuthenticated = useMemo(() => !!user, [user]);

  // Context value
  const value = useMemo(
    () => ({
      // State
      user,
      profile,
      roles,
      loading,
      error,
      isAuthenticated,

      // Role booleans
      isPlatformAdmin,
      isProductEditor,
      isProductsViewer,
      canEditProducts,
      canViewProducts,

      // Functions
      signIn,
      signOut,
      hasRole,
      hasAnyRole,
    }),
    [
      user,
      profile,
      roles,
      loading,
      error,
      isAuthenticated,
      isPlatformAdmin,
      isProductEditor,
      isProductsViewer,
      canEditProducts,
      canViewProducts,
      signIn,
      signOut,
      hasRole,
      hasAnyRole,
    ]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

AuthProvider.propTypes = {
  children: PropTypes.node.isRequired,
};

export default AuthContext;
