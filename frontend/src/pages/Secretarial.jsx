import React from "react";
import TruFinModule from "../modules/trufin/TruFinModule";
import { mountSecretarial } from "../modules/trufin/secretarial/engine";
import "../modules/trufin/secretarial/secretarial.css";

// Secretarial & corporate compliance module (TruFin Secretarial): Calendar,
// Meetings, Resolutions, Directors & KMP, Shareholders, Events & charges,
// Registers, Documents and Settings.
export const SECRETARIAL_TABS = ["overview", "meetings", "resolutions", "directors", "shareholders", "events", "registers", "docs", "settings"];

const COLS = ["config", "directors", "meetings", "resolutions", "events", "filings", "docs", "members", "sharetx", "extensions"];

// Starter record for a brand-new module: the Chairman & Managing Director.
const seed = () => ({
  directors: {
    "p-vc": { kind: "director", name: "Venkata Cherukuri", din: "", designation: "Chairman & Managing Director", category: "Executive", appointed: "", ceased: "", kycNext: "", mbp1: {}, dir8: {} },
  },
});

export default function Secretarial() {
  return (
    <TruFinModule
      app="secretarial"
      base="secretarial"
      module="CS"
      tabs={SECRETARIAL_TABS}
      mount={mountSecretarial}
      scopeClass="tf-cs"
      cols={COLS}
      seed={seed}
    />
  );
}
