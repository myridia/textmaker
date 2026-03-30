import { createApp } from "vue";
import "@picocss/pico/css/pico.css";
import App from "./App.vue";
import './registerServiceWorker'

const app = createApp(App);

app.mount("#app");
