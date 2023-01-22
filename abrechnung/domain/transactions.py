from dataclasses import dataclass, field
from datetime import datetime, date
from enum import Enum
from typing import Optional


class TransactionType(Enum):
    mimo = "mimo"
    purchase = "purchase"
    transfer = "transfer"


TransactionShares = dict[int, float]


@dataclass
class TransactionPosition:
    id: int

    name: str
    price: float
    communist_shares: float
    # usages map account IDs to portions of the item share pool
    usages: TransactionShares

    deleted: bool = False


@dataclass
class TransactionDetails:
    name: str
    description: Optional[str]
    value: float
    currency_symbol: str
    currency_conversion_rate: float
    billed_at: date
    repeat: str
    tags: list[str]
    deleted: bool

    # creditor and debitor shares map account IDs to portions of the communist share pool
    creditor_shares: TransactionShares
    debitor_shares: TransactionShares


@dataclass
class FileAttachment:
    id: int
    filename: str
    blob_id: Optional[int]
    mime_type: Optional[str]
    host_url: str
    deleted: bool


@dataclass
class Transaction:
    id: int
    group_id: int
    type: str
    is_wip: bool
    last_changed: datetime
    committed_details: Optional[TransactionDetails]
    pending_details: Optional[TransactionDetails]

    committed_positions: Optional[list[TransactionPosition]] = field(default=None)
    pending_positions: Optional[list[TransactionPosition]] = field(default=None)

    committed_files: Optional[list[FileAttachment]] = field(default=None)
    pending_files: Optional[list[FileAttachment]] = field(default=None)
