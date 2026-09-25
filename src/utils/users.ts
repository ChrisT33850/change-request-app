// Single source of truth for who can log in AND who can be "The Signatory"
// on a Change Request. Add/remove a person here and it applies everywhere.

export interface AppUser {
  username: string;
  displayName: string;
}

export const APP_USERS: AppUser[] = [
  { username: 'christophe', displayName: 'Christophe Trevise' },
  { username: 'marco.fallea', displayName: 'Marco Fallea' },
  { username: 'michael.hamadouche', displayName: 'Michael Hamadouche' },
  { username: 'arianne.bryant', displayName: 'Arianne Bryant' },
  { username: 'ernesto.filizzola', displayName: 'Ernesto Filizzola' },
  { username: 'kevin.allan', displayName: 'Kevin Allan' },
  { username: 'joan.pascual', displayName: 'Joan Pascual' },
];

// username -> display name (used throughout the dashboard)
export const USER_NAMES: { [key: string]: string } = Object.fromEntries(
  APP_USERS.map((u) => [u.username, u.displayName])
);

// Everyone who can be picked as "The Signatory" when creating a CR
// (the requester is auto-added separately, so they're not excluded here —
// harmless if someone also picks themselves)
export const AVAILABLE_STAKEHOLDERS: string[] = APP_USERS.map((u) => u.username);
