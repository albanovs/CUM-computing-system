import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";

// GET all items
export const fetchWarehouse = createAsyncThunk(
    "warehouse/fetchWarehouse",
    async (_, thunkAPI) => {
        try {
            const res = await fetch("/api/warehouse");
            const data = await res.json();
            return data;
        } catch (err) {
            return thunkAPI.rejectWithValue(err.message);
        }
    }
);

// ADD new item
export const addWarehouseItem = createAsyncThunk(
    "warehouse/addWarehouseItem",
    async (item, thunkAPI) => {
        try {
            const res = await fetch("/api/warehouse", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(item),
            });
            const data = await res.json();
            return data;
        } catch (err) {
            return thunkAPI.rejectWithValue(err.message);
        }
    }
);

// UPDATE existing item
export const updateWarehouseItem = createAsyncThunk(
    "warehouse/updateWarehouseItem",
    async ({ id, updates }, thunkAPI) => {
        try {
            const res = await fetch(`/api/warehouse/${id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(updates),
            });
            const data = await res.json();
            return data;
        } catch (err) {
            return thunkAPI.rejectWithValue(err.message);
        }
    }
);

// DELETE item
export const deleteWarehouseItem = createAsyncThunk(
    "warehouse/deleteWarehouseItem",
    async (id, thunkAPI) => {
        try {
            await fetch(`/api/warehouse/${id}`, { method: "DELETE" });
            return id;
        } catch (err) {
            return thunkAPI.rejectWithValue(err.message);
        }
    }
);

// RETURN DUTY
export const returnDuty = createAsyncThunk(
    "warehouse/returnDuty",
    async (id, thunkAPI) => {
        try {
            const res = await fetch(`/api/warehouse/return`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id }),
            });

            if (!res.ok) throw new Error("Ошибка возврата");

            return id; // возвращаем id, чтобы обновить локальный state
        } catch (err) {
            return thunkAPI.rejectWithValue(err.message);
        }
    }
);

const warehouseSlice = createSlice({
    name: "warehouse",
    initialState: {
        list: [],
        loading: false,
        error: null,
        actionLoading: null, // для кнопки "Вернуть"
    },
    reducers: {},
    extraReducers: (builder) => {
        // FETCH
        builder
            .addCase(fetchWarehouse.pending, (state) => {
                state.loading = true;
            })
            .addCase(fetchWarehouse.fulfilled, (state, action) => {
                state.loading = false;
                state.list = action.payload;
            })
            .addCase(fetchWarehouse.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            });

        // ADD
        builder
            .addCase(addWarehouseItem.pending, (state) => {
                state.loading = true;
            })
            .addCase(addWarehouseItem.fulfilled, (state, action) => {
                state.loading = false;
                state.list.push(action.payload);
            })
            .addCase(addWarehouseItem.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            });

        // UPDATE
        builder
            .addCase(updateWarehouseItem.pending, (state) => {
                state.loading = true;
            })
            .addCase(updateWarehouseItem.fulfilled, (state, action) => {
                state.loading = false;
                const index = state.list.findIndex((i) => i._id === action.payload._id);
                if (index !== -1) {
                    state.list[index] = action.payload;
                }
            })
            .addCase(updateWarehouseItem.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            });

        // DELETE
        builder
            .addCase(deleteWarehouseItem.pending, (state) => {
                state.loading = true;
            })
            .addCase(deleteWarehouseItem.fulfilled, (state, action) => {
                state.loading = false;
                state.list = state.list.filter((i) => i._id !== action.payload);
            })
            .addCase(deleteWarehouseItem.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            });

        // RETURN DUTY
        builder
            .addCase(returnDuty.pending, (state, action) => {
                state.actionLoading = action.meta.arg; // id товара, который обрабатывается
            })
            .addCase(returnDuty.fulfilled, (state, action) => {
                const id = action.payload;
                state.list = state.list.filter((item) => item._id !== id);
                state.actionLoading = null;
            })
            .addCase(returnDuty.rejected, (state) => {
                state.actionLoading = null;
            });
    },
});

export default warehouseSlice.reducer;
