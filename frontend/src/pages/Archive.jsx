import React from "react";
import { Box, Table, TableBody, TableCell, TableContainer, TableHead, TableRow } from "@mui/material";
import PageHead from "../components/common/PageHead";
import SectionCard from "../components/common/SectionCard";
import DocChip from "../components/common/DocChip";
import { useRows, useScope } from "../store/hooks";
import { fmt } from "../data/helpers";

const mono = { fontFamily: "'Space Mono', monospace" };
const th = { ...mono, fontSize: "10px", letterSpacing: "0.1em", textTransform: "uppercase", color: "text.secondary", borderBottom: "2px solid", borderColor: "brand.line", whiteSpace: "nowrap", py: 1, px: 1.25 };
const td = { py: 1.1, px: 1.25, borderBottom: "1px solid", borderColor: "brand.line", verticalAlign: "top", fontSize: "13px" };

const trunc = (s, n = 26) => (s && s.length > n ? s.slice(0, n - 1) + "…" : s);

export default function Archive() {
  const { entity, fy } = useScope();
  const list = useRows()
    .filter((r) => ["fd", "ak"].includes(r.status))
    .slice()
    .sort((a, b) => new Date(b.filed || b.due) - new Date(a.filed || a.due));

  return (
    <Box>
      <PageHead
        title="SRN / ARN archive"
        sub="Every filed obligation with its acknowledgement reference — the audit trail for NABL, statutory audit, and the data room. Pair with LexBase for the underlying documents."
      />

      <SectionCard chip={`${entity} · FY ${fy}`}>
        {list.length ? (
          <TableContainer sx={{ overflowX: "auto" }}>
            <Table sx={{ borderCollapse: "collapse" }}>
              <TableHead>
                <TableRow>
                  {["Filed", "Form", "Filing", "Period", "Reference", "Documents", "Owner"].map((h) => (
                    <TableCell key={h} sx={th}>{h}</TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {list.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell sx={{ ...td, ...mono, fontSize: "12px", whiteSpace: "nowrap" }}>{fmt(r.filed || r.due)}</TableCell>
                    <TableCell sx={{ ...td, ...mono, fontSize: "12px", fontWeight: 700, whiteSpace: "nowrap" }}>{r.form}</TableCell>
                    <TableCell sx={td}>{r.title}</TableCell>
                    <TableCell sx={{ ...td, ...mono, fontSize: "11px" }}>{r.period || "—"}</TableCell>
                    <TableCell sx={{ ...td, ...mono, fontSize: "11px" }}>{r.ref || "—"}</TableCell>
                    <TableCell sx={td}>
                      {r.docs?.length ? (
                        r.docs.map((d, i) => (
                          <Box
                            key={i}
                            component="a"
                            href={d.data}
                            download={d.name}
                            sx={{ display: "block", fontSize: "11px", color: "brand.tealDark", fontWeight: 700, textDecoration: "none", "&:hover": { textDecoration: "underline" } }}
                          >
                            {"↓ "}{trunc(d.name)}
                          </Box>
                        ))
                      ) : (
                        <DocChip record={r} />
                      )}
                    </TableCell>
                    <TableCell sx={td}>{r.owner}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        ) : (
          <Box sx={{ color: "text.secondary", fontSize: "13px", py: 3, textAlign: "center" }}>
            No filed records yet for this entity/FY.
          </Box>
        )}
      </SectionCard>
    </Box>
  );
}
