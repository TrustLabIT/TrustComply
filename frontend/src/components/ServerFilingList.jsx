import React, { useEffect, useState } from "react";
import { Box, Pagination, CircularProgress, Typography } from "@mui/material";
import { useSelector } from "react-redux";
import SectionCard from "./common/SectionCard";
import FilterBar from "./common/FilterBar";
import FilingTable from "./common/FilingTable";
import { useScope, useFilter } from "../store/hooks";
import { getFilingsPageApi } from "../api/filings";

const LIMIT = 25;

// A filing register backed by the server: FilterBar + search/status/owner filters
// + pagination, all handled by the API. Refetches whenever a filing is mutated
// anywhere (via the shared filingsVersion) or the FY / filter changes.
export default function ServerFilingList({ cat, module, title }) {
  const { entity, fy } = useScope();
  const filter = useFilter();
  const filingsVersion = useSelector((s) => s.compliance.filingsVersion);

  const [page, setPage] = useState(1);
  const [data, setData] = useState({ items: [], total: 0, pages: 1, loading: true });

  // Reset to page 1 whenever the query changes.
  useEffect(() => {
    setPage(1);
  }, [entity, fy, cat, module, filter.q, filter.status, filter.owner]);

  useEffect(() => {
    let active = true;
    setData((d) => ({ ...d, loading: true }));
    const t = setTimeout(() => {
      getFilingsPageApi({
        entity, fy, cat, module, page, limit: LIMIT,
        search: filter.q, status: filter.status, owner: filter.owner,
      })
        .then((res) => { if (active) setData({ items: res.items, total: res.total, pages: res.pages, loading: false }); })
        .catch(() => { if (active) setData({ items: [], total: 0, pages: 1, loading: false }); });
    }, 300); // debounce (mainly for the search box)
    return () => { active = false; clearTimeout(t); };
  }, [entity, fy, cat, module, page, filter.q, filter.status, filter.owner, filingsVersion]);

  return (
    <>
      <FilterBar />
      <SectionCard title={title}>
        {data.loading ? (
          <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
            <CircularProgress size={26} sx={{ color: "brand.teal" }} />
          </Box>
        ) : (
          <FilingTable rows={data.items} />
        )}

        {data.total > 0 && (
          <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mt: 1.5, flexWrap: "wrap", gap: 1 }}>
            <Typography sx={{ fontFamily: "'Space Mono', monospace", fontSize: "11px", color: "text.secondary" }}>
              {data.total} record{data.total === 1 ? "" : "s"} · page {page} of {data.pages}
            </Typography>
            {data.pages > 1 && (
              <Pagination
                count={data.pages}
                page={page}
                onChange={(_, v) => setPage(v)}
                size="small"
                color="primary"
              />
            )}
          </Box>
        )}
      </SectionCard>
    </>
  );
}
