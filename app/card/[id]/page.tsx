import { createClient } from '@/lib/supabase/server'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'

export default async function CardPage({ params }: { params: { id: string } }) {
  const supabase = createClient()

  const { data: profile } = await supabase
    .from('profiles')
    .select('name,email,phone,linkedin,business_title,avatar_url')
    .eq('id', params.id)
    .single()

  if (!profile) {
    return <div className="p-6">Card not found</div>
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted p-4">
      <Card className="w-full max-w-sm p-6 text-center space-y-4">
        <div className="flex justify-center">
          <Avatar className="w-24 h-24 border-4 border-background shadow-lg">
            <AvatarImage src={profile.avatar_url || undefined} />
            <AvatarFallback className="text-2xl">
              {profile.name?.[0] || 'U'}
            </AvatarFallback>
          </Avatar>
        </div>

        <div>
          <h1 className="text-2xl font-bold">{profile.name}</h1>
          <p className="text-muted-foreground">
            {profile.business_title}
          </p>
        </div>

        <Button asChild className="w-full">
          <a href={`mailto:${profile.email}`}>Email</a>
        </Button>

        <Button asChild variant="outline" className="w-full">
          <a href={`tel:${profile.phone}`}>Call</a>
        </Button>

        <Button asChild variant="outline" className="w-full">
          <a href={profile.linkedin} target="_blank">
            LinkedIn
          </a>
        </Button>
      </Card>
    </div>
  )
}
