import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { authClient } from '@/lib/auth-client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { User, Mail, Shield, Calendar, LogOut, ArrowLeft, CheckCircle2, XCircle, Image as ImageIcon } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import { ModeToggle } from '@/components/mode-toggle'
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar'
import { AppSidebar } from '@/components/app-sidebar'

export const Route = createFileRoute('/settings')({
  component: RouteComponent,
})

function RouteComponent() {
  const { data: session, isPending } = authClient.useSession()
  const navigate = useNavigate()

  if (isPending) {
    return (
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset className="bg-background overflow-hidden">
          <div className="min-h-screen bg-background relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/5 pointer-events-none"></div>
            <main className="container mx-auto px-4 py-8 relative z-10">
              <div className="max-w-4xl mx-auto space-y-8">
                <Skeleton className="h-12 w-64" />
                <Skeleton className="h-96 w-full" />
              </div>
            </main>
          </div>
        </SidebarInset>
      </SidebarProvider>
    )
  }

  if (!session) {
    return (
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset className="bg-background overflow-hidden">
          <div className="min-h-screen bg-background flex items-center justify-center">
            <Card className="max-w-md w-full">
              <CardHeader>
                <CardTitle>Authentication Required</CardTitle>
                <CardDescription>Please sign in to view your settings</CardDescription>
              </CardHeader>
              <CardContent>
                <Button asChild className="w-full">
                  <Link to="/login">Sign In</Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </SidebarInset>
      </SidebarProvider>
    )
  }

  const user = session.user
  const initials = user.name
    ? user.name
        .split(' ')
        .map(n => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : 'U'

  const accountCreatedDate = (user as any).createdAt
    ? new Date((user as any).createdAt).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : null

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset className="bg-background overflow-hidden">
        <div className="min-h-screen bg-background relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/5 pointer-events-none"></div>
          <div className="absolute inset-0 -z-10 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:14px_24px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]"></div>
          
          <main className="container mx-auto px-4 py-8 relative z-10">
        <div className="max-w-4xl mx-auto space-y-8 animate-fade-in">
          <div className="flex items-center justify-between gap-4 mb-8 animate-slide-up">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate({ to: '/dashboard' })}
                className="hover:bg-accent transition-all duration-300 hover:scale-105"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div>
                <h1 className="text-4xl font-bold tracking-tight mb-2 bg-gradient-to-br from-foreground via-foreground to-foreground/70 bg-clip-text text-transparent">
                  Settings
                </h1>
                <p className="text-muted-foreground text-lg">Manage your account information and preferences</p>
              </div>
            </div>
            <ModeToggle />
          </div>


          <Card className="relative overflow-hidden group hover:shadow-xl hover:shadow-primary/10 transition-all duration-300 hover:-translate-y-1 animate-slide-up [animation-delay:100ms]">
            <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl group-hover:bg-primary/10 transition-colors duration-300" />
            <CardHeader className="relative">
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
                <div className="relative">
                  <Avatar className="h-24 w-24 ring-4 ring-primary/20 shadow-xl group-hover:ring-primary/40 transition-all duration-300 group-hover:scale-105">
                    {user.image && (
                      <AvatarImage src={user.image} alt={user.name || 'User'} className="object-cover" />
                    )}
                    <AvatarFallback className="bg-primary/20 text-primary font-bold text-2xl">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                  <div className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-background border-4 border-background flex items-center justify-center">
                    {user.image ? (
                      <ImageIcon className="h-4 w-4 text-primary" />
                    ) : (
                      <User className="h-4 w-4 text-primary" />
                    )}
                  </div>
                </div>
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-3 flex-wrap">
                    <h2 className="text-3xl font-bold">{user.name || 'User'}</h2>
                    <Badge
                      variant={user.emailVerified ? 'default' : 'secondary'}
                      className="text-xs px-3 py-1"
                    >
                      {user.emailVerified ? (
                        <>
                          <CheckCircle2 className="h-3 w-3 mr-1" />
                          Verified
                        </>
                      ) : (
                        <>
                          <XCircle className="h-3 w-3 mr-1" />
                          Unverified
                        </>
                      )}
                    </Badge>
                  </div>
                  <p className="text-muted-foreground flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    {user.email || 'No email provided'}
                  </p>
                </div>
              </div>
            </CardHeader>
          </Card>

          <div className="grid gap-6 md:grid-cols-2 animate-slide-up [animation-delay:200ms]">
            <Card className="relative overflow-hidden group hover:shadow-xl hover:shadow-primary/10 transition-all duration-300 hover:-translate-y-1">
              <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl group-hover:bg-primary/10 transition-colors duration-300" />
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/10 text-primary group-hover:bg-primary/20 transition-colors duration-300">
                    <User className="h-5 w-5" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">Account Information</CardTitle>
                    <CardDescription>Your personal details</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <p className="text-xs text-muted-foreground uppercase tracking-wide">Full Name</p>
                  <p className="text-sm font-medium">{user.name || 'Not set'}</p>
                </div>
                <Separator />
                <div className="space-y-2">
                  <p className="text-xs text-muted-foreground uppercase tracking-wide">Email Address</p>
                  <p className="text-sm font-medium break-all">{user.email || 'Not set'}</p>
                </div>
                <Separator />
                <div className="space-y-2">
                  <p className="text-xs text-muted-foreground uppercase tracking-wide">User ID</p>
                  <p className="text-sm font-mono text-muted-foreground break-all">{user.id}</p>
                </div>
              </CardContent>
            </Card>

            <Card className="relative overflow-hidden group hover:shadow-xl hover:shadow-primary/10 transition-all duration-300 hover:-translate-y-1">
              <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl group-hover:bg-primary/10 transition-colors duration-300" />
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/10 text-primary group-hover:bg-primary/20 transition-colors duration-300">
                    <Shield className="h-5 w-5" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">Security Status</CardTitle>
                    <CardDescription>Account verification details</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <p className="text-xs text-muted-foreground uppercase tracking-wide">Email Verification</p>
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium">
                      {user.emailVerified ? 'Verified' : 'Not Verified'}
                    </p>
                    <Badge variant={user.emailVerified ? 'default' : 'secondary'}>
                      {user.emailVerified ? (
                        <CheckCircle2 className="h-3 w-3 mr-1" />
                      ) : (
                        <XCircle className="h-3 w-3 mr-1" />
                      )}
                      {user.emailVerified ? 'Verified' : 'Pending'}
                    </Badge>
                  </div>
                </div>
                <Separator />
                <div className="space-y-2">
                  <p className="text-xs text-muted-foreground uppercase tracking-wide">Account Status</p>
                  <Badge variant="default" className="w-fit">
                    <Shield className="h-3 w-3 mr-1" />
                    Active
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card className="relative overflow-hidden group hover:shadow-xl hover:shadow-primary/10 transition-all duration-300 hover:-translate-y-1 animate-slide-up [animation-delay:300ms]">
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl group-hover:bg-primary/10 transition-colors duration-300" />
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10 text-primary group-hover:bg-primary/20 transition-colors duration-300">
                  <Calendar className="h-5 w-5" />
                </div>
                <div>
                  <CardTitle className="text-lg">Account Details</CardTitle>
                  <CardDescription>Additional account information</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {user.image && (
                <>
                  <div className="space-y-2">
                    <p className="text-xs text-muted-foreground uppercase tracking-wide flex items-center gap-2">
                      <ImageIcon className="h-3 w-3" />
                      Profile Image
                    </p>
                    <div className="rounded-lg border border-border/70 p-3 bg-muted/40">
                      <p className="text-[11px] break-all text-muted-foreground font-mono">{user.image}</p>
                    </div>
                  </div>
                  <Separator />
                </>
              )}
              {accountCreatedDate && (
                <>
                  <Separator />
                  <div className="space-y-2">
                    <p className="text-xs text-muted-foreground uppercase tracking-wide">Account Created</p>
                    <p className="text-sm font-medium flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      {accountCreatedDate}
                    </p>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
              
          <Card className="relative overflow-hidden group hover:shadow-xl hover:shadow-primary/10 transition-all duration-300 animate-slide-up [animation-delay:400ms]">
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl group-hover:bg-primary/10 transition-colors duration-300" />
            <CardHeader>
              <CardTitle className="text-lg">Actions</CardTitle>
              <CardDescription>Manage your account</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col sm:flex-row gap-4">
              <Button
                variant="outline"
                className="flex-1 transition-all duration-300 hover:scale-105 hover:shadow-md"
                asChild
              >
                <Link to="/dashboard">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Dashboard
                </Link>
              </Button>
              <Button
                variant="destructive"
                className="flex-1 transition-all duration-300 hover:scale-105 hover:shadow-md"
                onClick={() => {
                  authClient.signOut({
                    fetchOptions: {
                      onSuccess: () => {
                        navigate({ to: '/' })
                      },
                    },
                  })
                }}
              >
                <LogOut className="h-4 w-4 mr-2" />
                Sign Out
              </Button>
            </CardContent>
          </Card>
        </div>
      </main>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
