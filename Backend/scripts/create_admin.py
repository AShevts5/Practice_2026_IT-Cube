import argparse
import asyncio
import getpass
import sys

from sqlalchemy import select

from app.core.security import hash_password
from app.db.models.admin_user import AdminUser
from app.db.session import async_session_factory


async def create_or_update_admin(
    email: str,
    password: str,
    *,
    full_name: str,
    update: bool,
) -> None:
    normalized = email.strip().lower()
    if not normalized or "@" not in normalized:
        raise ValueError("Укажите корректный email")

    async with async_session_factory() as session:
        result = await session.execute(
            select(AdminUser).where(AdminUser.email == normalized)
        )
        admin = result.scalar_one_or_none()

        if admin is None:
            session.add(
                AdminUser(
                    email=normalized,
                    password_hash=hash_password(password),
                    full_name=full_name,
                    is_active=True,
                )
            )
            await session.commit()
            print(f"Администратор создан: {normalized}")
            return

        if not update:
            print(
                f"Администратор {normalized} уже есть. "
                "Добавьте --update, чтобы сменить пароль.",
                file=sys.stderr,
            )
            sys.exit(1)

        admin.password_hash = hash_password(password)
        admin.full_name = full_name or admin.full_name
        admin.is_active = True
        await session.commit()
        print(f"Администратор обновлён: {normalized}")


def main() -> None:
    parser = argparse.ArgumentParser(description="Создать или обновить администратора")
    parser.add_argument("email", help="Email администратора (для входа и OTP)")
    parser.add_argument(
        "--password",
        "-p",
        help="Пароль (если не указан — запрос ввода без эха)",
    )
    parser.add_argument(
        "--name",
        "-n",
        default="Администратор",
        help="Отображаемое имя",
    )
    parser.add_argument(
        "--update",
        action="store_true",
        help="Обновить пароль, если администратор с таким email уже есть",
    )
    args = parser.parse_args()

    password = args.password
    if not password:
        password = getpass.getpass("Пароль: ")
        confirm = getpass.getpass("Повтор пароля: ")
        if password != confirm:
            print("Пароли не совпадают", file=sys.stderr)
            sys.exit(1)

    if len(password) < 6:
        print("Пароль должен быть не короче 6 символов", file=sys.stderr)
        sys.exit(1)

    try:
        asyncio.run(
            create_or_update_admin(
                args.email,
                password,
                full_name=args.name,
                update=args.update,
            )
        )
    except Exception as exc:
        print(f"Ошибка: {exc}", file=sys.stderr)
        sys.exit(1)


if __name__ == "__main__":
    main()
