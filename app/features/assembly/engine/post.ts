import type { AssemblySnapshot, CableSpec, DebugLed, PostFinding, PostResult } from "../types/assemblyTypes";
import { fpCorrect, fpSwapped } from "./frontPanel";
import { cableSatisfied, driveDetected, isMounted, panelOff } from "./selectors";

/**
 * What happens when the power button is pressed: a simplified POST.
 * Order mirrors a real start-up: PSU → board → CPU → memory → display → boot.
 */
export function evaluatePost(s: AssemblySnapshot, cables: CableSpec[]): PostResult {
  const findings: PostFinding[] = [];
  const fatal = (key: PostFinding["key"], params?: PostFinding["params"]) => findings.push({ severity: "fatal", key, params });
  const warn = (key: PostFinding["key"], params?: PostFinding["params"]) => findings.push({ severity: "warn", key, params });
  const note = (key: PostFinding["key"], params?: PostFinding["params"]) => findings.push({ severity: "note", key, params });
  const sat = (id: string) => {
    const c = cables.find((x) => x.id === id);
    return c ? cableSatisfied(s, c) : false;
  };
  const result = (powered: boolean, led: DebugLed | null): PostResult => ({
    powered,
    booted: powered && !findings.some((f) => f.severity === "fatal"),
    led,
    findings,
    at: Date.now(),
  });

  if (!isMounted(s, "psu") || !s.psuSwitch) {
    fatal("post.psuOff");
    return result(false, null);
  }
  if (!sat("atx24")) {
    fatal("post.no24pin");
    return result(false, null);
  }
  if (!fpCorrect(s.frontPanel, "PWR_SW")) {
    fatal("post.noPowerSwitch");
    return result(false, null);
  }

  let led: DebugLed | null = null;
  const setLed = (l: DebugLed) => {
    if (!led) led = l;
  };

  // CPU power and the CPU itself
  const epsOk = cables.filter((c) => c.id.startsWith("eps")).every((c) => cableSatisfied(s, c));
  if (!epsOk) {
    fatal("post.noEps");
    setLed("CPU");
  }
  if (!isMounted(s, "cpu") || s.lever !== "closed") {
    fatal("post.noCpu");
    setLed("CPU");
  }

  // Cooling
  const coolerOk = isMounted(s, "cooler") && (s.parts.cooler?.fastened ?? 0) >= 1;
  if (isMounted(s, "cpu")) {
    if (!coolerOk) fatal("post.noCooler");
    else if (!s.plasticPeeled) fatal("post.plastic");
    else if (!s.build.cooler.prePasted && s.paste === "none") fatal("post.noPaste");
    else if (s.paste === "sedikit") warn("post.lowPaste");
    else if (s.paste === "banyak" || (s.build.cooler.prePasted && s.paste !== "none")) note("post.muchPaste");
    if (coolerOk && !sat("cpu-fan")) warn("post.cpuFanError");
  }

  // Memory
  const ramIds = Object.keys(s.parts).filter((id) => id.startsWith("ram-"));
  const seated = ramIds.filter((id) => s.parts[id]?.location === "mounted" && s.parts[id]?.stage === "seated");
  if (seated.length === 0) {
    fatal("post.noRam");
    setLed("DRAM");
  } else if (seated.length < ramIds.length) {
    warn("post.ramPartial", { n: ramIds.length - seated.length });
  }

  // Display
  if (s.build.gpu) {
    const gpuPowered = isMounted(s, "gpu") && cables.filter((c) => c.id.startsWith("gpu-")).every((c) => cableSatisfied(s, c));
    if (!isMounted(s, "gpu")) {
      if (!s.build.cpu.integratedGraphics) {
        fatal("post.noDisplay");
        setLed("VGA");
      }
    } else if (!gpuPowered) {
      fatal("post.gpuNoPower");
      setLed("VGA");
    }
  } else if (!s.build.cpu.integratedGraphics) {
    fatal("post.noDisplay");
    setLed("VGA");
  }

  // Boot device
  const drives = s.build.storage.map((_, i) => driveDetected(s, i));
  drives.forEach((d, i) => {
    if (!d.ok) note("post.driveMissing", { name: s.build.storage[i]?.name ?? "Drive", reason: d.reason });
  });
  if (!drives.some((d) => d.ok)) {
    warn("post.noBoot");
    setLed("BOOT");
  }

  // Everything else that doesn't stop a boot
  const fanCables = cables.filter((c) => c.id.startsWith("fan-"));
  const unpluggedFans = fanCables.filter((c) => !cableSatisfied(s, c)).length;
  if (unpluggedFans) note("post.fanUnplugged", { n: unpluggedFans });
  if (!fpCorrect(s.frontPanel, "PLED+") || !fpCorrect(s.frontPanel, "PLED-")) note("post.ledPolarity", { led: fpSwapped(s.frontPanel, "PLED") ? "power (terbalik)" : "power" });
  if (!fpCorrect(s.frontPanel, "HDLED+") || !fpCorrect(s.frontPanel, "HDLED-")) note("post.ledPolarity", { led: fpSwapped(s.frontPanel, "HDLED") ? "drive (terbalik)" : "drive" });
  if (!fpCorrect(s.frontPanel, "RESET_SW")) note("post.noReset");
  const front = ["usb3", "usbc", "audio"]
    .map((id) => cables.find((c) => c.id === id))
    .filter((c): c is CableSpec => !!c && c.required && !cableSatisfied(s, c))
    .map((c) => c.label.replace("Kabel ", ""));
  if (front.length) note("post.frontIo", { ports: front.join(", ") });
  if (cables.some((c) => c.id === "usbc" && !c.required)) note("post.usbcOrphan");
  if (panelOff(s)) note("post.panelOpen");

  return result(true, led);
}
