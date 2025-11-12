export function DataTable({ data }) {
    return (
        <div className="bg-white rounded-2xl shadow overflow-hidden">
            <table className="min-w-full text-left">
                <thead className="bg-gray-100 text-gray-600 uppercase text-sm">
                    <tr>
                        <th className="py-3 px-4">ID</th>
                        <th className="py-3 px-4">Название</th>
                        <th className="py-3 px-4">Категория</th>
                        <th className="py-3 px-4">Цена</th>
                    </tr>
                </thead>
                <tbody className="text-gray-700">
                    {data.map((item) => (
                        <tr key={item.id} className="border-t hover:bg-gray-50">
                            <td className="py-3 px-4">{item.id}</td>
                            <td className="py-3 px-4">{item.name}</td>
                            <td className="py-3 px-4">{item.category}</td>
                            <td className="py-3 px-4">{item.price} ₽</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
