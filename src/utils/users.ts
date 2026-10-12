// The list of users/stakeholders now lives in Supabase (table: app_users)
// and is loaded at runtime via utils/supabaseService.ts
// (loadAppUsers / addStakeholder / deleteStakeholder).
// This file only keeps the shared type.

export interface AppUser {
  username: string;
  displayName: string;
}
