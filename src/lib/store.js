import { configureStore } from "@reduxjs/toolkit";
import clientsSlice from "../lib/slices/clientsSlice";
import cashSlice from "../lib/slices/cashSlice";
import warehouseSlice from "../lib/slices/wareSlice";

export const store = configureStore({
    reducer: {
        clients: clientsSlice,
        cash: cashSlice,
        warehouse: warehouseSlice,
    },
});