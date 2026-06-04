import { ROUTES } from "@/shared/model/routes";
import { Link } from "react-router-dom";
import { AuthLayout } from "./ui/auth-layout";
import { LoginForm } from "./ui/login-form";

function LoginPage() {
  return (
    <AuthLayout
      title="Вход в систему"
      form={<LoginForm />}
      footerText={
        <>
          <p className="text-muted-foreground mb-2 text-xs">
            Капитан — вход через GitHub, Яндекс или ВК, либо email и пароль с кодом на
            почту. Администратор — email и пароль, затем код. Команда — логин team_… и
            пароль без кода.
          </p>
          <Link to={ROUTES.HOME}>К мероприятиям</Link>
          {" · "}
          <Link to={ROUTES.REGISTER}>Как зарегистрировать команду</Link>
        </>
      }
    />
  );
}

export const Component = LoginPage;
