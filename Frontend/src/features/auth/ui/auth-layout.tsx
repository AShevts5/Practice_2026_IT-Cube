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
    <main className="flex grow flex-col items-center px-3 pb-10 pt-10 sm:px-4 sm:pt-16 md:pt-24">
      <Card className="w-full max-w-[400px] min-w-0">
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
