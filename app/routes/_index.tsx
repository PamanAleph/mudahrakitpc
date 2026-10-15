import type { MetaFunction } from "@remix-run/node";
import { PlannerPage } from "@features/planner";

export const meta: MetaFunction = () => [
  { title: "Rakit PC 3D · Pilih komponen" },
  {
    name: "description",
    content: "Belanja komponen PC dengan anggaran fiktif dan cek kecocokannya, lalu rakit sendiri di meja 3D: CPU, cooler, RAM, M.2, PSU, VGA, sampai semua kabel.",
  },
];

export default function Index() {
  return <PlannerPage />;
}
