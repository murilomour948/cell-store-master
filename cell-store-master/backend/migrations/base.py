from dataclasses import dataclass
from typing import Callable


@dataclass(frozen=True)
class Migration:
    version: str
    name: str
    apply: Callable[[object], None]
