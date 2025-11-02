import { createFileRoute } from '@tanstack/react-router'

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
import { useState } from 'react';
  
  function App() {
    const [showSignIn, setShowSignIn] = useState(false);
    return (
      <main>
        <Unauthenticated>
          {showSignIn ? (
            <SignInForm onSwitchToSignUp={() => setShowSignIn(false)} />
          ) : (
            <SignUpForm onSwitchToSignIn={() => setShowSignIn(true)} />
          )}
        </Unauthenticated>
        <Authenticated> Only authenticated users can see this content</Authenticated>
        <AuthLoading>Loading...</AuthLoading>
      </main>
    );
  }


  
  export default App;