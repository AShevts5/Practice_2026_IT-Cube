from typing import Sequence, Union

from alembic import op

revision: str = "007"
down_revision: Union[str, None] = "006"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.execute(
        "ALTER TABLE invite_codes ADD COLUMN IF NOT EXISTS code VARCHAR(32)"
    )


def downgrade() -> None:
    op.execute("ALTER TABLE invite_codes DROP COLUMN IF EXISTS code")
