CREATE TYPE territory_status AS ENUM ('LOCKED', 'LIVE', 'SUSPENDED');

CREATE TABLE IF NOT EXISTS expansion_territories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pincode VARCHAR(10) UNIQUE NOT NULL,
    town TEXT NOT NULL,
    district TEXT NOT NULL,
    state TEXT NOT NULL,
    
    -- Geographic & Coverage
    area_sq_km DECIMAL DEFAULT 1.0,
    status territory_status DEFAULT 'LOCKED',
    
    -- Metrics
    local_cuisine_density DECIMAL DEFAULT 0.0, -- Score or ratio (0.0 to 1.0+)
    demand_score DECIMAL DEFAULT 0.0, -- Base demand based on app opens, etc.
    restaurant_supply INT DEFAULT 0,
    active_rider_count INT DEFAULT 0,
    
    -- Economic Thresholds for autonomous launch
    min_restaurant_density DECIMAL DEFAULT 5.0, -- minimum restaurants per sq km
    min_rider_to_restaurant_ratio DECIMAL DEFAULT 1.5, -- riders per restaurant
    min_demand_score DECIMAL DEFAULT 50.0,
    
    last_evaluated_at TIMESTAMPTZ,
    launched_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION update_expansion_territories_modtime()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_expansion_territories_updated_at
BEFORE UPDATE ON expansion_territories
FOR EACH ROW EXECUTE FUNCTION update_expansion_territories_modtime();

-- =======================================================================
-- INDIA EXPANSION ENGINE - LOGIC ENGINE
-- =======================================================================
-- Evaluates territories and autonomously unlocks them if economic thresholds
-- (active riders vs restaurant density, demand, etc.) justify a launch.
-- =======================================================================
CREATE OR REPLACE FUNCTION india_expansion_engine_evaluate()
RETURNS void AS $$
DECLARE
    territory RECORD;
    current_restaurant_density DECIMAL;
    current_rider_ratio DECIMAL;
BEGIN
    FOR territory IN 
        SELECT * FROM expansion_territories WHERE status = 'LOCKED'
    LOOP
        -- Compute geographic metrics
        IF territory.area_sq_km > 0 THEN
            current_restaurant_density := territory.restaurant_supply / territory.area_sq_km;
        ELSE
            current_restaurant_density := 0;
        END IF;
        
        -- Compute economic ratio (riders vs supply)
        IF territory.restaurant_supply > 0 THEN
            current_rider_ratio := territory.active_rider_count::DECIMAL / territory.restaurant_supply;
        ELSE
            current_rider_ratio := 0;
        END IF;

        -- Check economic thresholds for autonomous launch
        IF current_restaurant_density >= territory.min_restaurant_density AND
           current_rider_ratio >= territory.min_rider_to_restaurant_ratio AND
           territory.demand_score >= territory.min_demand_score
        THEN
            -- Autonomous unlock / launch
            UPDATE expansion_territories
            SET status = 'LIVE',
                launched_at = NOW(),
                last_evaluated_at = NOW()
            WHERE id = territory.id;
            
            RAISE NOTICE 'Territory % (Pincode: %) auto-launched by IndiaExpansionEngine', territory.town, territory.pincode;
        ELSE
            -- Thresholds not met, keep territory physically locked
            UPDATE expansion_territories
            SET last_evaluated_at = NOW()
            WHERE id = territory.id;
        END IF;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Expose to API via RPC if we need to trigger it from Edge Functions/Cron
CREATE OR REPLACE FUNCTION rpc_run_india_expansion_engine()
RETURNS void AS $$
BEGIN
    PERFORM india_expansion_engine_evaluate();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
