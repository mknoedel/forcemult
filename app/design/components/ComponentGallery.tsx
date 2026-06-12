import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Select } from '@/components/ui/select';

/**
 * Live gallery of the shadcn/ui primitives that ship with this template. These
 * are the real, interactive components — the same ones you compose in your
 * pages — shown in their common variants and states.
 */
export function ComponentGallery() {
  return (
    <section className="space-y-6">
      <div className="space-y-2">
        <h2 className="font-display text-2xl font-bold">
          Your building blocks
        </h2>
        <p className="max-w-3xl text-muted-foreground">
          These are the real shadcn/ui components already installed in{' '}
          <code className="rounded bg-muted px-1 py-0.5 text-foreground">
            components/ui/
          </code>
          . Compose <em>these</em> instead of hand-building your own —
          they&apos;re accessible and on-brand out of the box.
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <GalleryCard
          title="Buttons"
          description="Actions, in order of emphasis"
        >
          <div className="flex flex-wrap gap-2">
            <Button>Default</Button>
            <Button variant="secondary">Secondary</Button>
            <Button variant="outline">Outline</Button>
            <Button variant="ghost">Ghost</Button>
            <Button variant="destructive">Destructive</Button>
            <Button variant="link">Link</Button>
          </div>
        </GalleryCard>

        <GalleryCard title="Badges" description="Small status labels">
          <div className="flex flex-wrap gap-2">
            <Badge>Default</Badge>
            <Badge variant="secondary">Secondary</Badge>
            <Badge variant="destructive">Destructive</Badge>
            <Badge variant="outline">Outline</Badge>
          </div>
        </GalleryCard>

        <GalleryCard title="Form fields" description="Inputs, labels & selects">
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="demo-email">Email</Label>
              <Input
                id="demo-email"
                type="email"
                placeholder="you@example.com"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="demo-role">Role</Label>
              <Select id="demo-role" defaultValue="student">
                <option value="student">Student</option>
                <option value="mentor">Mentor</option>
              </Select>
            </div>
            <div className="flex items-center gap-2">
              <Checkbox id="demo-agree" defaultChecked />
              <Label htmlFor="demo-agree">I understand tokens</Label>
            </div>
          </div>
        </GalleryCard>

        <GalleryCard
          title="Card"
          description="A surface that groups related content"
        >
          <Card>
            <CardHeader>
              <CardTitle>Project</CardTitle>
              <CardDescription>A grouped surface</CardDescription>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              Cards are the most common way to lay out content on a page.
            </CardContent>
            <CardFooter>
              <Button size="sm">Open</Button>
            </CardFooter>
          </Card>
        </GalleryCard>
      </div>
    </section>
  );
}

function GalleryCard({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-3 rounded-2xl border-2 border-foreground bg-card p-5 shadow-hard">
      <div>
        <h3 className="font-semibold">{title}</h3>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
      {children}
    </div>
  );
}
