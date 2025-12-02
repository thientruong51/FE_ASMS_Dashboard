import React, { Suspense } from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { Provider } from "react-redux";
import { store } from "@/app/store";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "@/app/queryClient";

import "./i18n";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <Provider store={store}>
      <QueryClientProvider client={queryClient}>
        <Suspense fallback={null}>
          <App />
        </Suspense>
      </QueryClientProvider>
    </Provider>
  </React.StrictMode>
);
