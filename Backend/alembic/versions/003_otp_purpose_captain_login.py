from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "003"
down_revision: Union[str, None] = "002"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.alter_column(
        "otp_challenges",
        "purpose",
        existing_type=sa.String(length=11),
        type_=sa.String(length=32),
        existing_nullable=False,
    )


def downgrade() -> None:
    op.alter_column(
        "otp_challenges",
        "purpose",
        existing_type=sa.String(length=32),
        type_=sa.String(length=11),
        existing_nullable=False,
    )
