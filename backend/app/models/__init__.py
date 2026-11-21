# Import every model here so SQLAlchemy knows about all tables before create_all() runs.
from app.models.appliance import Appliance
from app.models.scenario import Scenario
from app.models.tariff import Tariff, TariffSlot

__all__ = ["Appliance", "Scenario", "Tariff", "TariffSlot"]