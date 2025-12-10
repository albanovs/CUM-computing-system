"use client";

import { useState, useEffect } from "react";
import { useDispatch } from "react-redux";
import { addWarehouseItem, updateWarehouseItem } from "../../../lib/slices/wareSlice";

export default function WarehouseModal({ data = null, onClose }) {
  const dispatch = useDispatch();

  const emptyDuty = {
    name: "",
    department: "",
    PhoneNumber: "",
    returnDate: "",
    comment: "",
  };

  const emptyForm = {
    IMEI: "",
    phoneModel: "",
    color: "",
    storage: "",
    price: "",
    currency: "СОМ",
    duty: false,
    comment: "",
    dutyDetail: emptyDuty,
  };

  const [form, setForm] = useState(emptyForm);

  // Загружаем данные если редактируем
  useEffect(() => {
    if (data) {
      setForm({
        IMEI: data.IMEI || "",
        phoneModel: data.phoneModel || "",
        color: data.color || "",
        storage: data.storage || "",
        price: data.price || "",
        currency: data.currency || "СОМ",
        duty: data.duty || false,
        comment: data.comment || "",
        dutyDetail: {
          name: data.dutyDetail?.name || "",
          department: data.dutyDetail?.department || "",
          PhoneNumber: data.dutyDetail?.PhoneNumber || "",
          returnDate: data.dutyDetail?.returnDate || "",
          comment: data.dutyDetail?.comment || "",
        },
      });
    } else {
      setForm(emptyForm);
    }
  }, [data]);

  const handleSubmit = async () => {
    if (data) {
      await dispatch(updateWarehouseItem({ id: data._id, updates: form }));
    } else {
      await dispatch(addWarehouseItem(form));
    }
    onClose();
  };

  const isEditingWithDuty = data && form.duty;

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50 p-2">
      <div className="bg-white w-full max-w-2xl rounded-xl shadow-xl relative max-h-[90vh] flex flex-col">

        {/* HEADER */}
        <div className="p-5 border-b">
          <h2 className="text-xl font-bold">
            {data ? "Редактировать товар" : "Добавить товар"}
          </h2>
        </div>

        {/* BODY */}
        <div className="p-5 overflow-y-auto space-y-4">
          {/* Основные поля */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

            <input
              className="border p-2 rounded"
              placeholder="IMEI"
              value={form.IMEI}
              onChange={(e) => setForm({ ...form, IMEI: e.target.value })}
            />

            <input
              className="border p-2 rounded"
              placeholder="Модель"
              value={form.phoneModel}
              onChange={(e) => setForm({ ...form, phoneModel: e.target.value })}
            />

            <input
              className="border p-2 rounded"
              placeholder="Цвет"
              value={form.color}
              onChange={(e) => setForm({ ...form, color: e.target.value })}
            />

            <input
              className="border p-2 rounded"
              placeholder="Память"
              value={form.storage}
              onChange={(e) => setForm({ ...form, storage: e.target.value })}
            />

            <input
              type="number"
              className="border p-2 rounded"
              placeholder="Цена"
              value={form.price}
              onChange={(e) => setForm({ ...form, price: e.target.value })}
            />

            <select
              className="border p-2 rounded"
              value={form.currency}
              onChange={(e) => setForm({ ...form, currency: e.target.value })}
            >
              <option value="СОМ">СОМ</option>
              <option value="USD">USD</option>
            </select>

          </div>

          {/* В долг */}
          {!isEditingWithDuty && (
            <label className="flex items-center gap-2 text-sm mt-3">
              <input
                type="checkbox"
                checked={form.duty}
                onChange={(e) => setForm({ ...form, duty: e.target.checked })}
              />
              В долг
            </label>
          )}

          {/* Поля долга */}
          {form.duty && (
            <div className="border rounded-xl p-4 bg-gray-50 space-y-3">
              <p className="font-semibold text-sm">Информация по долгу</p>

              <input
                className="border p-2 rounded w-full"
                placeholder="Имя"
                value={form.dutyDetail.name}
                onChange={(e) =>
                  setForm({
                    ...form,
                    dutyDetail: { ...form.dutyDetail, name: e.target.value },
                  })
                }
              />

              <input
                className="border p-2 rounded w-full"
                placeholder="Отдел"
                value={form.dutyDetail.department}
                onChange={(e) =>
                  setForm({
                    ...form,
                    dutyDetail: { ...form.dutyDetail, department: e.target.value },
                  })
                }
              />

              <input
                className="border p-2 rounded w-full"
                placeholder="Телефон"
                value={form.dutyDetail.PhoneNumber}
                onChange={(e) =>
                  setForm({
                    ...form,
                    dutyDetail: { ...form.dutyDetail, PhoneNumber: e.target.value },
                  })
                }
              />

              <input
                type="date"
                className="border p-2 rounded w-full"
                value={form.dutyDetail.returnDate || ""}
                onChange={(e) =>
                  setForm({
                    ...form,
                    dutyDetail: { ...form.dutyDetail, returnDate: e.target.value },
                  })
                }
              />

              <textarea
                className="border p-2 rounded w-full"
                placeholder="Комментарий"
                value={form.dutyDetail.comment}
                onChange={(e) =>
                  setForm({
                    ...form,
                    dutyDetail: { ...form.dutyDetail, comment: e.target.value },
                  })
                }
              />
            </div>
          )}

          {/* Комментарий */}
          <textarea
            className="border p-2 rounded w-full"
            placeholder="Комментарий"
            value={form.comment}
            onChange={(e) => setForm({ ...form, comment: e.target.value })}
          />

        </div>

        {/* FOOTER */}
        <div className="p-4 border-t flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 border rounded hover:bg-gray-100"
          >
            Отмена
          </button>

          <button
            onClick={handleSubmit}
            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
          >
            {data ? "Сохранить" : "Добавить"}
          </button>
        </div>

      </div>
    </div>
  );
}
