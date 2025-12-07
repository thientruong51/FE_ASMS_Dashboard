import i18n from "i18next";
import { initReactI18next } from "react-i18next";

import authEn from "./locales/en/auth.json";
import authVi from "./locales/vi/auth.json";
import buildingEn from "./locales/en/building.json";
import buildingVi from "./locales/vi/building.json";
import settingsVi from "./locales/vi/settings.json";
import settingsEn from "./locales/en/settings.json";
import containerEn from "./locales/en/containerType.json";
import containerVi from "./locales/vi/containerType.json";
import customerEn from "./locales/en/customer.json";
import customerVi from "./locales/vi/customer.json";
import employeeRoleEn from "./locales/en/employeeRole.json";
import employeeRoleVi from "./locales/vi/employeeRole.json";
import orderEn from "./locales/en/order.json";
import orderVi from "./locales/vi/order.json";
import paymentEn from "./locales/en/paymentHistory.json";
import paymentVi from "./locales/vi/paymentHistory.json";
import enProductTypePage from "./locales/en/productTypePage.json";
import viProductTypePage from "./locales/vi/productTypePage.json";
import enServicePage from "./locales/en/servicePage.json";
import viServicePage from "./locales/vi/servicePage.json";
import enShelfPage from "./locales/en/shelfPage.json";
import viShelfPage from "./locales/vi/shelfPage.json";
import enStaffPage from "./locales/en/staffPage.json";
import viStaffPage from "./locales/vi/staffPage.json";
import enStorageTypePage from "./locales/en/storageTypePage.json";
import viStorageTypePage from "./locales/vi/storageTypePage.json";
import enTracking from "./locales/en/trackingHistoryPage.json";
import viTracking from "./locales/vi/trackingHistoryPage.json";
import enTopbar from "./locales/en/topbar.json";
import viTopbar from "./locales/vi/topbar.json";
import enSidebar from "./locales/en/sidebar.json";
import viSidebar from "./locales/vi/sidebar.json";
import enStoragePage from "./locales/en/storagePage.json";
import viStoragePage from "./locales/vi/storagePage.json";
import viDashboard from "./locales/vi/dashboard.json";
import enDashboard from "./locales/en/dashboard.json";
import contact_vi from "./locales/vi/contact.json";
import contact_en from "./locales/en/contact.json";
import viPricing from "@/locales/vi/price.json";    
import enPricing from "@/locales/en/price.json"; 
import businessRules_en from "@/locales/en/businessRules.json";
import businessRules_vi from "@/locales/vi/businessRules.json";
i18n
  .use(initReactI18next)
  .init({
    resources: {
      en: {
        auth: authEn,
        building: buildingEn,
        settings: settingsEn,
        containerType: containerEn,
        customer: customerEn,
        employeeRole: employeeRoleEn,
        order: orderEn,
        paymentHistory: paymentEn,
        productTypePage: enProductTypePage,
        servicePage: enServicePage,
        shelfPage: enShelfPage,
        staffPage: enStaffPage,
        storageTypePage: enStorageTypePage,
        trackingHistoryPage: enTracking,
        topbar: enTopbar,
        sidebar: enSidebar,
        storagePage: enStoragePage,
        dashboard: enDashboard,
        contact: contact_en,
        pricing: enPricing,
        businessRules: businessRules_en,

      },
      vi: {
        auth: authVi,
        building: buildingVi,
        settings: settingsVi,
        containerType: containerVi,
        customer: customerVi,
        employeeRole: employeeRoleVi,
        order: orderVi,
        paymentHistory: paymentVi,
        productTypePage: viProductTypePage,
        servicePage: viServicePage,
        shelfPage: viShelfPage,
        staffPage: viStaffPage,
        storageTypePage: viStorageTypePage,
        trackingHistoryPage: viTracking,
        topbar: viTopbar,
        sidebar: viSidebar,
        storagePage: viStoragePage,
        dashboard: viDashboard,
         contact: contact_vi,
         pricing: viPricing,
         businessRules: businessRules_vi,

      }
    },
    lng: "vi", 
    fallbackLng: "en",
    debug: false,

    interpolation: {
      escapeValue: false
    }
  });

export default i18n;
