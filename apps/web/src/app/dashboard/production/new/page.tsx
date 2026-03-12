'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import { useCreateProductionPlan } from '@/hooks/use-production';
import { useProducts } from '@/hooks/use-products';
import { Button } from '@/components/ui';
import { Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

export default function NewProductionPlanPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const createPlan = useCreateProductionPlan();
  
  // Fetch all active products for the dropdown
  const { data: productsData } = useProducts({ limit: 100 });
  const products = productsData?.data || [];

  const [startDate, setStartDate] = useState(new Date().toISOString().slice(0, 10));
  const [endDate, setEndDate] = useState('');
  const [notes, setNotes] = useState('');
  const [details, setDetails] = useState([{ itemId: '', quantityPlanned: 1 }]);

  const handleAddDetail = () => {
    setDetails([...details, { itemId: '', quantityPlanned: 1 }]);
  };

  const handleRemoveDetail = (index: number) => {
    setDetails(details.filter((_, i) => i !== index));
  };

  const handleChangeDetail = (index: number, field: string, value: string | number) => {
    const newDetails = [...details];
    newDetails[index] = { ...newDetails[index], [field]: value };
    setDetails(newDetails);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Filter out rows without item selected
    const validDetails = details
      .filter((d) => d.itemId !== '')
      .map((d) => ({
        itemId: parseInt(d.itemId as string, 10),
        quantityPlanned: Number(d.quantityPlanned),
      }));

    if (validDetails.length === 0) {
      toast.warning('Please add at least one product to the plan.');
      return;
    }

    try {
      await createPlan.mutateAsync({
        startDate,
        endDate: endDate || undefined,
        notes,
        details: validDetails,
      });
      // Remove cached queries to force fresh fetch on the list page
      queryClient.removeQueries({ queryKey: ['production-plans'] });
      toast.success('Production plan created!');
      router.push('/dashboard/production');
    } catch (error: any) {
      toast.error(error?.message || 'Failed to create production plan.');
    }
  };

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between space-y-2 mb-6">
        <h2 className="text-3xl font-bold tracking-tight text-gray-900">Create Production Plan</h2>
      </div>

      <div className="bg-white rounded-lg border shadow-sm">
        <div className="p-6 border-b">
          <h3 className="text-lg font-medium leading-6 text-gray-900">Plan Details</h3>
        </div>
        <div className="p-6 text-gray-900">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="space-y-2">
                <label htmlFor="startDate" className="block text-sm font-medium text-gray-700">Start Date</label>
                <input
                  id="startDate"
                  type="date"
                  required
                  className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="endDate" className="block text-sm font-medium text-gray-700">End Date (Optional)</label>
                <input
                  id="endDate"
                  type="date"
                  className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="notes" className="block text-sm font-medium text-gray-700">Notes</label>
              <textarea
                id="notes"
                placeholder="Any special instructions..."
                className="flex min-h-[80px] w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <label className="block text-sm font-medium text-gray-700">Items to Produce</label>
                <button
                  type="button"
                  onClick={handleAddDetail}
                  className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none border border-gray-300 bg-transparent hover:bg-gray-100 text-gray-900 h-9 px-3"
                >
                  <Plus className="mr-2 h-4 w-4" /> Add Item
                </button>
              </div>

              {details.map((detail, index) => (
                <div key={index} className="flex items-end gap-4 border p-4 rounded-md bg-gray-50">
                  <div className="flex-1 space-y-2">
                    <label className="block text-sm font-medium text-gray-700">Product</label>
                    <select
                      className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      value={detail.itemId}
                      onChange={(e) => handleChangeDetail(index, 'itemId', e.target.value)}
                      required
                    >
                      <option value="" disabled>Select a product...</option>
                      {products.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name} ({p.sku})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="w-32 space-y-2">
                    <label className="block text-sm font-medium text-gray-700">Quantity</label>
                    <input
                      type="number"
                      min="1"
                      className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      value={detail.quantityPlanned}
                      onChange={(e) => handleChangeDetail(index, 'quantityPlanned', e.target.value)}
                      required
                    />
                  </div>
                  <button
                    type="button"
                    className="inline-flex items-center justify-center rounded-md text-sm font-medium h-10 w-10 text-red-600 hover:bg-red-100 disabled:opacity-50"
                    onClick={() => handleRemoveDetail(index)}
                    disabled={details.length === 1}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>

            <div className="flex justify-end gap-4 pt-4 border-t">
              <button
                type="button"
                className="inline-flex items-center justify-center rounded-md text-sm font-medium border border-gray-300 bg-transparent hover:bg-gray-100 text-gray-900 h-10 px-4 py-2"
                onClick={() => router.back()}
              >
                Cancel
              </button>
              <Button type="submit" disabled={createPlan.isPending}>
                {createPlan.isPending ? 'Saving...' : 'Create Plan'}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
