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
        order: orderEn
      },
      vi: {
        auth: authVi,
        building: buildingVi,
        settings: settingsVi,
        containerType: containerVi,
        customer: customerVi,
        employeeRole: employeeRoleVi,
        order: orderVi
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
