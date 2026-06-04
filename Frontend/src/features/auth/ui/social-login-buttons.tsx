import { Button } from "@/shared/ui/kit/button";
import type { OAuthFlow } from "../model/oauth";
import { getOAuthAuthorizeUrl, type OAuthProviderId } from "../model/oauth";

function GitHubIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
    </svg>
  );
}

function YandexIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
      <rect width="24" height="24" rx="6" fill="#FC3F1D" />
      <path
        fill="#FFF"
        d="M14.1 6.5h-1.2c-1.95 0-3 1-3 2.55 0 1.65.78 2.55 2.4 3.6l1.35.9-3.9 6.1H8.4l3.4-5.3C9.2 12.6 8 11.2 8 9.2 8 6.2 10.1 4.3 13.5 4.3H16v15.4h-2.9V6.5z"
      />
    </svg>
  );
}

function VkIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M15.684 0H8.316C1.592 0 0 1.592 0 8.316v7.368C0 22.408 1.592 24 8.316 24h7.368C22.408 24 24 22.408 24 15.684V8.316C24 1.592 22.408 0 15.684 0zm3.692 17.123h-1.744c-.66 0-.864-.525-2.05-1.727-1.033-1-1.49-1.135-1.744-1.135-.356 0-.458.102-.458.593v1.575c0 .424-.135.678-1.253.678-1.846 0-3.896-1.118-5.335-3.202C4.624 10.857 4.03 8.57 4.03 8.096c0-.254.102-.491.593-.491h1.744c.44 0 .61.203.78.677.863 2.49 2.303 4.675 2.896 4.675.22 0 .322-.102.322-.66V9.721c-.068-1.186-.695-1.287-.695-1.71 0-.203.17-.407.44-.407h2.744c.373 0 .508.203.508.643v3.473c0 .372.17.508.271.508.22 0 .407-.136.813-.542 1.254-1.406 2.151-3.574 2.151-3.574.119-.254.322-.491.763-.491h1.744c.525 0 .644.271.525.643-.22 1.017-2.354 4.031-2.354 4.031-.186.305-.254.44 0 .78.186.254.796.779 1.203 1.253.745.847 1.32 1.558 1.473 2.049.17.49-.085.744-.576.744z" />
    </svg>
  );
}

const providers = [
  { id: "github" as const, label: "GitHub", Icon: GitHubIcon, iconClassName: "size-4 shrink-0" },
  { id: "yandex" as const, label: "Яндекс", Icon: YandexIcon, iconClassName: "size-5 shrink-0" },
  { id: "vk" as const, label: "ВКонтакте", Icon: VkIcon, iconClassName: "size-4 shrink-0" },
];

type SocialLoginButtonsProps = {
  flow: OAuthFlow;
};

export function SocialLoginButtons({ flow }: SocialLoginButtonsProps) {
  const startOAuth = (provider: OAuthProviderId) => {
    window.location.href = getOAuthAuthorizeUrl(provider, flow);
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        {providers.map(({ id, label, Icon, iconClassName }) => (
          <Button
            key={id}
            type="button"
            variant="outline"
            className="w-full normal-case tracking-normal"
            onClick={() => startOAuth(id)}
          >
            <Icon className={iconClassName} />
            {label}
          </Button>
        ))}
      </div>

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="border-border w-full border-t" />
        </div>
        <div className="relative flex justify-center text-xs">
          <span className="bg-card text-muted-foreground px-2">или</span>
        </div>
      </div>
    </div>
  );
}
