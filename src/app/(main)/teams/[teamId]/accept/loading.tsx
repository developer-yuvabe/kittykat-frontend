import { Skeleton } from "@/components/ui/skeleton";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function AcceptTeamInvitationLoading() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            <Skeleton className="h-6 w-6" />
          </div>
          <CardTitle>
            <Skeleton className="h-6 w-32 mx-auto" />
          </CardTitle>
          <CardDescription>
            <Skeleton className="h-4 w-48 mx-auto" />
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border bg-muted/50 p-4">
            <div className="flex items-center gap-3">
              <Skeleton className="h-10 w-10 rounded-full" />
              <div>
                <Skeleton className="h-4 w-24" />
              </div>
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex gap-3">
          <Skeleton className="h-10 flex-1" />
          <Skeleton className="h-10 flex-1" />
        </CardFooter>
      </Card>
    </div>
  );
}
