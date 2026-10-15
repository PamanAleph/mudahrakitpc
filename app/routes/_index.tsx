import type { MetaFunction } from "@remix-run/node";
import { AssemblyPage } from "@features/assembly";

export const meta: MetaFunction = () => [
  { title: "Rakit PC 3D" },
  {
    name: "description",
    content:
      "Belajar merakit PC dengan tangan sendiri: lepas baut panel, pasang RAM, dan pasang SSD M.2 di meja rakit 3D.",
  },
];

export default function Index() {
  return <AssemblyPage />;
}
