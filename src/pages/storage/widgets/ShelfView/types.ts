import * as THREE from "three";

export type BoxData = {
  id: string;
  type: "A" | "B" | "C" | "D";
  floor: number;
  position: [number, number, number];
  status: "stored" | "shipping" | "empty";
  productName: string;
  quantity: number;
};

export type ShelfProps = {
  shelfId: number;
};
