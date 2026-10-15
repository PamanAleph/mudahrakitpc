import type { ResolvedBuild } from "@shared/hardware";

export interface PortDef {
  id: string;
  kind: string;
  owner: string;
  label: string;
}

/** Every socket a cable can go into, derived from the build. Positions live in the scene. */
export function derivePorts(b: ResolvedBuild): PortDef[] {
  const h = b.board.headers;
  const ports: PortDef[] = [{ id: "board:atx24", kind: "atx-24", owner: "board", label: "ATX 24-pin" }];
  for (let i = 0; i < h.eps; i++) ports.push({ id: `board:eps-${i}`, kind: "eps-8", owner: "board", label: `CPU_PWR${i + 1} (EPS 8-pin)` });
  ports.push({ id: "board:cpu_fan", kind: "fan-4pin", owner: "board", label: "CPU_FAN" });
  for (let i = 0; i < h.sysFan; i++) ports.push({ id: `board:sys_fan-${i}`, kind: "fan-4pin", owner: "board", label: `SYS_FAN${i + 1}` });
  b.board.sataPorts.forEach((name, i) => ports.push({ id: `board:sata-${i}`, kind: "sata-data", owner: "board", label: name }));
  if (h.usb3 > 0) ports.push({ id: "board:usb3", kind: "usb3-header", owner: "board", label: "USB 3.x (19-pin)" });
  if (h.usbc > 0) ports.push({ id: "board:usbc", kind: "usbc-header", owner: "board", label: "USB-C (Key-A)" });
  if (h.usb2 > 0) ports.push({ id: "board:usb2", kind: "usb2-header", owner: "board", label: "USB 2.0" });
  if (h.audio > 0) ports.push({ id: "board:audio", kind: "hd-audio", owner: "board", label: "HD Audio" });
  if (b.gpu) {
    let k = 0;
    for (const c of b.gpu.powerConnectors) {
      for (let n = 0; n < c.count; n++, k++) ports.push({ id: `gpu:pwr-${k}`, kind: c.kind, owner: "gpu", label: `VGA ${c.kind}` });
    }
  }
  b.storage.forEach((s, i) => {
    if (s.kind === "m2") return;
    ports.push({ id: `drive-${i}:data`, kind: "sata-data", owner: `drive-${i}`, label: `${s.name} · SATA data` });
    ports.push({ id: `drive-${i}:power`, kind: "sata-power", owner: `drive-${i}`, label: `${s.name} · SATA power` });
  });
  return ports;
}
