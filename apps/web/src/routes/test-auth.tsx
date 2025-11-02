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

  
  function App() {
    const [showSignIn, setShowSignIn] = useState(false);
    const [username,setUsername]=useState("");
    const {data:session} = authClient.useSession();
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
        <Authenticated> Only authenticated users can see this content
          <div>Welcome {username}</div>
          <div>Click here to create a meeting
            <Button onClick={()=>navigation({to:"/meetings"})}>
            </Button>
          </div>
        </Authenticated>
        <AuthLoading>Loading...</AuthLoading>
      </main>
    );
  }


  
  export default App;