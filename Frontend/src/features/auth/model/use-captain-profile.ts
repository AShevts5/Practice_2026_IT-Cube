import { rqClient } from "@/shared/api/instance";
import { useSession } from "@/shared/model/session";
import { isCaptain } from "@/shared/model/viewer-role";

export function useCaptainProfile() {
  const { viewerRole } = useSession();

  return rqClient.useQuery("get", "/captain/me", undefined, {
    enabled: isCaptain(viewerRole),
  });
}
