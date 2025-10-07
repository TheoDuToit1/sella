-- Function to finalize weight for an order item
CREATE OR REPLACE FUNCTION fn_finalize_weight(
    p_order_item_id UUID,
    p_final_weight_g INTEGER
)
RETURNS JSON AS $$
DECLARE
    v_order_item order_items%ROWTYPE;
    v_order_id UUID;
    v_price_per_kg DECIMAL(10,2);
    v_new_line_total DECIMAL(10,2);
    v_old_line_total DECIMAL(10,2);
    v_result JSON;
BEGIN
    -- Get the order item
    SELECT * INTO v_order_item
    FROM order_items
    WHERE id = p_order_item_id;
    
    IF NOT FOUND THEN
        RETURN json_build_object('success', false, 'error', 'Order item not found');
    END IF;
    
    -- Check if it's weight-based
    IF NOT v_order_item.is_weight_based THEN
        RETURN json_build_object('success', false, 'error', 'Item is not weight-based');
    END IF;
    
    -- Calculate new line total
    v_price_per_kg := v_order_item.price_per_kg;
    v_old_line_total := v_order_item.line_total_est;
    v_new_line_total := (p_final_weight_g::DECIMAL / 1000) * v_price_per_kg;
    
    -- Update the order item
    UPDATE order_items
    SET 
        final_weight_g = p_final_weight_g,
        line_total_final = v_new_line_total,
        updated_at = NOW()
    WHERE id = p_order_item_id;
    
    -- Get order ID for recalculation
    v_order_id := v_order_item.order_id;
    
    -- Recalculate order totals
    PERFORM fn_recalc_order_totals(v_order_id);
    
    -- Log the change
    INSERT INTO audit_logs (actor_id, actor_role, entity, entity_id, action, diff)
    VALUES (
        auth.uid(),
        get_user_role(auth.uid()),
        'order_items',
        p_order_item_id,
        'finalize_weight',
        json_build_object(
            'old_weight_g', v_order_item.est_weight_g,
            'new_weight_g', p_final_weight_g,
            'old_total', v_old_line_total,
            'new_total', v_new_line_total
        )
    );
    
    RETURN json_build_object(
        'success', true,
        'old_weight_g', v_order_item.est_weight_g,
        'new_weight_g', p_final_weight_g,
        'old_total', v_old_line_total,
        'new_total', v_new_line_total,
        'difference', v_new_line_total - v_old_line_total
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to recalculate order totals
CREATE OR REPLACE FUNCTION fn_recalc_order_totals(p_order_id UUID)
RETURNS JSON AS $$
DECLARE
    v_subtotal_est DECIMAL(10,2) := 0;
    v_subtotal_final DECIMAL(10,2) := 0;
    v_tax_total DECIMAL(10,2) := 0;
    v_grand_total_est DECIMAL(10,2) := 0;
    v_grand_total_final DECIMAL(10,2) := 0;
    v_delivery_fee DECIMAL(10,2) := 0;
    v_discount_total DECIMAL(10,2) := 0;
    v_vat_rate DECIMAL(5,4) := 0.15; -- 15% VAT for South Africa
    v_has_final_weights BOOLEAN := false;
BEGIN
    -- Get current delivery fee and discount
    SELECT delivery_fee, discount_total
    INTO v_delivery_fee, v_discount_total
    FROM orders
    WHERE id = p_order_id;
    
    -- Calculate estimated subtotal
    SELECT COALESCE(SUM(line_total_est), 0)
    INTO v_subtotal_est
    FROM order_items
    WHERE order_id = p_order_id;
    
    -- Calculate final subtotal (if final weights exist)
    SELECT 
        COALESCE(SUM(COALESCE(line_total_final, line_total_est)), 0),
        bool_and(final_weight_g IS NOT NULL OR NOT is_weight_based)
    INTO v_subtotal_final, v_has_final_weights
    FROM order_items
    WHERE order_id = p_order_id;
    
    -- Calculate tax on subtotal (before delivery and discounts)
    v_tax_total := (v_subtotal_est - v_discount_total) * v_vat_rate;
    
    -- Calculate grand totals
    v_grand_total_est := v_subtotal_est + v_delivery_fee + v_tax_total - v_discount_total;
    
    IF v_has_final_weights THEN
        v_grand_total_final := v_subtotal_final + v_delivery_fee + 
                              ((v_subtotal_final - v_discount_total) * v_vat_rate) - v_discount_total;
    END IF;
    
    -- Update order
    UPDATE orders
    SET 
        subtotal = v_subtotal_est,
        tax_total = v_tax_total,
        grand_total_est = v_grand_total_est,
        grand_total_final = CASE WHEN v_has_final_weights THEN v_grand_total_final ELSE NULL END,
        updated_at = NOW()
    WHERE id = p_order_id;
    
    RETURN json_build_object(
        'success', true,
        'subtotal_est', v_subtotal_est,
        'subtotal_final', v_subtotal_final,
        'tax_total', v_tax_total,
        'grand_total_est', v_grand_total_est,
        'grand_total_final', v_grand_total_final,
        'has_final_weights', v_has_final_weights
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to accrue reward points
CREATE OR REPLACE FUNCTION fn_rewards_accrue(p_order_id UUID)
RETURNS JSON AS $$
DECLARE
    v_order orders%ROWTYPE;
    v_wallet_id UUID;
    v_points_to_add INTEGER;
    v_reward_rate DECIMAL(5,4) := 0.01; -- 1% reward rate
BEGIN
    -- Get order details
    SELECT * INTO v_order
    FROM orders
    WHERE id = p_order_id;
    
    IF NOT FOUND THEN
        RETURN json_build_object('success', false, 'error', 'Order not found');
    END IF;
    
    -- Only accrue points for delivered orders
    IF v_order.status != 'DELIVERED' THEN
        RETURN json_build_object('success', false, 'error', 'Order not delivered');
    END IF;
    
    -- Get customer's reward wallet
    SELECT id INTO v_wallet_id
    FROM reward_wallets
    WHERE customer_id = v_order.customer_id;
    
    IF NOT FOUND THEN
        -- Create wallet if it doesn't exist
        INSERT INTO reward_wallets (customer_id, balance_points)
        VALUES (v_order.customer_id, 0)
        RETURNING id INTO v_wallet_id;
    END IF;
    
    -- Calculate points (use final total if available, otherwise estimated)
    v_points_to_add := FLOOR(
        COALESCE(v_order.grand_total_final, v_order.grand_total_est) * v_reward_rate * 100
    );
    
    -- Add points to wallet
    UPDATE reward_wallets
    SET 
        balance_points = balance_points + v_points_to_add,
        updated_at = NOW()
    WHERE id = v_wallet_id;
    
    -- Record transaction
    INSERT INTO reward_transactions (wallet_id, order_id, type, points, memo)
    VALUES (
        v_wallet_id,
        p_order_id,
        'earn',
        v_points_to_add,
        'Points earned from order #' || p_order_id
    );
    
    RETURN json_build_object(
        'success', true,
        'points_added', v_points_to_add,
        'order_total', COALESCE(v_order.grand_total_final, v_order.grand_total_est)
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to redeem reward points
CREATE OR REPLACE FUNCTION fn_rewards_redeem(
    p_order_id UUID,
    p_points INTEGER
)
RETURNS JSON AS $$
DECLARE
    v_order orders%ROWTYPE;
    v_wallet_id UUID;
    v_current_balance INTEGER;
    v_discount_amount DECIMAL(10,2);
    v_points_value DECIMAL(5,4) := 0.01; -- 1 point = 1 cent
BEGIN
    -- Get order details
    SELECT * INTO v_order
    FROM orders
    WHERE id = p_order_id;
    
    IF NOT FOUND THEN
        RETURN json_build_object('success', false, 'error', 'Order not found');
    END IF;
    
    -- Get customer's reward wallet
    SELECT id, balance_points INTO v_wallet_id, v_current_balance
    FROM reward_wallets
    WHERE customer_id = v_order.customer_id;
    
    IF NOT FOUND THEN
        RETURN json_build_object('success', false, 'error', 'Reward wallet not found');
    END IF;
    
    -- Check if customer has enough points
    IF v_current_balance < p_points THEN
        RETURN json_build_object('success', false, 'error', 'Insufficient points');
    END IF;
    
    -- Calculate discount amount
    v_discount_amount := p_points * v_points_value;
    
    -- Deduct points from wallet
    UPDATE reward_wallets
    SET 
        balance_points = balance_points - p_points,
        updated_at = NOW()
    WHERE id = v_wallet_id;
    
    -- Update order discount
    UPDATE orders
    SET 
        discount_total = discount_total + v_discount_amount,
        updated_at = NOW()
    WHERE id = p_order_id;
    
    -- Record transaction
    INSERT INTO reward_transactions (wallet_id, order_id, type, points, memo)
    VALUES (
        v_wallet_id,
        p_order_id,
        'redeem',
        -p_points,
        'Points redeemed for order #' || p_order_id
    );
    
    -- Recalculate order totals
    PERFORM fn_recalc_order_totals(p_order_id);
    
    RETURN json_build_object(
        'success', true,
        'points_redeemed', p_points,
        'discount_amount', v_discount_amount,
        'remaining_balance', v_current_balance - p_points
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to estimate delivery fee
CREATE OR REPLACE FUNCTION fn_delivery_fee_estimate(
    p_outlet_id UUID,
    p_address_id UUID
)
RETURNS DECIMAL(10,2) AS $$
DECLARE
    v_outlet_coords GEOGRAPHY;
    v_address_coords GEOGRAPHY;
    v_distance_km DECIMAL(10,2);
    v_zone delivery_zones%ROWTYPE;
    v_fee DECIMAL(10,2) := 0;
BEGIN
    -- Get outlet coordinates
    SELECT coords INTO v_outlet_coords
    FROM merchant_outlets
    WHERE id = p_outlet_id;
    
    -- Get address coordinates
    SELECT coords INTO v_address_coords
    FROM addresses
    WHERE id = p_address_id;
    
    IF v_outlet_coords IS NULL OR v_address_coords IS NULL THEN
        RETURN 0; -- Default fee if coordinates not available
    END IF;
    
    -- Check if address is within any delivery zone
    SELECT * INTO v_zone
    FROM delivery_zones
    WHERE outlet_id = p_outlet_id
    AND ST_Contains(polygon, v_address_coords)
    ORDER BY base_fee ASC
    LIMIT 1;
    
    IF FOUND THEN
        -- Address is within a delivery zone
        v_fee := v_zone.base_fee;
        
        -- Add per-km fee if configured
        IF v_zone.per_km_fee > 0 THEN
            v_distance_km := ST_Distance(v_outlet_coords, v_address_coords) / 1000;
            v_fee := v_fee + (v_distance_km * v_zone.per_km_fee);
        END IF;
    ELSE
        -- Address is outside delivery zones - use default calculation
        v_distance_km := ST_Distance(v_outlet_coords, v_address_coords) / 1000;
        v_fee := 25 + (v_distance_km * 5); -- Base R25 + R5 per km
    END IF;
    
    RETURN ROUND(v_fee, 2);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to create reorder template
CREATE OR REPLACE FUNCTION fn_reorder_template(p_order_id UUID)
RETURNS JSON AS $$
DECLARE
    v_order orders%ROWTYPE;
    v_items JSON;
BEGIN
    -- Get order details
    SELECT * INTO v_order
    FROM orders
    WHERE id = p_order_id;
    
    IF NOT FOUND THEN
        RETURN json_build_object('success', false, 'error', 'Order not found');
    END IF;
    
    -- Get order items as JSON
    SELECT json_agg(
        json_build_object(
            'product_id', product_id,
            'name', name_snapshot,
            'is_weight_based', is_weight_based,
            'est_weight_g', est_weight_g,
            'unit_price', unit_price,
            'price_per_kg', price_per_kg
        )
    ) INTO v_items
    FROM order_items
    WHERE order_id = p_order_id;
    
    RETURN json_build_object(
        'success', true,
        'outlet_id', v_order.outlet_id,
        'delivery_address_id', v_order.delivery_address_id,
        'items', v_items
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to generate tracking code
CREATE OR REPLACE FUNCTION generate_tracking_code()
RETURNS TEXT AS $$
DECLARE
    v_code TEXT;
    v_exists BOOLEAN;
BEGIN
    LOOP
        -- Generate a random 8-character tracking code
        v_code := 'MS60' || upper(substring(md5(random()::text) from 1 for 8));
        
        -- Check if it already exists
        SELECT EXISTS(SELECT 1 FROM deliveries WHERE tracking_code = v_code) INTO v_exists;
        
        -- Exit loop if unique
        IF NOT v_exists THEN
            EXIT;
        END IF;
    END LOOP;
    
    RETURN v_code;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-generate tracking codes
CREATE OR REPLACE FUNCTION set_tracking_code()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.tracking_code IS NULL THEN
        NEW.tracking_code := generate_tracking_code();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_set_tracking_code
    BEFORE INSERT ON deliveries
    FOR EACH ROW
    EXECUTE FUNCTION set_tracking_code();

-- Function to update delivery status with event logging
CREATE OR REPLACE FUNCTION fn_update_delivery_status(
    p_delivery_id UUID,
    p_status delivery_status,
    p_meta JSONB DEFAULT '{}'
)
RETURNS JSON AS $$
DECLARE
    v_delivery deliveries%ROWTYPE;
    v_old_status delivery_status;
BEGIN
    -- Get current delivery
    SELECT * INTO v_delivery
    FROM deliveries
    WHERE id = p_delivery_id;
    
    IF NOT FOUND THEN
        RETURN json_build_object('success', false, 'error', 'Delivery not found');
    END IF;
    
    v_old_status := v_delivery.status;
    
    -- Update delivery status and timestamps
    UPDATE deliveries
    SET 
        status = p_status,
        started_at = CASE WHEN p_status = 'PICKED_UP' AND started_at IS NULL THEN NOW() ELSE started_at END,
        arrived_at = CASE WHEN p_status = 'ARRIVED' AND arrived_at IS NULL THEN NOW() ELSE arrived_at END,
        completed_at = CASE WHEN p_status = 'DELIVERED' AND completed_at IS NULL THEN NOW() ELSE completed_at END,
        updated_at = NOW()
    WHERE id = p_delivery_id;
    
    -- Log the event
    INSERT INTO delivery_events (delivery_id, type, meta)
    VALUES (p_delivery_id, 'status_change', 
            jsonb_build_object('old_status', v_old_status, 'new_status', p_status) || p_meta);
    
    -- Update order status if delivery is completed
    IF p_status = 'DELIVERED' THEN
        UPDATE orders
        SET status = 'DELIVERED', updated_at = NOW()
        WHERE id = v_delivery.order_id;
        
        -- Trigger reward points accrual
        PERFORM fn_rewards_accrue(v_delivery.order_id);
    END IF;
    
    RETURN json_build_object(
        'success', true,
        'old_status', v_old_status,
        'new_status', p_status,
        'tracking_code', v_delivery.tracking_code
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
