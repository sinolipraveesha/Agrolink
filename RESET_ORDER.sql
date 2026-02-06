-- Reset the order to 'accepted' status so you can test Farmer Tracking again
-- Replace 'ORDER_ID_HERE' with the Trip ID shown in your debug panel
update public.orders
set status = 'accepted'
where id = '5c03f809-4989-46cb-aea9-b7043b88779f'; -- I copied this ID from your screenshot
