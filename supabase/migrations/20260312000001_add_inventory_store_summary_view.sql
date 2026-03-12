create or replace view public.inventory_store_summary as
select
  inventory.store_id,
  stores.name as store_name,
  count(*) as total_items,
  sum(inventory.quantity) as total_quantity,
  max(inventory.last_updated) as last_updated
from public.inventory
join public.stores on stores.id = inventory.store_id
group by inventory.store_id, stores.name;