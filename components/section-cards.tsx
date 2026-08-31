import {
  IconCertificate,
  IconCode,
  IconCloud,
  IconTrendingUp,
} from "@tabler/icons-react";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardAction,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export function SectionCards() {
  return (
    <div className="*:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card grid grid-cols-1 gap-4 px-4 *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:shadow-xs lg:px-6 @xl/main:grid-cols-2 @5xl/main:grid-cols-4">
      {/* Projects Card */}
      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Featured Projects</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            5+
          </CardTitle>
          <CardAction>
            <Badge variant="outline" className="bg-green-100 dark:bg-green-900">
              <IconTrendingUp className="size-4" />
              Recent: Voting API
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            PROJECTS COMPLETED <IconCode className="size-4" />
          </div>
          <div className="text-muted-foreground">
            Including 3-server architecture implementation
          </div>
        </CardFooter>
      </Card>

      {/* Certifications Card */}
      <Card className="@container/card">
        <CardHeader>
          <CardDescription>CERTIFICATIONS</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            3+
          </CardTitle>
          <CardAction>
            <Badge variant="outline" className="bg-blue-100 dark:bg-blue-900">
              <IconCertificate className="size-4" />
              In Progress: 2
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            AWS Cloud Practitioner <IconCloud className="size-4" />
          </div>
          <div className="text-muted-foreground">
            Solutions Architect & Data Science coming soon
          </div>
        </CardFooter>
      </Card>

      {/* Skills Card */}
      <Card className="@container/card">
        <CardHeader>
          <CardDescription>TECH STACK</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            10+
          </CardTitle>
          <CardAction>
            <Badge variant="outline">
              <IconTrendingUp className="size-4" />
              Growing
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            TECHNOLOGIES MASTERED <IconTrendingUp className="size-4" />
          </div>
          <div className="text-muted-foreground">
            AWS, Python, React, Node.js, and more
          </div>
        </CardFooter>
      </Card>

      {/* Experience Card */}
      <Card className="@container/card">
        <CardHeader>
          <CardDescription>YEARS OF EXPERIENCE</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            2+
          </CardTitle>
          <CardAction>
            <Badge variant="outline">
              <IconTrendingUp className="size-4" />
              +4.5%
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            CONTINUOUS LEARNING <IconTrendingUp className="size-4" />
          </div>
          <div className="text-muted-foreground">
            ProDev course & ongoing certifications
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}
