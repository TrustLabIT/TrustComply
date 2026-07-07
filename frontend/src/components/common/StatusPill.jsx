import React from "react";
import Pill from "./Pill";
import { STATUS_LABEL } from "../../data/constants";
import { isOverdue, daysTo } from "../../data/helpers";

// Renders the correct status pill for a filing record, promoting open+past-due
// records to a red "Overdue Nd" pill.
export default function StatusPill({ record }) {
  if (isOverdue(record)) return <Pill kind="od">Overdue {-daysTo(record.due)}d</Pill>;
  return <Pill kind={record.status}>{STATUS_LABEL[record.status]}</Pill>;
}
