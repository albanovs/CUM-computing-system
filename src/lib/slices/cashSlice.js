import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";

export const fetchCashSession = createAsyncThunk(
    "cash/fetchCashSession",
    async (_, { rejectWithValue }) => {
        try {
            const res = await fetch("/api/cash");
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Ошибка загрузки кассы");
            return data.session;
        } catch (err) {
            return rejectWithValue(err.message);
        }
    }
);

export const openCashSession = createAsyncThunk(
    "cash/openCashSession",
    async (_, { rejectWithValue }) => {
        try {
            const res = await fetch("/api/cash", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ action: "open" }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Ошибка открытия кассы");
            return data.session;
        } catch (err) {
            return rejectWithValue(err.message);
        }
    }
);

export const closeCashSession = createAsyncThunk(
    "cash/closeCashSession",
    async (_, { rejectWithValue }) => {
        try {
            const res = await fetch("/api/cash", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ action: "close" }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Ошибка закрытия кассы");
            return data.session;
        } catch (err) {
            return rejectWithValue(err.message);
        }
    }
);

export const addCashOperation = createAsyncThunk(
    "cash/addCashOperation",
    async ({ type, amount, comment, paymentType }, { rejectWithValue }) => {
        try {
            const res = await fetch("/api/cash", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ action: "operation", type, amount, comment, paymentType }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Ошибка операции в кассе");
            return data;
        } catch (err) {
            return rejectWithValue(err.message);
        }
    }
);

const cashSlice = createSlice({
    name: "cash",
    initialState: {
        session: null,
        loading: false,
        error: null,
    },
    reducers: {},
    extraReducers: builder => {
        builder
            .addCase(fetchCashSession.pending, state => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchCashSession.fulfilled, (state, action) => {
                state.loading = false;
                state.session = action.payload;
            })
            .addCase(fetchCashSession.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })

            .addCase(openCashSession.pending, state => {
                state.loading = true;
                state.error = null;
            })
            .addCase(openCashSession.fulfilled, (state, action) => {
                state.loading = false;
                state.session = action.payload;
            })
            .addCase(openCashSession.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })

            .addCase(closeCashSession.pending, state => {
                state.loading = true;
                state.error = null;
            })
            .addCase(closeCashSession.fulfilled, (state, action) => {
                state.loading = false;
                state.session = action.payload;
            })
            .addCase(closeCashSession.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })

            .addCase(addCashOperation.pending, state => {
                state.loading = true;
                state.error = null;
            })
            .addCase(addCashOperation.fulfilled, (state, action) => {
                state.loading = false;
                state.session = action.payload.session;
            })
            .addCase(addCashOperation.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            });
    },
});

export default cashSlice.reducer;
