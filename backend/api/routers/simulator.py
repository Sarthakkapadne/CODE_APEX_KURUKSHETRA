"""
LexPort — Regulatory Change Simulator Router
Allows live toggling of simulated regulatory changes mid-demo and pushes broadcasts.
"""
from __future__ import annotations
from typing import Dict, Any, List
from fastapi import APIRouter, Depends
from pydantic import BaseModel

from backend.api.routers.compliance import get_simulator, get_rule_engine
from backend.modules.simulator.regulatory_simulator import RegulatorySimulator
from backend.modules.rule_engine.deterministic_engine import DeterministicRuleEngine

router = APIRouter()


class ToggleSimulationRequest(BaseModel):
    simulation_id: str  # sim_us_epa_crackdown, sim_eu_peroxide_crackdown, sim_ca_rockers_ban
    is_active: bool


@router.get("/status", summary="Get current status of all regulatory simulations")
async def get_simulation_status(sim: RegulatorySimulator = Depends(get_simulator)):
    return sim.get_simulation_status()


@router.post("/toggle", summary="Toggle a simulated regulatory change and dispatch broadcast")
async def toggle_simulation(
    req: ToggleSimulationRequest,
    sim: RegulatorySimulator = Depends(get_simulator),
    engine: DeterministicRuleEngine = Depends(get_rule_engine),
):
    # Update simulator state
    alert = sim.toggle_simulation(req.simulation_id, req.is_active)
    # Update rule engine overrides
    engine.set_simulation_override(req.simulation_id, req.is_active)

    return {
        "status": "success",
        "simulation_id": req.simulation_id,
        "is_active": req.is_active,
        "alert": alert,
    }


@router.get("/broadcasts", summary="Get list of recent regulatory broadcasts")
async def get_broadcasts(sim: RegulatorySimulator = Depends(get_simulator)):
    return sim.get_broadcasts()
