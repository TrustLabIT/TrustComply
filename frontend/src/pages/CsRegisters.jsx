import React, { useEffect } from "react";
import { Box, Checkbox, Typography } from "@mui/material";
import { useDispatch, useSelector } from "react-redux";
import PageHead from "../components/common/PageHead";
import SectionCard from "../components/common/SectionCard";
import Tag from "../components/common/Tag";
import { fetchRegisterChecks, toggleRegisterCheck } from "../store/complianceSlice";
import { useScope } from "../store/hooks";
import { REGISTERS } from "../data/reference";

const mono = { fontFamily: "'Space Mono', monospace" };

export default function CsRegisters() {
  const dispatch = useDispatch();
  const { entity, fy } = useScope();
  const checked = useSelector((s) => s.compliance.regChecks[`${entity}:${fy}`] || []);
  const verified = checked.length;

  // Load the saved tick state for this entity + FY.
  useEffect(() => {
    dispatch(fetchRegisterChecks({ entity, fy }));
  }, [dispatch, entity, fy]);

  return (
    <Box>
      <PageHead
        title="Statutory registers"
        sub={`Registers the company must maintain at the registered office and keep current — these are the first documents pulled in any due-diligence data room. Tick each once verified up-to-date for FY ${fy}.`}
      />

      <SectionCard>
        {REGISTERS.map((g, i) => {
          const isChecked = checked.includes(i);
          return (
            <Box
              key={i}
              onClick={() => dispatch(toggleRegisterCheck({ entity, fy, index: i }))}
              sx={{
                display: "flex",
                alignItems: "flex-start",
                gap: 1,
                py: 1,
                cursor: "pointer",
                borderBottom: i < REGISTERS.length - 1 ? "1px solid" : "none",
                borderColor: "brand.line",
              }}
            >
              <Checkbox
                checked={isChecked}
                size="small"
                sx={{ p: 0.25, mt: "1px", color: "brand.line", "&.Mui-checked": { color: "brand.teal" } }}
              />
              <Box sx={{ minWidth: 0 }}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 0.75, flexWrap: "wrap" }}>
                  <Box
                    component="span"
                    sx={{
                      fontWeight: 700,
                      fontSize: "13.5px",
                      textDecoration: isChecked ? "line-through" : "none",
                      color: isChecked ? "text.secondary" : "text.primary",
                    }}
                  >
                    {g.name}
                  </Box>
                  {g.code !== "—" && <Tag kind="cs">{g.code}</Tag>}
                  <Box component="span" sx={{ ...mono, fontSize: "12px", color: "text.secondary" }}>· {g.ref}</Box>
                </Box>
                {g.note && (
                  <Typography sx={{ fontSize: "12px", color: "text.secondary", mt: 0.25 }}>{g.note}</Typography>
                )}
              </Box>
            </Box>
          );
        })}
        <Typography sx={{ fontSize: "12px", color: "text.secondary", mt: 1 }}>
          Verified: {verified}/{REGISTERS.length}. Related-party and group-entity contracts must appear in
          MBP-4 with the board approval trail.
        </Typography>
      </SectionCard>
    </Box>
  );
}
