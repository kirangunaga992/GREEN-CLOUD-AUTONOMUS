"""
Tests for AWS Cloud Integration Module
Tests: pricing, grid factors, ARN validation
"""
import pytest
import sys
import os

sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

from app.routes.cloud import (
    INSTANCE_PRICING,
    GRID_CARBON,
    get_price,
    get_grid_factor,
    IDLE_WATTS,
    MAX_WATTS
)


class TestPricing:
    """Test AWS pricing table"""
    
    def test_get_price_known_instance(self):
        """Known instance type should return correct price"""
        assert get_price("t3.micro") == 0.0104
        assert get_price("t3.large") == 0.0832
        assert get_price("m5.large") == 0.096
    
    def test_get_price_unknown_instance(self):
        """Unknown instance should return default price"""
        assert get_price("unknown-type") == 0.05
    
    def test_pricing_table_has_common_types(self):
        """Pricing table should include common instance types"""
        common = ["t2.micro", "t3.micro", "t3.large", "m5.large", "c5.large"]
        for instance in common:
            assert instance in INSTANCE_PRICING
    
    def test_prices_are_positive(self):
        """All prices should be positive numbers"""
        for instance, price in INSTANCE_PRICING.items():
            assert price > 0, f"{instance} has non-positive price"
    
    def test_prices_are_reasonable(self):
        """Prices should be within reasonable range"""
        for instance, price in INSTANCE_PRICING.items():
            assert price < 10, f"{instance} price too high: ${price}"


class TestCarbonFactors:
    """Test grid carbon intensity factors"""
    
    def test_get_grid_factor_known_region(self):
        """Known region should return correct factor"""
        assert get_grid_factor("us-east-1") == 0.379
        assert get_grid_factor("us-west-2") == 0.082  # Oregon is greenest
        assert get_grid_factor("ap-south-1") == 0.708  # India is dirtiest
    
    def test_get_grid_factor_unknown_region(self):
        """Unknown region should return default"""
        assert get_grid_factor("moon-1") == 0.5
    
    def test_oregon_is_greenest(self):
        """Oregon should have lowest carbon factor"""
        oregon = GRID_CARBON["us-west-2"]
        for region, factor in GRID_CARBON.items():
            if region != "eu-north-1":  # Stockholm is even greener
                assert oregon <= factor + 0.001, f"{region} greener than Oregon"
    
    def test_all_factors_positive(self):
        """All carbon factors should be positive"""
        for region, factor in GRID_CARBON.items():
            assert factor > 0, f"{region} has non-positive factor"


class TestPowerCalculation:
    """Test energy consumption calculations"""
    
    def test_idle_watts_constant(self):
        """Idle watts should be defined"""
        assert IDLE_WATTS == 35
    
    def test_max_watts_greater_than_idle(self):
        """Max watts should be greater than idle"""
        assert MAX_WATTS > IDLE_WATTS
    
    def test_power_at_50_percent_cpu(self):
        """Power at 50% CPU should be halfway between idle and max"""
        # Formula: idle + (max-idle) * cpu%
        cpu = 0.5
        expected_power = IDLE_WATTS + (MAX_WATTS - IDLE_WATTS) * cpu
        assert expected_power == 62.5  # 35 + 55*0.5


class TestCostCarbon:
    """Test integrated cost and carbon calculations"""
    
    def test_t3_micro_monthly_cost(self):
        """t3.micro running 24/7 should cost ~$7.49/month"""
        hourly = get_price("t3.micro")
        monthly = hourly * 24 * 30
        assert 7.0 < monthly < 8.0
    
    def test_carbon_calculation(self):
        """Should calculate carbon correctly"""
        # 1 kWh in us-east-1 = 0.379 kg CO2
        kwh = 1.0
        carbon = kwh * get_grid_factor("us-east-1")
        assert carbon == 0.379
    
    def test_green_region_saves_carbon(self):
        """Same workload in green region should have less carbon"""
        kwh = 1.0
        east = kwh * get_grid_factor("us-east-1")  # 0.379
        west = kwh * get_grid_factor("us-west-2")  # 0.082
        assert west < east
        savings_percent = (east - west) / east * 100
        assert savings_percent > 70  # Should save 70%+


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
