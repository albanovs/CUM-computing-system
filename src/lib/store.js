import { configureStore } from "@reduxjs/toolkit";
import clientsSlice from "@/lib/slices/clientsSlice";

export const store = configureStore({
    reducer: {
        clients: clientsSlice,
    },
});