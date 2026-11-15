from sqlalchemy import select
from sqlalchemy.orm import Session
from .models import Machine, Tool

MACHINES = [
    ("CNC-01", "VMC Alpha", "Makino", "Fanuc 31i", "Idle"),
    ("CNC-02", "MillTurn 500", "DMG Mori", "Siemens 840D", "Offline"),
    ("CNC-03", "VF-4SS", "Haas", "Haas NGC", "Idle"),
    ("CNC-04", "Nexturn 320", "Doosan", "Fanuc 0i-F Plus", "Offline"),
    ("CNC-05", "DMC 635", "DMG Mori", "Siemens 840D", "Maintenance"),
]
TOOLS = [
    ("TL-001", "Ø12 Roughing End Mill", "End mill", "Carbide", "AlTiN", 12, 4, 180, .30, 68),
    ("TL-002", "Ø8 Finishing End Mill", "End mill", "Carbide", "TiSiN", 8, 4, 120, .25, 46),
    ("TL-003", "CNMG 120408 Insert", "Turning insert", "Carbide", "CVD", 12, 1, 95, .30, 18),
    ("TL-004", "Ø10 Through-Coolant Drill", "Drill", "Carbide", "AlCrN", 10, 2, 145, .25, 74),
    ("TL-005", "DNMG 150608 Insert", "Turning insert", "Carbide", "CVD", 15, 1, 110, .30, 21),
    ("TL-006", "Ø6 Ball Nose", "End mill", "Carbide", "TiAlN", 6, 2, 90, .20, 39),
    ("TL-007", "Ø16 Indexable Drill", "Drill", "Carbide", "PVD", 16, 2, 130, .35, 88),
    ("TL-008", "VCGT 110304 Insert", "Turning insert", "Carbide", "Uncoated", 11, 1, 80, .25, 14),
    ("TL-009", "Ø20 5F End Mill", "End mill", "Carbide", "AlTiN", 20, 5, 220, .35, 112),
    ("TL-010", "Ø5 Micro Drill", "Drill", "Carbide", "TiN", 5, 2, 75, .15, 31),
]


def seed(session: Session) -> None:
    if session.scalar(select(Machine.id).limit(1)):
        return
    session.add_all([Machine(id=i, name=n, make=ma, controller=c, status=s) for i, n, ma, c, s in MACHINES])
    session.add_all([Tool(id=i, name=n, type=t, material=m, coating=co, diameter_mm=d, flute_count=f, life_limit_min=l, vb_limit_mm=vb, cost=cost) for i, n, t, m, co, d, f, l, vb, cost in TOOLS])
    session.commit()
