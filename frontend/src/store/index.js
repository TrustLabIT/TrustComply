import { configureStore } from "@reduxjs/toolkit";
import compliance from "./complianceSlice";
import medical from "./medicalSlice";

const store = configureStore({
  reducer: { compliance, medical },
  // Uploaded docs are data-URI strings — serialisable, but the check is noisy for large files.
  middleware: (getDefault) => getDefault({ serializableCheck: false }),
});

export default store;
