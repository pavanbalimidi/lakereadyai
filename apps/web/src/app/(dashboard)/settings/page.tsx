import { auth } from "@/auth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/page-header";

export default async function SettingsPage() {
  const session = await auth();
  return (
    <div>
      <PageHeader title="Settings" description="Workspace and account preferences." />
      <div className="grid gap-6 p-8 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Account</CardTitle>
            <CardDescription>Signed in as</CardDescription>
          </CardHeader>
          <CardContent className="space-y-1 text-sm">
            <div>
              <span className="text-muted-foreground">Email: </span>
              {session?.user?.email}
            </div>
            <div>
              <span className="text-muted-foreground">Workspace: </span>
              {session?.user?.orgId ?? "—"}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>SSO</CardTitle>
            <CardDescription>
              Microsoft Entra and Okta are pre-wired in the auth layer. Provide
              client IDs/secrets via env to enable.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Configure via <code>AUTH_AZURE_AD_*</code> or <code>AUTH_OKTA_*</code>.
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
