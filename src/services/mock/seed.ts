export const mockOrders = [
  { id: "ORDER001", customer: "Raj Industries", status: "Delivered", weight: "250 KG", from: "Delhi", to: "Mumbai", date: "17 Jul 2024" },
  { id: "ORDER002", customer: "Raj Industries", status: "Canceled", weight: "250 KG", from: "Delhi", to: "Mumbai", date: "17 Jul 2024" },
  { id: "ORDER003", customer: "Raj Industries", status: "Active", weight: "250 KG", from: "Delhi", to: "Mumbai", date: "17 Jul 2024" },
];

export const truckStats = {
  total: 120,
  active: 40,
  loadingDelayed: 23,
  unloadingDelayed: 12,
  readyToLoad: 12,
  readyToUnload: 3,
  canceled: 3,
};
