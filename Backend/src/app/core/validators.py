import phonenumbers
from pydantic import GetCoreSchemaHandler
from pydantic_core import CoreSchema, core_schema

class PhoneNumber(str):

    @classmethod
    def __get_pydantic_core_schema__(
        cls,
        _source: type,
        _handler: GetCoreSchemaHandler,
    ) -> CoreSchema:
        return core_schema.no_info_plain_validator_function(cls.validate)

    @classmethod
    def validate(cls, value: str) -> str:
        try:
            parsed = phonenumbers.parse(value, "RU")
            if not phonenumbers.is_valid_number(parsed):
                raise ValueError("invalid phone")
            return phonenumbers.format_number(parsed, phonenumbers.PhoneNumberFormat.E164)
        except phonenumbers.NumberParseException as exc:
            raise ValueError("invalid phone") from exc
