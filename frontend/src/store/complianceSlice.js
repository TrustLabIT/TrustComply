import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { TODAY } from "../data/helpers";
import { listFilingsApi, createFilingApi, updateFilingApi, deleteFilingApi } from "../api/filings";
import { listUsersApi, createUserApi, updateUserApi, deleteUserApi } from "../api/users";
import { listDirectorsApi, createDirectorApi, updateDirectorApi, deleteDirectorApi } from "../api/directors";
import { getRegisterChecksApi, toggleRegisterCheckApi } from "../api/registerChecks";

// ---------------------------------------------------------------------------
// RTK async thunks — the Filings module talks to the backend through these.
// Components dispatch them; the reducers below fold the API result into state.
// ---------------------------------------------------------------------------
export const fetchFilings = createAsyncThunk("compliance/fetchFilings", () => listFilingsApi());

export const createFiling = createAsyncThunk("compliance/createFiling", (payload) =>
  createFilingApi(payload)
);

export const updateFiling = createAsyncThunk("compliance/updateFiling", ({ id, ...patch }) =>
  updateFilingApi(id, patch)
);

export const removeFiling = createAsyncThunk("compliance/removeFiling", async (id) => {
  await deleteFilingApi(id);
  return id;
});

// ---- Users module (Settings) ----
export const fetchUsers = createAsyncThunk("compliance/fetchUsers", () => listUsersApi());
export const createUser = createAsyncThunk("compliance/createUser", (payload) => createUserApi(payload));
export const updateUser = createAsyncThunk("compliance/updateUser", ({ uid, ...patch }) =>
  updateUserApi(uid, patch)
);
export const removeUser = createAsyncThunk("compliance/removeUser", async (uid) => {
  await deleteUserApi(uid);
  return uid;
});

// ---- Directors module (CS · DIN & DSC) ----
export const fetchDirectors = createAsyncThunk("compliance/fetchDirectors", () => listDirectorsApi());
export const createDirector = createAsyncThunk("compliance/createDirector", (payload) => createDirectorApi(payload));
export const updateDirector = createAsyncThunk("compliance/updateDirector", ({ id, ...patch }) =>
  updateDirectorApi(id, patch)
);
export const removeDirector = createAsyncThunk("compliance/removeDirector", async (id) => {
  await deleteDirectorApi(id);
  return id;
});

// ---- Register checklist module (CS · Statutory registers) ----
export const fetchRegisterChecks = createAsyncThunk("compliance/fetchRegisterChecks", ({ entity, fy }) =>
  getRegisterChecksApi(entity, fy)
);
export const toggleRegisterCheck = createAsyncThunk("compliance/toggleRegisterCheck", ({ entity, fy, index }) =>
  toggleRegisterCheckApi(entity, fy, index)
);

const initialState = {
  entity: "TDPL",
  fy: "2026-27",
  calMonth: TODAY.getMonth(),
  calYear: TODAY.getFullYear(),
  db: [], // starts empty — no seeding; populated from the API after login
  loading: false,
  error: null,
  filingsVersion: 0, // bumped on any filing mutation so server-paginated views refetch
  usersVersion: 0, // bumped on any user mutation so the Settings table refetches
  directorsVersion: 0, // bumped on any director mutation so the DIN register refetches
  filter: { q: "", status: "", owner: "" },
  users: [], // loaded from the API (Settings)
  directors: [], // loaded from the API (CS · DIN & DSC)
  regChecks: {}, // { "TDPL:2026-27": [0,3,...] } — checked register indices, from the API
};

const slice = createSlice({
  name: "compliance",
  initialState,
  reducers: {
    setFY(state, { payload }) {
      state.fy = payload;
      const sy = parseInt(payload.slice(0, 4), 10);
      const curFY = TODAY >= new Date(sy, 3, 1) && TODAY < new Date(sy + 1, 3, 1);
      if (curFY) {
        state.calMonth = TODAY.getMonth();
        state.calYear = TODAY.getFullYear();
      } else {
        state.calMonth = 3;
        state.calYear = sy;
      }
      state.filter = { q: "", status: "", owner: "" };
    },
    setEntity(state, { payload }) {
      state.entity = payload;
    },
    setCal(state, { payload }) {
      state.calMonth = payload.month;
      state.calYear = payload.year;
    },
    calShift(state, { payload }) {
      let m = state.calMonth + payload;
      let y = state.calYear;
      if (m < 0) {
        m = 11;
        y -= 1;
      }
      if (m > 11) {
        m = 0;
        y += 1;
      }
      state.calMonth = m;
      state.calYear = y;
    },
    calToday(state) {
      state.calMonth = TODAY.getMonth();
      state.calYear = TODAY.getFullYear();
    },
    setFilter(state, { payload }) {
      state.filter = { ...state.filter, ...payload };
    },
    clearFilter(state) {
      state.filter = { q: "", status: "", owner: "" };
    },
    resetData(state) {
      state.db = [];
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchFilings.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchFilings.fulfilled, (state, { payload }) => {
        state.loading = false;
        state.db = payload;
      })
      .addCase(fetchFilings.rejected, (state, { error }) => {
        state.loading = false;
        state.error = error.message;
      })
      .addCase(createFiling.fulfilled, (state, { payload }) => {
        state.db.push(payload);
        state.filingsVersion += 1;
      })
      .addCase(updateFiling.fulfilled, (state, { payload }) => {
        const i = state.db.findIndex((r) => r.id === payload.id);
        if (i >= 0) state.db[i] = payload;
        state.filingsVersion += 1;
      })
      .addCase(removeFiling.fulfilled, (state, { payload }) => {
        state.db = state.db.filter((r) => r.id !== payload);
        state.filingsVersion += 1;
      })
      // ---- users ----
      .addCase(fetchUsers.fulfilled, (state, { payload }) => {
        state.users = payload;
      })
      .addCase(createUser.fulfilled, (state, { payload }) => {
        state.users.push(payload);
        state.usersVersion += 1;
      })
      .addCase(updateUser.fulfilled, (state, { payload }) => {
        const i = state.users.findIndex((u) => u.uid === payload.uid);
        if (i >= 0) state.users[i] = payload;
        state.usersVersion += 1;
      })
      .addCase(removeUser.fulfilled, (state, { payload }) => {
        state.users = state.users.filter((u) => u.uid !== payload);
        state.usersVersion += 1;
      })
      // ---- directors ----
      .addCase(fetchDirectors.fulfilled, (state, { payload }) => {
        state.directors = payload;
      })
      .addCase(createDirector.fulfilled, (state, { payload }) => {
        state.directors.push(payload);
        state.directorsVersion += 1;
      })
      .addCase(updateDirector.fulfilled, (state, { payload }) => {
        const i = state.directors.findIndex((d) => d.id === payload.id);
        if (i >= 0) state.directors[i] = payload;
        state.directorsVersion += 1;
      })
      .addCase(removeDirector.fulfilled, (state, { payload }) => {
        state.directors = state.directors.filter((d) => d.id !== payload);
        state.directorsVersion += 1;
      })
      // ---- register checklist ----
      .addCase(fetchRegisterChecks.fulfilled, (state, { payload }) => {
        state.regChecks[`${payload.entity}:${payload.fy}`] = payload.checked || [];
      })
      .addCase(toggleRegisterCheck.fulfilled, (state, { payload }) => {
        state.regChecks[`${payload.entity}:${payload.fy}`] = payload.checked || [];
      });
  },
});

export const actions = slice.actions;
export default slice.reducer;
