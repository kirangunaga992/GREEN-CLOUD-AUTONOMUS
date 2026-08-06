"""Tests for AWS Cloud Integration"""
import pytest
import sys
import os

sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

from app.routes.cloud import (
    get_price,
    get_grid_factor,
    INSTANCE_PRICING,
    GRID_CARBON
)


def test_get_price_known():
    """Known instance returns correct price"""
    assert get_price("t3.micro") == 0.0104
    assert get_price("t3.large") == 0.0832


def test_get_price_unknown():
    """Unknown instance returns default"""
    assert get_price("fake-instance") == 0.05


def test_pricing_has_common_types():
    """Pricing table has common instances"""
    assert "t3.micro" in INSTANCE_PRICING
    assert "m5.large" in INSTANCE_PRICING


def test_prices_are_positive():
    """All prices are positive"""
    for instance, price in INSTANCE_PRICING.items():
        assert price > 0


def test_grid_factor_known():
    """Known region returns correct factor"""
    assert get_grid_factor("us-east-1") == 0.379
    assert get_grid_factor("us-west-2") == 0.082


def test_oregon_is_green():
    """Oregon has lower carbon than Virginia"""
    oregon = GRID_CARBON["us-west-2"]
    virginia = GRID_CARBON["us-east-1"]
    assert oregon < virginia


def test_monthly_cost_calculation():
    """t3.micro costs ~$7.49/month when running 24/7"""
    hourly = get_price("t3.micro")
    monthly = hourly * 24 * 30
    assert 7.0 < monthly < 8.0
