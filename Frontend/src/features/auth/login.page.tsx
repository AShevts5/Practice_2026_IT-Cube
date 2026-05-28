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
            Демо: admin / captain @gmail.com, пароль 123456, OTP 123456
          </p>
          Нет аккаунта? <Link to={ROUTES.REGISTER}>Зарегистрироваться</Link>
        </>
      }
    />
  );
}

export const Component = LoginPage;
