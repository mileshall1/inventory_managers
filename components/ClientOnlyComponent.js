// ClientOnlyComponent.js
'use client';
import useIsBrowser from './useIsBrowser';

const ClientOnlyComponent = () => {
  const isBrowser = useIsBrowser();

  if (!isBrowser) {
    return <div>Loading...</div>; // or a spinner component
  }

  try {
    return (
      <div>
        <h1>This component only runs in the browser!</h1>
        <p>You can safely use browser APIs here.</p>
      </div>
    );
  } catch (error) {
    console.error('Error in ClientOnlyComponent:', error);
    return <div>Something went wrong.</div>;
  }
};

export default ClientOnlyComponent;
