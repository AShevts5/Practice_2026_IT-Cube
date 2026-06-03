from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "006"
down_revision: Union[str, None] = "005"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "events",
        sa.Column("location", sa.String(length=512), server_default="", nullable=False),
    )
    op.add_column(
        "events",
        sa.Column(
            "format",
            sa.Enum("online", "offline", "hybrid", name="event_format", native_enum=False),
            nullable=True,
        ),
    )
    op.add_column("events", sa.Column("min_age", sa.Integer(), nullable=True))


def downgrade() -> None:
    op.drop_column("events", "min_age")
    op.drop_column("events", "format")
    op.drop_column("events", "location")
