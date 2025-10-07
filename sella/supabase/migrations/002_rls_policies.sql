-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE merchants ENABLE ROW LEVEL SECURITY;
ALTER TABLE merchant_outlets ENABLE ROW LEVEL SECURITY;
ALTER TABLE merchant_hours ENABLE ROW LEVEL SECURITY;
ALTER TABLE delivery_zones ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE combos ENABLE ROW LEVEL SECURITY;
ALTER TABLE combo_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE shopping_lists ENABLE ROW LEVEL SECURITY;
ALTER TABLE shopping_list_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE deliveries ENABLE ROW LEVEL SECURITY;
ALTER TABLE delivery_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE reward_wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE reward_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE promotions ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Helper function to get user role
CREATE OR REPLACE FUNCTION get_user_role(user_id UUID)
RETURNS user_role AS $$
BEGIN
    RETURN (SELECT role FROM profiles WHERE id = user_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper function to get user's merchant_id
CREATE OR REPLACE FUNCTION get_user_merchant_id(user_id UUID)
RETURNS UUID AS $$
BEGIN
    -- This would need to be implemented based on how merchants are linked to users
    -- For now, return null - this will be updated when merchant-user relationship is defined
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Profiles policies
CREATE POLICY "Users can view own profile" ON profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Platform admins can view all profiles" ON profiles
    FOR SELECT USING (get_user_role(auth.uid()) = 'platform_admin');

CREATE POLICY "Platform admins can update all profiles" ON profiles
    FOR UPDATE USING (get_user_role(auth.uid()) = 'platform_admin');

-- Addresses policies
CREATE POLICY "Users can manage own addresses" ON addresses
    FOR ALL USING (profile_id = auth.uid());

CREATE POLICY "Platform admins can view all addresses" ON addresses
    FOR SELECT USING (get_user_role(auth.uid()) = 'platform_admin');

-- Merchants policies (public read for active merchants)
CREATE POLICY "Anyone can view active merchants" ON merchants
    FOR SELECT USING (is_active = true);

CREATE POLICY "Merchant admins can manage own merchant" ON merchants
    FOR ALL USING (
        get_user_role(auth.uid()) = 'merchant_admin' AND 
        id = get_user_merchant_id(auth.uid())
    );

CREATE POLICY "Platform admins can manage all merchants" ON merchants
    FOR ALL USING (get_user_role(auth.uid()) = 'platform_admin');

-- Merchant outlets policies
CREATE POLICY "Anyone can view outlets of active merchants" ON merchant_outlets
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM merchants 
            WHERE merchants.id = merchant_outlets.merchant_id 
            AND merchants.is_active = true
        )
    );

CREATE POLICY "Merchant admins can manage own outlets" ON merchant_outlets
    FOR ALL USING (
        get_user_role(auth.uid()) = 'merchant_admin' AND 
        merchant_id = get_user_merchant_id(auth.uid())
    );

CREATE POLICY "Platform admins can manage all outlets" ON merchant_outlets
    FOR ALL USING (get_user_role(auth.uid()) = 'platform_admin');

-- Merchant hours policies
CREATE POLICY "Anyone can view hours of active merchant outlets" ON merchant_hours
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM merchant_outlets mo
            JOIN merchants m ON m.id = mo.merchant_id
            WHERE mo.id = merchant_hours.outlet_id 
            AND m.is_active = true
        )
    );

CREATE POLICY "Merchant admins can manage own hours" ON merchant_hours
    FOR ALL USING (
        get_user_role(auth.uid()) = 'merchant_admin' AND 
        EXISTS (
            SELECT 1 FROM merchant_outlets mo
            WHERE mo.id = merchant_hours.outlet_id 
            AND mo.merchant_id = get_user_merchant_id(auth.uid())
        )
    );

-- Delivery zones policies
CREATE POLICY "Anyone can view delivery zones of active merchants" ON delivery_zones
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM merchant_outlets mo
            JOIN merchants m ON m.id = mo.merchant_id
            WHERE mo.id = delivery_zones.outlet_id 
            AND m.is_active = true
        )
    );

CREATE POLICY "Merchant admins can manage own delivery zones" ON delivery_zones
    FOR ALL USING (
        get_user_role(auth.uid()) = 'merchant_admin' AND 
        EXISTS (
            SELECT 1 FROM merchant_outlets mo
            WHERE mo.id = delivery_zones.outlet_id 
            AND mo.merchant_id = get_user_merchant_id(auth.uid())
        )
    );

-- Categories policies
CREATE POLICY "Anyone can view categories of active merchants" ON categories
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM merchants 
            WHERE merchants.id = categories.merchant_id 
            AND merchants.is_active = true
        )
    );

CREATE POLICY "Merchant admins can manage own categories" ON categories
    FOR ALL USING (
        get_user_role(auth.uid()) = 'merchant_admin' AND 
        merchant_id = get_user_merchant_id(auth.uid())
    );

-- Products policies
CREATE POLICY "Anyone can view active products of active merchants" ON products
    FOR SELECT USING (
        is_active = true AND
        EXISTS (
            SELECT 1 FROM merchants 
            WHERE merchants.id = products.merchant_id 
            AND merchants.is_active = true
        )
    );

CREATE POLICY "Merchant admins can manage own products" ON products
    FOR ALL USING (
        get_user_role(auth.uid()) = 'merchant_admin' AND 
        merchant_id = get_user_merchant_id(auth.uid())
    );

-- Product images policies
CREATE POLICY "Anyone can view product images" ON product_images
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM products p
            JOIN merchants m ON m.id = p.merchant_id
            WHERE p.id = product_images.product_id 
            AND p.is_active = true 
            AND m.is_active = true
        )
    );

CREATE POLICY "Merchant admins can manage own product images" ON product_images
    FOR ALL USING (
        get_user_role(auth.uid()) = 'merchant_admin' AND 
        EXISTS (
            SELECT 1 FROM products p
            WHERE p.id = product_images.product_id 
            AND p.merchant_id = get_user_merchant_id(auth.uid())
        )
    );

-- Orders policies
CREATE POLICY "Customers can view own orders" ON orders
    FOR SELECT USING (
        get_user_role(auth.uid()) = 'customer' AND 
        customer_id = auth.uid()
    );

CREATE POLICY "Customers can create orders" ON orders
    FOR INSERT WITH CHECK (
        get_user_role(auth.uid()) = 'customer' AND 
        customer_id = auth.uid()
    );

CREATE POLICY "Merchant admins can view orders for their outlets" ON orders
    FOR SELECT USING (
        get_user_role(auth.uid()) = 'merchant_admin' AND 
        EXISTS (
            SELECT 1 FROM merchant_outlets mo
            WHERE mo.id = orders.outlet_id 
            AND mo.merchant_id = get_user_merchant_id(auth.uid())
        )
    );

CREATE POLICY "Merchant admins can update orders for their outlets" ON orders
    FOR UPDATE USING (
        get_user_role(auth.uid()) = 'merchant_admin' AND 
        EXISTS (
            SELECT 1 FROM merchant_outlets mo
            WHERE mo.id = orders.outlet_id 
            AND mo.merchant_id = get_user_merchant_id(auth.uid())
        )
    );

CREATE POLICY "Drivers can view assigned orders" ON orders
    FOR SELECT USING (
        get_user_role(auth.uid()) = 'driver' AND 
        EXISTS (
            SELECT 1 FROM deliveries d
            WHERE d.order_id = orders.id 
            AND d.driver_id = auth.uid()
        )
    );

-- Order items policies
CREATE POLICY "Customers can view own order items" ON order_items
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM orders o
            WHERE o.id = order_items.order_id 
            AND o.customer_id = auth.uid()
            AND get_user_role(auth.uid()) = 'customer'
        )
    );

CREATE POLICY "Merchant admins can view order items for their outlets" ON order_items
    FOR ALL USING (
        get_user_role(auth.uid()) = 'merchant_admin' AND 
        EXISTS (
            SELECT 1 FROM orders o
            JOIN merchant_outlets mo ON mo.id = o.outlet_id
            WHERE o.id = order_items.order_id 
            AND mo.merchant_id = get_user_merchant_id(auth.uid())
        )
    );

-- Shopping lists policies (Phase 2)
CREATE POLICY "Customers can manage own shopping lists" ON shopping_lists
    FOR ALL USING (
        get_user_role(auth.uid()) = 'customer' AND 
        customer_id = auth.uid()
    );

CREATE POLICY "Customers can manage own shopping list items" ON shopping_list_items
    FOR ALL USING (
        get_user_role(auth.uid()) = 'customer' AND 
        EXISTS (
            SELECT 1 FROM shopping_lists sl
            WHERE sl.id = shopping_list_items.list_id 
            AND sl.customer_id = auth.uid()
        )
    );

-- Reward wallets policies
CREATE POLICY "Customers can view own reward wallet" ON reward_wallets
    FOR SELECT USING (
        get_user_role(auth.uid()) = 'customer' AND 
        customer_id = auth.uid()
    );

CREATE POLICY "Customers can view own reward transactions" ON reward_transactions
    FOR SELECT USING (
        get_user_role(auth.uid()) = 'customer' AND 
        EXISTS (
            SELECT 1 FROM reward_wallets rw
            WHERE rw.id = reward_transactions.wallet_id 
            AND rw.customer_id = auth.uid()
        )
    );

-- Deliveries policies
CREATE POLICY "Drivers can view assigned deliveries" ON deliveries
    FOR SELECT USING (
        get_user_role(auth.uid()) = 'driver' AND 
        driver_id = auth.uid()
    );

CREATE POLICY "Drivers can update assigned deliveries" ON deliveries
    FOR UPDATE USING (
        get_user_role(auth.uid()) = 'driver' AND 
        driver_id = auth.uid()
    );

CREATE POLICY "Merchant admins can view deliveries for their orders" ON deliveries
    FOR SELECT USING (
        get_user_role(auth.uid()) = 'merchant_admin' AND 
        EXISTS (
            SELECT 1 FROM orders o
            JOIN merchant_outlets mo ON mo.id = o.outlet_id
            WHERE o.id = deliveries.order_id 
            AND mo.merchant_id = get_user_merchant_id(auth.uid())
        )
    );

CREATE POLICY "Customers can view own deliveries" ON deliveries
    FOR SELECT USING (
        get_user_role(auth.uid()) = 'customer' AND 
        EXISTS (
            SELECT 1 FROM orders o
            WHERE o.id = deliveries.order_id 
            AND o.customer_id = auth.uid()
        )
    );

-- Platform admin bypass policies
CREATE POLICY "Platform admins can manage everything" ON orders
    FOR ALL USING (get_user_role(auth.uid()) = 'platform_admin');

CREATE POLICY "Platform admins can manage everything" ON order_items
    FOR ALL USING (get_user_role(auth.uid()) = 'platform_admin');

CREATE POLICY "Platform admins can manage everything" ON deliveries
    FOR ALL USING (get_user_role(auth.uid()) = 'platform_admin');

CREATE POLICY "Platform admins can manage everything" ON reward_wallets
    FOR ALL USING (get_user_role(auth.uid()) = 'platform_admin');

CREATE POLICY "Platform admins can manage everything" ON reward_transactions
    FOR ALL USING (get_user_role(auth.uid()) = 'platform_admin');

-- Audit logs policies (platform admin only)
CREATE POLICY "Platform admins can view audit logs" ON audit_logs
    FOR SELECT USING (get_user_role(auth.uid()) = 'platform_admin');
