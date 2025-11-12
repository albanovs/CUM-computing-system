export function StatCard({ title, value, Icon, color = "text-blue-500" }) {
    return (
        <div className="bg-white p-5 rounded-2xl shadow hover:shadow-md transition flex items-center justify-between">
            <div>
                <h3 className="text-gray-500 text-sm">{title}</h3>
                <p className="text-2xl font-semibold mt-1">{value}</p>
            </div>
            <Icon className={`${color} text-3xl`} />
        </div>
    );
}
