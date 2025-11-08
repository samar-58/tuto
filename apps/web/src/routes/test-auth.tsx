import { createFileRoute, useNavigate } from '@tanstack/react-router'

export const Route = createFileRoute('/test-auth')({
  component: RouteComponent,
})

function RouteComponent() {
  return <App />
}
import {
    Authenticated,
    Unauthenticated,
    AuthLoading,
  } from "convex/react";
import SignUpForm from '@/components/sign-up-form';
import SignInForm from '@/components/sign-in-component';
import { useEffect, useState } from 'react';
import { authClient } from '@/lib/auth-client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { api } from '@tuto/backend/convex/_generated/api';
import { convexQuery } from '@convex-dev/react-query';
import { useQuery } from '@tanstack/react-query';

  function App() {
    const [showSignIn, setShowSignIn] = useState(false);
    const [username,setUsername]=useState("");
    const {data:session} = authClient.useSession();
    const {data:engress} = useQuery(convexQuery(api.getPresignedUrl.list, {}));
    console.log(engress);
    const navigation = useNavigate()
    useEffect(()=>{
    if(session?.user.name){
      setUsername(session.user.name)
    }
    },[])
    return (
      <main>
        <Unauthenticated>
          {showSignIn ? (
            <SignInForm onSwitchToSignUp={() => setShowSignIn(false)} />
          ) : (
            <SignUpForm onSwitchToSignIn={() => setShowSignIn(true)} />
          )}
        </Unauthenticated>
        <Authenticated>
          <div className="min-h-screen bg-gradient-to-br from-purple-100 via-purple-50 to-white p-6">
            <div className="container mx-auto max-w-4xl">
              <div className="mb-6">
                <h1 className="text-3xl font-bold text-gray-800 mb-2">Welcome {username}</h1>
                <p className="text-gray-600 mb-4">Manage your meeting recordings</p>
                <Button onClick={()=>navigation({to:"/meetings"})} className="bg-purple-600 hover:bg-purple-700">
                  Create New Meeting
                </Button>
              </div>
              
              <div className="mb-4">
                <h2 className="text-2xl font-semibold text-gray-800 mb-4">Recordings</h2>
                {engress && engress.length > 0 ? (
                  <div className="grid gap-4 md:grid-cols-2">
                    {engress.map((recording) => (
                      <Card key={recording._id} className="bg-white/90 backdrop-blur-sm border-purple-200">
                        <CardHeader>
                          <CardTitle className="text-lg">{recording.roomName}</CardTitle>
                          <CardDescription>
                            Recorded by {recording.username}
                          </CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="text-sm text-gray-600">Status:</span>
                              <span className={`px-2 py-1 rounded text-xs font-medium ${
                                recording.status === 'recording' 
                                  ? 'bg-yellow-100 text-yellow-800' 
                                  : recording.status === 'completed'
                                  ? 'bg-green-100 text-green-800'
                                  : 'bg-gray-100 text-gray-800'
                              }`}>
                                {recording.status}
                              </span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-sm text-gray-600">Egress ID:</span>
                              <span className="text-xs font-mono text-gray-500 truncate max-w-[200px]">
                                {recording.egressId}
                              </span>
                            </div>
                            {recording.startedAt && (
                              <div className="flex items-center justify-between">
                                <span className="text-sm text-gray-600">Started:</span>
                                <span className="text-xs text-gray-500">
                                  {new Date(recording.startedAt).toLocaleString()}
                                </span>
                              </div>
                            )}
                            {recording.videoUrl && (
                              <div className="pt-2">
                                <a 
                                  href={recording.videoUrl} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="text-sm text-purple-600 hover:text-purple-700 underline"
                                >
                                  View Recording →
                                </a>
                              </div>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 bg-white/90 backdrop-blur-sm border border-purple-200 rounded-xl">
                    <p className="text-gray-600">No recordings yet. Create a meeting to start recording!</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </Authenticated>
        <AuthLoading>Loading...</AuthLoading>
      </main>
    );
  }


  
  export default App;