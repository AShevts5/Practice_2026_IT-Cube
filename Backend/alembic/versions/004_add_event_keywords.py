from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "004"
down_revision: Union[str, None] = "003"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "events",
        sa.Column("keywords", sa.Text(), server_default="", nullable=False),
    )
    op.add_column(
        "events",
        sa.Column("brand", sa.String(length=64), server_default="", nullable=False),
    )
    op.add_column("events", sa.Column("starts_at", sa.DateTime(timezone=True), nullable=True))
    op.add_column("events", sa.Column("ends_at", sa.DateTime(timezone=True), nullable=True))


def downgrade() -> None:
    op.drop_column("events", "ends_at")
    op.drop_column("events", "starts_at")
    op.drop_column("events", "brand")
    op.drop_column("events", "keywords")
