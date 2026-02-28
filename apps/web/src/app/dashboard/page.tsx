/**
 * Dashboard Home Page
 */
export default function DashboardPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800">Dashboard</h1>
      <p className="mt-2 text-gray-600">
        Welcome to CKMS - Central Kitchen Management System
      </p>

      <div className="mt-8 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Categories" value="-" />
        <StatCard title="Stores" value="-" />
        <StatCard title="Products" value="-" />
        <StatCard title="Orders" value="-" />
      </div>
    </div>
  );
}

function StatCard({ title, value }: { title: string; value: string }) {
  return (
    <div className="rounded-lg border bg-white p-6 shadow-sm">
      <p className="text-sm text-gray-500">{title}</p>
      <p className="mt-2 text-3xl font-bold text-gray-800">{value}</p>
    </div>
  );
}
