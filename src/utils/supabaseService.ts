import { supabase } from './supabaseClient';

export const hasPasswordSet = async (username: string): Promise<boolean> => {
  const { data, error } = await supabase.rpc('has_password', { p_username: username });
  if (error) {
    console.error('hasPasswordSet error:', error);
    return false;
  }
  return !!data;
};

export const setInitialPassword = async (username: string, password: string): Promise<boolean> => {
  const { data, error } = await supabase.rpc('set_initial_password', {
    p_username: username,
    p_password: password,
  });
  if (error) {
    console.error('setInitialPassword error:', error);
    return false;
  }
  return !!data;
};

export const verifyLogin = async (username: string, password: string): Promise<boolean> => {
  const { data, error } = await supabase.rpc('verify_login', {
    p_username: username,
    p_password: password,
  });
  if (error) {
    console.error('verifyLogin error:', error);
    return false;
  }
  return !!data;
};

export const changePassword = async (
  username: string,
  oldPassword: string,
  newPassword: string
): Promise<boolean> => {
  const { data, error } = await supabase.rpc('change_password', {
    p_username: username,
    p_old_password: oldPassword,
    p_new_password: newPassword,
  });
  if (error) {
    console.error('changePassword error:', error);
    return false;
  }
  return !!data;
};
