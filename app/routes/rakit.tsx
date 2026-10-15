import type { MetaFunction } from "@remix-run/node";
import { AssemblyEntryPage } from "@features/assembly";

export const meta: MetaFunction = () => [
  { title: "Rakit PC 3D · Meja rakit" },
  { name: "description", content: "Rakit PC pilihanmu dari awal di meja 3D, colok semua kabel, lalu nyalakan." },
];

export default function Rakit() {
  return <AssemblyEntryPage />;
}
