export interface AccountLabel {
  text: string;
}

export enum AccountType {
  LDAP = "LDAP",
  LOCAL = "Локальная",
}

export interface Account {
  id: string;
  labels: AccountLabel[];
  accountType: AccountType;
  login: string;
  password: string | null;
}

export interface ValidationErrors {
  login?: string;
  password?: string;
  labels?: string;
}
