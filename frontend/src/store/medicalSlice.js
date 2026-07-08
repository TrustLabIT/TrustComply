import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { getLicenceSummaryApi, getLicenceListApi } from "../api/medical";

// Medical licence compliance data — pulled from TAMS via the backend proxy.
export const fetchLicenceSummary = createAsyncThunk("medical/summary", (location) =>
  getLicenceSummaryApi(location)
);
export const fetchLicenceList = createAsyncThunk("medical/list", (params) => getLicenceListApi(params));

const initialState = {
  summary: null, // { DHMO: {...}, BMW: {...}, Pollution: {...} }
  summaryAt: null,
  list: [],
  listAt: null,
  filters: { license_type: "", location: "" },
  loadingSummary: false,
  loadingList: false,
  error: null,
};

const slice = createSlice({
  name: "medical",
  initialState,
  reducers: {
    setLicenceFilter(state, { payload }) {
      state.filters = { ...state.filters, ...payload };
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchLicenceSummary.pending, (state) => {
        state.loadingSummary = true;
        state.error = null;
      })
      .addCase(fetchLicenceSummary.fulfilled, (state, { payload }) => {
        state.loadingSummary = false;
        state.summary = payload?.data || null;
        state.summaryAt = payload?.generated_at || null;
      })
      .addCase(fetchLicenceSummary.rejected, (state, { error }) => {
        state.loadingSummary = false;
        state.error = error.message || "Failed to reach TAMS";
      })
      .addCase(fetchLicenceList.pending, (state) => {
        state.loadingList = true;
        state.error = null;
      })
      .addCase(fetchLicenceList.fulfilled, (state, { payload }) => {
        state.loadingList = false;
        state.list = Array.isArray(payload?.data) ? payload.data : [];
        state.listAt = payload?.generated_at || null;
      })
      .addCase(fetchLicenceList.rejected, (state, { error }) => {
        state.loadingList = false;
        state.error = error.message || "Failed to reach TAMS";
      });
  },
});

export const { setLicenceFilter } = slice.actions;
export default slice.reducer;
