create or replace view public.popular_meals as
select
  m.id as meal_id,
  m.title,
  m.category,
  m.chef_id,
  count(distinct o.customer_id) as distinct_customers,
  count(o.id) as total_orders
from public.meals m
join public.orders o on o.meal_id = m.id
where o.status <> 'cancelled'
group by m.id, m.title, m.category, m.chef_id
order by distinct_customers desc, total_orders desc;
