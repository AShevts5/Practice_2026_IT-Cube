import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter,
} from "@/shared/ui/kit/card";
import React from "react";

export function AuthLayout({
  form,
  title,
  footerText,
}: {
  form: React.ReactNode;
  title: React.ReactNode;
  description?: React.ReactNode;
  footerText?: React.ReactNode;
}) {
  return (
    <main className="grow flex flex-col pt-[200px] items-center">
      <Card className="w-full max-w-[400px]">
        <CardHeader>
          <CardTitle>{title}</CardTitle>
        </CardHeader>
        <CardContent>{form}</CardContent>
        {footerText ? (
          <CardFooter>
            <div className="text-sm text-muted-foreground [&_a]:underline [&_a]:text-primary">
              {footerText}
            </div>
          </CardFooter>
        ) : null}
      </Card>
    </main>
  );
}
