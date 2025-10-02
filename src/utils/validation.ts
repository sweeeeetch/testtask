import type { Account, ValidationErrors } from "@/types/account";
import { AccountType } from "@/types/account";

export function validateLogin(login: string): string | undefined {
  if (!login || login.trim() === "") {
    return "Логин обязателен";
  }
  if (login.length > 100) {
    return "Логин не должен превышать 100 символов";
  }
  return undefined;
}

export function validatePassword(password: string | null, accountType: AccountType): string | undefined {
  if (accountType === AccountType.LOCAL) {
    if (!password || password.trim() === "") {
      return "Пароль обязателен для локальных учетных записей";
    }
    if (password.length > 100) {
      return "Пароль не должен превышать 100 символов";
    }
  }
  return undefined;
}

export function validateLabels(labels: string): string | undefined {
  if (labels.length > 50) {
    return "Метки не должны превышать 50 символов";
  }
  return undefined;
}

export function validateAccount(account: Account): ValidationErrors {
  const errors: ValidationErrors = {};

  const loginError = validateLogin(account.login);
  if (loginError) {
    errors.login = loginError;
  }

  const passwordError = validatePassword(account.password, account.accountType);
  if (passwordError) {
    errors.password = passwordError;
  }

  return errors;
}
