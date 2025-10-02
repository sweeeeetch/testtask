<script setup lang="ts">
import { onMounted, nextTick, ref } from "vue";
import { useAccountStore } from "@/stores/accountStore";
import { AccountType } from "@/types/account";
import AccountHint from "./AccountHint.vue";

const accountStore = useAccountStore();

const { LOCAL } = AccountType;

const headers = [
  { title: "Метки", key: "labels", sortable: false, width: "25%" },
  { title: "Тип", key: "accountType", sortable: false, width: "15%" },
  { title: "Логин", key: "login", sortable: false, width: "25%" },
  { title: "Пароль", key: "password", sortable: false, width: "25%" },
  { title: "Действия", key: "actions", sortable: false, width: "80px" },
];

const accountTypeOptions = [
  { title: "LDAP", value: AccountType.LDAP },
  { title: "Локальная", value: AccountType.LOCAL },
];

const labelsText = ref<Record<string, string>>({});

const getLabelsText = (accountId: string) => {
  if (!labelsText.value[accountId]) {
    const account = accountStore.accounts.find(acc => acc.id === accountId);
    labelsText.value[accountId] = account?.labels.map(label => label.text).join(";") || "";
  }
  return labelsText.value[accountId];
};

const updateLabels = (accountId: string, value: string) => {
  labelsText.value[accountId] = value;

  // Clear validation errors when user starts typing
  const currentErrors = accountStore.validationErrors[accountId];
  if (currentErrors?.labels) {
    const newErrors = { ...currentErrors };
    delete newErrors.labels;
    accountStore.setValidationErrors(accountId, newErrors);
  }
};

const updateLogin = (accountId: string, value: string) => {
  const account = accountStore.accounts.find(acc => acc.id === accountId);
  if (account) {
    accountStore.updateAccount(accountId, { ...account, login: value });

    // Clear validation errors when user starts typing
    const currentErrors = accountStore.validationErrors[accountId];
    if (currentErrors?.login) {
      const newErrors = { ...currentErrors };
      delete newErrors.login;
      accountStore.setValidationErrors(accountId, newErrors);
    }
  }
};

const updatePassword = (accountId: string, value: string) => {
  const account = accountStore.accounts.find(acc => acc.id === accountId);
  if (account) {
    accountStore.updateAccount(accountId, { ...account, password: value });

    // Clear validation errors when user starts typing
    const currentErrors = accountStore.validationErrors[accountId];
    if (currentErrors?.password) {
      const newErrors = { ...currentErrors };
      delete newErrors.password;
      accountStore.setValidationErrors(accountId, newErrors);
    }
  }
};

const handleLabelBlur = (accountId: string) => {
  const account = accountStore.accounts.find(acc => acc.id === accountId);
  if (account && labelsText.value[accountId] !== undefined) {
    // First validate the input text length
    const inputText = labelsText.value[accountId];
    if (inputText.length > 50) {
      accountStore.setValidationErrors(accountId, { labels: "Метки не должны превышать 50 символов" });
      return;
    }

    const labels = inputText
      .split(";")
      .map(text => text.trim())
      .filter(text => text.length > 0)
      .map(text => ({ text }));

    accountStore.updateAccount(accountId, { ...account, labels });
    accountStore.validateAccount(accountId);
  }
};

const handleAccountTypeChange = (accountId: string, accountType: AccountType) => {
  const account = accountStore.accounts.find(acc => acc.id === accountId);
  if (account) {
    const updatedAccount = { ...account, accountType };
    if (accountType === AccountType.LDAP) {
      updatedAccount.password = null;
    }
    accountStore.updateAccount(accountId, updatedAccount);
    triggerValidation(accountId);
  }
};

const handleLoginBlur = (accountId: string) => {
  accountStore.validateAccount(accountId);
  triggerValidation(accountId);
};

const handlePasswordBlur = (accountId: string) => {
  accountStore.validateAccount(accountId);
  triggerValidation(accountId);
};

const handleDelete = (accountId: string) => {
  accountStore.deleteAccount(accountId);
  delete labelsText.value[accountId];
  delete validationTriggered.value[accountId];
};

const hasLabelError = (accountId: string) => {
  const validationErrors = accountStore.validationErrors[accountId];
  return validationErrors?.labels !== undefined;
};

const getLabelErrorMessage = (accountId: string) => {
  const validationErrors = accountStore.validationErrors[accountId];
  return validationErrors?.labels || "";
};

const validationTriggered = ref<Record<string, boolean>>({});

const triggerValidation = (accountId: string) => {
  const account = accountStore.accounts.find(acc => acc.id === accountId);
  if (!account) return;

  const hasValidLogin = account.login.trim() !== "";
  const needsPassword = account.accountType === AccountType.LOCAL;
  const hasValidPassword = !needsPassword || (account.password !== null && account.password.trim() !== "");

  if (hasValidLogin && hasValidPassword) {
    validationTriggered.value[accountId] = true;
  }
};

const hasLoginError = (accountId: string) => {
  const account = accountStore.accounts.find(acc => acc.id === accountId);
  const validationErrors = accountStore.validationErrors[accountId];

  if (validationErrors?.login !== undefined) {
    return true;
  }

  if (validationTriggered.value[accountId]) {
    return account?.login === "";
  }

  return false;
};

const getLoginErrorMessage = (accountId: string) => {
  const validationErrors = accountStore.validationErrors[accountId];
  return validationErrors?.login || "";
};

const hasPasswordError = (accountId: string) => {
  const account = accountStore.accounts.find(acc => acc.id === accountId);
  const validationErrors = accountStore.validationErrors[accountId];
  const showPasswordField = account?.accountType === AccountType.LOCAL;

  if (!showPasswordField) return false;

  if (validationErrors?.password !== undefined) {
    return true;
  }

  if (validationTriggered.value[accountId]) {
    return account?.password === "" || account?.password === null;
  }

  return false;
};

const getPasswordErrorMessage = (accountId: string) => {
  const validationErrors = accountStore.validationErrors[accountId];
  return validationErrors?.password || "";
};

const handleAddAccount = async () => {
  accountStore.addAccount();
  await nextTick();

  const tableRows = document.querySelectorAll(".v-data-table tbody tr");
  const lastRow = tableRows[tableRows.length - 1];
  if (lastRow) {
    const firstInput = lastRow.querySelector("input");
    if (firstInput) {
      firstInput.focus();
    }
  }
};

onMounted(() => {
  accountStore.loadFromStorage();

  accountStore.accounts.forEach(account => {
    labelsText.value[account.id] = account.labels.map(label => label.text).join(";");
  });
});
</script>

<template>
  <v-container class="account-form">
    <v-row>
      <v-col cols="12">
        <div class="d-flex align-center justify-space-between mb-4">
          <h2 class="text-h4">Учетные записи</h2>
          <v-btn
            icon="mdi-plus"
            color="primary"
            @click="handleAddAccount"
            size="large" />
        </div>
      </v-col>
    </v-row>

    <v-row>
      <v-col cols="12">
        <AccountHint />
      </v-col>
    </v-row>

    <v-row>
      <v-col cols="12">
        <v-data-table
          :headers="headers"
          :items="accountStore.accounts"
          :items-per-page="-1"
          class="account-table"
          hide-default-footer>
          <template v-slot:item.labels="{ item }">
            <v-tooltip
              :text="getLabelErrorMessage(item.id)"
              location="top"
              :disabled="!hasLabelError(item.id)">
              <template v-slot:activator="{ props }">
                <v-text-field
                  v-bind="props"
                  :model-value="getLabelsText(item.id)"
                  @update:model-value="updateLabels(item.id, $event)"
                  @blur="handleLabelBlur(item.id)"
                  variant="outlined"
                  density="compact"
                  maxlength="50"
                  hide-details
                  :error="hasLabelError(item.id)" />
              </template>
            </v-tooltip>
          </template>

          <template v-slot:item.accountType="{ item }">
            <v-select
              :model-value="item.accountType"
              @update:model-value="handleAccountTypeChange(item.id, $event)"
              :items="accountTypeOptions"
              variant="outlined"
              density="compact"
              hide-details />
          </template>

          <template v-slot:item.login="{ item }">
            <v-tooltip
              :text="getLoginErrorMessage(item.id)"
              location="top"
              :disabled="!hasLoginError(item.id)">
              <template v-slot:activator="{ props }">
                <v-text-field
                  v-bind="props"
                  :model-value="item.login"
                  @update:model-value="updateLogin(item.id, $event)"
                  @blur="handleLoginBlur(item.id)"
                  variant="outlined"
                  density="compact"
                  maxlength="100"
                  hide-details
                  :error="hasLoginError(item.id)" />
              </template>
            </v-tooltip>
          </template>

          <template v-slot:item.password="{ item }">
            <v-tooltip
              v-if="item.accountType === LOCAL"
              :text="getPasswordErrorMessage(item.id)"
              location="top"
              :disabled="!hasPasswordError(item.id)">
              <template v-slot:activator="{ props }">
                <v-text-field
                  v-bind="props"
                  :model-value="item.password || ''"
                  @update:model-value="updatePassword(item.id, $event)"
                  @blur="handlePasswordBlur(item.id)"
                  variant="outlined"
                  density="compact"
                  maxlength="100"
                  type="password"
                  hide-details
                  :error="hasPasswordError(item.id)" />
              </template>
            </v-tooltip>
            <span
              v-else
              class="text-medium-emphasis"
              >—</span
            >
          </template>

          <template v-slot:item.actions="{ item }">
            <v-btn
              icon="mdi-delete"
              variant="text"
              color="error"
              size="small"
              @click="handleDelete(item.id)" />
          </template>

          <template v-slot:no-data>
            <div class="text-center py-8">
              <v-icon
                size="64"
                color="grey-lighten-1"
                class="mb-4">
                mdi-account-multiple-outline
              </v-icon>
              <p class="text-h6 text-medium-emphasis">Нет учетных записей</p>
              <p class="text-body-2 text-medium-emphasis">Нажмите кнопку "+" чтобы добавить первую учетную запись</p>
            </div>
          </template>
        </v-data-table>
      </v-col>
    </v-row>
  </v-container>
</template>

<style scoped>
.account-form {
  max-width: 1200px;
  margin: 0 auto;
}

.text-medium-emphasis {
  opacity: 0.7;
}

.account-table {
  border: 1px solid #e0e0e0;
  border-radius: 8px;
}

:deep(.v-data-table__wrapper) {
  border-radius: 8px;
}

:deep(.v-data-table-header) {
  background-color: #f5f5f5;
}

:deep(.v-data-table-header th) {
  font-weight: 600;
  color: #424242;
}

:deep(.v-data-table tbody tr:hover) {
  background-color: #f8f9fa;
}

:deep(.v-text-field .v-field) {
  min-height: 40px;
}

:deep(.v-select .v-field) {
  min-height: 40px;
}

:deep(.v-text-field--error .v-field) {
  border-color: #f44336 !important;
}

:deep(.v-data-table tbody td) {
  padding: 8px 16px;
  vertical-align: middle;
}

:deep(.v-data-table thead th) {
  padding: 12px 16px;
}
</style>
