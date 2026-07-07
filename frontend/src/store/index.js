import { configureStore } from "@reduxjs/toolkit";
import compliance from "./complianceSlice";

const store = configureStore({
  reducer: { compliance },
  // Uploaded docs are data-URI strings — serialisable, but the check is noisy for large files.
  middleware: (getDefault) => getDefault({ serializableCheck: false }),
});

export default store;
