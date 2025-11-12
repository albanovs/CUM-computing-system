import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";

export const fetchClients = createAsyncThunk("clients/fetchAll", async () => {
    const res = await fetch("/api/clients");
    if (!res.ok) throw new Error("Ошибка загрузки клиентов");
    return await res.json();
});

export const addClient = createAsyncThunk("clients/add", async (clientData) => {
    const res = await fetch("/api/clients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(clientData),
    });
    if (!res.ok) throw new Error("Ошибка при добавлении клиента");
    return await res.json();
});

export const updateClient = createAsyncThunk("clients/update", async ({ id, updates }) => {
    const res = await fetch(`/api/clients/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
    });
    if (!res.ok) throw new Error("Ошибка при обновлении клиента");
    return await res.json();
});

export const deleteClient = createAsyncThunk("clients/delete", async (id) => {
    const res = await fetch(`/api/clients/${id}`, { method: "DELETE" });
    if (!res.ok) throw new Error("Ошибка при удалении клиента");
    return id;
});

export const updateClientPayments = createAsyncThunk(
    "clients/updatePayments",
    async ({ id, payments, remainingAmount }) => {
        const res = await fetch(`/api/clients/${id}/payments`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ payments, remainingAmount }),
        });
        if (!res.ok) throw new Error("Ошибка при обновлении платежей клиента");
        return await res.json();
    }
);

const clientsSlice = createSlice({
    name: "clients",
    initialState: {
        list: [],
        loading: false,
        error: null,
    },
    reducers: {},
    extraReducers: (builder) => {
        builder
            .addCase(fetchClients.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchClients.fulfilled, (state, action) => {
                state.loading = false;
                state.list = action.payload;
            })
            .addCase(fetchClients.rejected, (state, action) => {
                state.loading = false;
                state.error = action.error.message;
            })

            .addCase(addClient.fulfilled, (state, action) => {
                state.list.unshift(action.payload);
            })

            .addCase(updateClient.fulfilled, (state, action) => {
                const index = state.list.findIndex((c) => c._id === action.payload._id);
                if (index !== -1) state.list[index] = action.payload;
            })

            .addCase(deleteClient.fulfilled, (state, action) => {
                state.list = state.list.filter((c) => c._id !== action.payload);
            })

            .addCase(updateClientPayments.fulfilled, (state, action) => {
                const index = state.list.findIndex((c) => c._id === action.payload._id);
                if (index !== -1) state.list[index] = action.payload;
            });
    },
});

export default clientsSlice.reducer;
