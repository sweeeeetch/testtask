import { createApp } from "vue";
import { createPinia } from "pinia";

import App from "./App.vue";
import router from "./router";
import vuetify from "./plugins/vuetify";
import { useAccountStore } from "./stores/accountStore";

const app = createApp(App);

const pinia = createPinia();
app.use(pinia);
app.use(router);
app.use(vuetify);

const accountStore = useAccountStore();
accountStore.loadFromStorage();

app.mount("#app");
