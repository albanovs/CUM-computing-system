import { configureStore } from "@reduxjs/toolkit";
import clientsSlice from "@/lib/slices/clientsSlice";
import cashSlice from "@/lib/slices/cashSlice";

export const store = configureStore({
    reducer: {
        clients: clientsSlice,
        cash: cashSlice,
    },
});