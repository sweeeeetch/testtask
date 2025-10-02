import { defineStore } from "pinia";
import { ref, computed } from "vue";
import type { Account, ValidationErrors, AccountType } from "@/types/account";

export interface AccountState {
  accounts: Account[];
  validationErrors: Record<string, ValidationErrors>;
}

const STORAGE_KEY = "accounts-data";

export const useAccountStore = defineStore("account", () => {
  const accounts = ref<Account[]>([]);
  const validationErrors = ref<Record<string, ValidationErrors>>({});

  const generateId = (): string => {
    return Date.now().toString() + Math.random().toString(36).substring(2, 11);
  };

  const addAccount = (): void => {
    const newAccount: Account = {
      id: generateId(),
      labels: [],
      accountType: "LDAP" as AccountType,
      login: "",
      password: null,
    };
    accounts.value.push(newAccount);
    saveToStorage();
  };

  const deleteAccount = (id: string): void => {
    const index = accounts.value.findIndex(account => account.id === id);
    if (index !== -1) {
      accounts.value.splice(index, 1);
      delete validationErrors.value[id];
      saveToStorage();
    }
  };

  const updateAccount = (id: string, updates: Partial<Account>): void => {
    const index = accounts.value.findIndex(account => account.id === id);
    if (index !== -1) {
      const account = accounts.value[index];
      if (account) {
        Object.assign(account, updates);
        saveToStorage();
      }
    }
  };

  const setValidationErrors = (id: string, errors: ValidationErrors): void => {
    if (Object.keys(errors).length > 0) {
      validationErrors.value[id] = errors;
    } else {
      delete validationErrors.value[id];
    }
  };

  const validateAccount = (id: string): void => {
    const account = accounts.value.find(acc => acc.id === id);
    if (!account) return;

    const errors: ValidationErrors = {};

    // Validate login
    if (!account.login || account.login.trim() === "") {
      errors.login = "Логин обязателен";
    } else if (account.login.length > 100) {
      errors.login = "Логин не должен превышать 100 символов";
    }

    // Validate password for local accounts
    if (account.accountType === "Локальная") {
      if (!account.password || account.password.trim() === "") {
        errors.password = "Пароль обязателен для локальных учетных записей";
      } else if (account.password.length > 100) {
        errors.password = "Пароль не должен превышать 100 символов";
      }
    }

    // Validate labels (check total length of concatenated labels)
    const labelsText = account.labels.map(label => label.text).join(";");
    if (labelsText.length > 50) {
      errors.labels = "Метки не должны превышать 50 символов";
    }

    setValidationErrors(id, errors);
  };

  const saveToStorage = (): void => {
    try {
      const dataToSave = {
        accounts: accounts.value,
        validationErrors: validationErrors.value,
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(dataToSave));
    } catch (error) {
      console.warn("Не удалось сохранить данные в localStorage:", error);
    }
  };

  const loadFromStorage = (): void => {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      if (data) {
        const parsedData = JSON.parse(data);
        if (parsedData.accounts) {
          accounts.value = parsedData.accounts;
        }
        if (parsedData.validationErrors) {
          validationErrors.value = parsedData.validationErrors;
        }
      }
    } catch (error) {
      console.warn("Не удалось загрузить данные из localStorage:", error);
      accounts.value = [];
      validationErrors.value = {};
    }
  };

  return {
    accounts: computed(() => accounts.value),
    validationErrors: computed(() => validationErrors.value),
    addAccount,
    deleteAccount,
    updateAccount,
    setValidationErrors,
    validateAccount,
    saveToStorage,
    loadFromStorage,
  };
});
