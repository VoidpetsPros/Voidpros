-- Clears the stale Stripe customer/subscription reference on your account
-- so the next checkout attempt creates a fresh, valid customer.
update profiles
set stripe_customer_id = null,
    stripe_subscription_id = null,
    is_subscribed = false
where username = 'voidpetsranking';
