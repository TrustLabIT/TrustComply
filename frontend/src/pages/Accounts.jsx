import React from "react";
import TruFinModule from "../modules/trufin/TruFinModule";
import { mountAccounts } from "../modules/trufin/accounts/engine";
import "../modules/trufin/accounts/accounts.css";

// Taxation — Compliance module (TruFin Accounts): Profit & Loss, Balance Sheet,
// Depreciation, Asset Register, Notes, Sundry Creditors, Sundry Debtors,
// Analysis, Documents and Settings.
export const ACCOUNTS_TABS = ["pl", "bs", "dep", "assets", "notes", "scr", "sdr", "analysis", "docs", "settings"];

export default function Accounts() {
  return (
    <TruFinModule
      app="accounts"
      base="accounts"
      module="CA"
      tabs={ACCOUNTS_TABS}
      mount={mountAccounts}
      scopeClass="tf-acc"
      cols={["years", "assets", "config", "docs"]}
    />
  );
}
